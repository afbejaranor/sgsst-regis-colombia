import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { actasComiteTable, empresasTable } from "@workspace/db";
import { eq, and, desc, max } from "drizzle-orm";
import { callAI } from "../lib/ai";
import { SKILL_ACTAS_COPASST } from "../lib/skills";
import { DEMO_EMPRESAS } from "../lib/demo-data";
import { generateActaDocx, generateActaPdf, EmpresaData } from "../lib/doc-generator";
import { uploadToEmpresaFolder } from "../lib/drive-client";

const router = Router();

async function resolveEmpresa(empresaId: string): Promise<EmpresaData> {
  const demo = DEMO_EMPRESAS.find((e) => e.id === empresaId);
  if (demo) return demo;
  try {
    const rows = await db.select({
      id: empresasTable.id,
      nombre: empresasTable.nombre,
      nit: empresasTable.nit,
      codigo_ciiu: empresasTable.codigo_ciiu,
      ciudad: empresasTable.ciudad,
    }).from(empresasTable).where(eq(empresasTable.id, empresaId)).limit(1);
    if (rows.length) return rows[0] as EmpresaData;
  } catch { /* ignore */ }
  return { id: "", nombre: "Empresa", nit: "—", codigo_ciiu: "—", ciudad: "—" };
}

async function getNextVersion(empresaId: string, tipoComite: string): Promise<number> {
  try {
    const rows = await db.select({ v: max(actasComiteTable.version) })
      .from(actasComiteTable)
      .where(and(
        eq(actasComiteTable.empresa_id, empresaId),
        eq(actasComiteTable.tipo_comite, tipoComite)
      ));
    return (rows[0]?.v ?? 0) + 1;
  } catch {
    return 1;
  }
}

function safeSlug(text: string, maxLen = 30): string {
  return text.replace(/[^a-zA-Z0-9]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "").substring(0, maxLen);
}

router.post("/generar", async (req, res) => {
  const {
    empresa_id,
    tipo_comite,
    fecha,
    hora_inicio,
    hora_fin,
    lugar,
    citada_por,
    asistentes,
    puntos,
    transcripcion,
  } = req.body as {
    empresa_id: string;
    tipo_comite: "COPASST" | "convivencia";
    fecha: string;
    hora_inicio: string;
    hora_fin: string;
    lugar: string;
    citada_por?: string;
    asistentes: unknown[];
    puntos: string[];
    transcripcion?: string;
  };

  const empresa = await resolveEmpresa(empresa_id);
  const version = await getNextVersion(empresa_id, tipo_comite);

  const userMsg = `Genera el acta para:
Empresa: ${empresa.nombre} | NIT: ${empresa.nit} | Ciudad: ${empresa.ciudad ?? ""}
Tipo comité: ${tipo_comite}
Fecha reunión: ${fecha}
Hora: ${hora_inicio} - ${hora_fin}
Lugar: ${lugar}
Asistentes: ${JSON.stringify(asistentes)}
Puntos tratados: ${JSON.stringify(puntos)}
Transcripción audio: ${transcripcion ?? "No disponible"}
Devuelve ÚNICAMENTE el JSON estructurado.`;

  let resultado: Record<string, unknown>;
  try {
    resultado = (await callAI(SKILL_ACTAS_COPASST, userMsg)) as Record<string, unknown>;
  } catch (err) {
    req.log.error({ err }, "AI acta generation failed");
    return res.status(500).json({ error: "Error al generar el acta con IA" });
  }

  const numeroActa = (resultado.numero_acta as string) ?? `${tipo_comite}-${fecha.substring(0, 7)}-v${version}`;
  const compromisosArr = Array.isArray(resultado.compromisos) ? (resultado.compromisos as unknown[]) : [];

  let actaId: string;
  try {
    const rows = await db.insert(actasComiteTable).values({
      empresa_id,
      numero_acta: numeroActa,
      tipo_comite,
      version,
      fecha_reunion: fecha,
      lugar,
      hora_inicio,
      hora_fin,
      citada_por: citada_por ?? empresa.nombre,
      puntos_tratados: puntos,
      asistentes_confirmados: asistentes,
      compromisos: compromisosArr,
      acta_generada: (resultado.texto_acta_completo as string) ?? JSON.stringify(resultado),
      estado: "borrador",
    }).returning({ id: actasComiteTable.id });
    actaId = rows[0].id;
  } catch (err) {
    req.log.error({ err }, "Failed to persist acta to DB");
    actaId = crypto.randomUUID();
  }

  return res.json({
    acta_id: actaId,
    numero_acta: numeroActa,
    tipo_comite,
    version,
    fecha,
    compromisos: compromisosArr,
    texto_acta_completo: (resultado.texto_acta_completo as string) ?? JSON.stringify(resultado),
    raw: resultado,
  });
});

async function handleExportar(req: Request, res: Response) {
  const actaId = String(req.params.actaId);
  const formato = (String(req.query.formato ?? "docx") || "docx").toLowerCase();
  if (formato !== "docx" && formato !== "pdf") {
    return res.status(400).json({ error: "Formato inválido. Use 'docx' o 'pdf'." });
  }

  let acta: Record<string, unknown> | null = null;
  try {
    const rows = await db.select().from(actasComiteTable).where(eq(actasComiteTable.id, actaId)).limit(1);
    acta = rows[0] as Record<string, unknown> ?? null;
  } catch (err) {
    req.log.error({ err }, "Error fetching acta for export");
  }
  if (!acta) {
    return res.status(404).json({ error: "Acta no encontrada" });
  }

  const empresa = await resolveEmpresa(acta.empresa_id as string);
  const tipoComite = ((acta.tipo_comite as string) ?? "COPASST").toUpperCase();
  const version = Number(acta.version ?? 1);
  const safeEmpresa = safeSlug(empresa.nombre, 30);
  const fechaHoy = new Date().toISOString().slice(0, 10);
  const baseName = `Acta_${tipoComite}_${safeEmpresa}_v${version}_${fechaHoy}`;

  let buffer: Buffer;
  let contentType: string;
  let fileName: string;

  try {
    if (formato === "pdf") {
      buffer = await generateActaPdf(acta, empresa);
      contentType = "application/pdf";
      fileName = `${baseName}.pdf`;
    } else {
      buffer = await generateActaDocx(acta, empresa);
      contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      fileName = `${baseName}.docx`;
    }
  } catch (err) {
    req.log.error({ err }, "Acta document generation failed");
    return res.status(500).json({ error: "Error al generar el documento" });
  }

  const driveUrl = await uploadToEmpresaFolder(empresa.nombre, "Actas", fileName, buffer, contentType);
  if (driveUrl) {
    try {
      await db.update(actasComiteTable).set({ drive_url: driveUrl }).where(eq(actasComiteTable.id, actaId));
    } catch (err) {
      req.log.warn({ err }, "Failed to update drive_url for acta");
    }
  }

  res.setHeader("Content-Type", contentType);
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
  if (driveUrl) res.setHeader("X-Drive-Url", driveUrl);
  return res.send(buffer);
}

router.get("/:actaId/exportar", handleExportar);
router.post("/:actaId/exportar", handleExportar);

router.post("/:actaId/subir-firmada", async (req, res) => {
  const actaId = String(req.params.actaId);
  const { file_base64, file_name, mime_type } = req.body as {
    file_base64: string;
    file_name?: string;
    mime_type?: string;
  };

  if (!file_base64) return res.status(400).json({ error: "file_base64 requerido" });

  let acta: Record<string, unknown> | null = null;
  try {
    const rows = await db.select().from(actasComiteTable).where(eq(actasComiteTable.id, actaId)).limit(1);
    acta = rows[0] as Record<string, unknown> ?? null;
  } catch { /* ignore */ }
  if (!acta) return res.status(404).json({ error: "Acta no encontrada" });

  const empresa = await resolveEmpresa(acta.empresa_id as string);
  const tipoComite = ((acta.tipo_comite as string) ?? "COPASST").toUpperCase();
  const version = Number(acta.version ?? 1);
  const safeEmpresa = safeSlug(empresa.nombre, 30);
  const fechaHoy = new Date().toISOString().slice(0, 10);
  const safeName =
    file_name?.replace(/[^a-zA-Z0-9._-]/g, "_") ??
    `Acta_${tipoComite}_${safeEmpresa}_v${version}_firmada_${fechaHoy}.pdf`;
  const resolvedMime = mime_type ?? "application/pdf";

  let buffer: Buffer;
  try {
    buffer = Buffer.from(file_base64, "base64");
  } catch {
    return res.status(400).json({ error: "file_base64 inválido" });
  }

  const driveUrl = await uploadToEmpresaFolder(empresa.nombre, "Actas", safeName, buffer, resolvedMime);

  if (!driveUrl) {
    req.log.warn({ actaId }, "Drive upload failed for signed acta");
    return res.status(502).json({ error: "Error al subir el archivo a Drive" });
  }

  try {
    await db.update(actasComiteTable)
      .set({ drive_url_firmada: driveUrl, estado: "firmado" })
      .where(eq(actasComiteTable.id, actaId));
  } catch (err) {
    req.log.warn({ err }, "Failed to update signed acta state");
  }

  req.log.info({ actaId, driveUrl }, "Signed acta uploaded to Drive");
  return res.json({ drive_url: driveUrl });
});

router.get("/:empresaId", async (req, res) => {
  try {
    const data = await db.select({
      id: actasComiteTable.id,
      empresa_id: actasComiteTable.empresa_id,
      tipo_comite: actasComiteTable.tipo_comite,
      numero_acta: actasComiteTable.numero_acta,
      version: actasComiteTable.version,
      fecha_reunion: actasComiteTable.fecha_reunion,
      estado: actasComiteTable.estado,
      drive_url: actasComiteTable.drive_url,
      created_at: actasComiteTable.created_at,
    }).from(actasComiteTable)
      .where(eq(actasComiteTable.empresa_id, req.params.empresaId))
      .orderBy(desc(actasComiteTable.created_at));
    return res.json(data);
  } catch (err) {
    req.log.warn({ err }, "DB unavailable for actas");
    return res.json([]);
  }
});

export default router;
