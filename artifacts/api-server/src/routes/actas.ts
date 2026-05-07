import { Router, Request, Response } from "express";
import { supabase } from "../lib/supabase";
import { callAI } from "../lib/ai";
import { SKILL_ACTAS_COPASST } from "../lib/skills";
import {
  getDemoActas,
  getDemoActaById,
  addDemoActa,
  updateDemoActa,
  DEMO_EMPRESAS,
} from "../lib/demo-data";
import { generateActaDocx, generateActaPdf, EmpresaData } from "../lib/doc-generator";
import { uploadToEmpresaFolder } from "../lib/drive-client";

const router = Router();

async function resolveEmpresa(empresaId: string): Promise<EmpresaData> {
  const demo = DEMO_EMPRESAS.find((e) => e.id === empresaId);
  if (demo) return demo;
  const { data } = await supabase
    .from("empresas")
    .select("id, nombre, nit, codigo_ciiu, ciudad")
    .eq("id", empresaId)
    .single();
  return (data as EmpresaData | null) ?? { id: "", nombre: "Empresa", nit: "—", codigo_ciiu: "—", ciudad: "—" };
}

async function getNextVersion(empresaId: string, tipoComite: string): Promise<number> {
  const demoMax = getDemoActas()
    .filter((a) => a.empresa_id === empresaId && a.tipo_comite === tipoComite)
    .reduce((max, a) => Math.max(max, Number(a.version ?? 0)), 0);

  const { data } = await supabase
    .from("actas_comite")
    .select("version")
    .eq("empresa_id", empresaId)
    .eq("tipo_comite", tipoComite)
    .order("version", { ascending: false })
    .limit(1);

  const supaMax = (data?.[0] as { version?: number } | null)?.version ?? 0;
  return Math.max(demoMax, supaMax) + 1;
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

  const comprimisosArr = Array.isArray(resultado.compromisos) ? (resultado.compromisos as unknown[]) : [];

  const newActa: Record<string, unknown> = {
    id: crypto.randomUUID(),
    empresa_id,
    numero_acta: numeroActa,
    tipo_comite,
    version,
    fecha_reunion: fecha,
    fecha,
    hora_inicio,
    hora_fin,
    lugar,
    citada_por: citada_por ?? empresa.nombre,
    puntos_tratados: puntos,
    puntos_orden: puntos,
    asistentes_confirmados: asistentes,
    asistentes,
    compromisos: comprimisosArr,
    acta_generada: resultado.texto_acta_completo ?? JSON.stringify(resultado),
    texto_acta: resultado.texto_acta_completo ?? JSON.stringify(resultado),
    estado: "borrador",
    drive_url: null,
    created_at: new Date().toISOString(),
  };

  const { data: actaDb, error: insertError } = await supabase
    .from("actas_comite")
    .insert({
      empresa_id,
      numero_acta: numeroActa,
      tipo_comite,
      version,
      fecha_reunion: fecha,
      lugar,
      citada_por: citada_por ?? empresa.nombre,
      puntos_tratados: puntos,
      acta_generada: resultado.texto_acta_completo ?? JSON.stringify(resultado),
      estado: "borrador",
      asistentes_confirmados: asistentes,
      compromisos: comprimisosArr,
    })
    .select()
    .single();

  const actaId = insertError ? (newActa.id as string) : actaDb.id;
  if (insertError) addDemoActa(newActa);

  return res.json({
    acta_id: actaId,
    numero_acta: numeroActa,
    tipo_comite,
    version,
    fecha,
    compromisos: (resultado.compromisos as unknown[]) ?? [],
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

  let acta = (getDemoActaById(actaId) ?? null) as Record<string, unknown> | null;
  if (!acta) {
    const { data } = await supabase.from("actas_comite").select("*").eq("id", actaId).single();
    acta = data ?? null;
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
  if (!driveUrl) {
    req.log.warn({ actaId, fileName }, "Drive upload failed — file not saved to Drive");
  } else {
    updateDemoActa(actaId, { drive_url: driveUrl });
    await supabase
      .from("actas_comite")
      .update({ drive_url: driveUrl })
      .eq("id", actaId);
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

  let acta = (getDemoActaById(actaId) ?? null) as Record<string, unknown> | null;
  if (!acta) {
    const { data } = await supabase.from("actas_comite").select("*").eq("id", actaId).single();
    acta = data ?? null;
  }
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

  updateDemoActa(actaId, { drive_url_firmada: driveUrl, estado: "firmado" });
  await supabase
    .from("actas_comite")
    .update({ drive_url_firmada: driveUrl, estado: "firmado" })
    .eq("id", actaId);

  req.log.info({ actaId, driveUrl }, "Signed acta uploaded to Drive");
  return res.json({ drive_url: driveUrl });
});

router.get("/:empresaId", async (req, res) => {
  const { data, error } = await supabase
    .from("actas_comite")
    .select("id, empresa_id, tipo_comite, numero_acta, version, fecha_reunion, estado, drive_url, created_at")
    .eq("empresa_id", req.params.empresaId)
    .order("created_at", { ascending: false });

  if (error) {
    return res.json(
      getDemoActas()
        .filter((a) => a.empresa_id === req.params.empresaId)
        .map((a) => ({
          id: a.id,
          empresa_id: a.empresa_id,
          tipo_comite: a.tipo_comite,
          numero_acta: a.numero_acta,
          version: a.version,
          fecha_reunion: a.fecha_reunion ?? a.fecha,
          estado: a.estado ?? "borrador",
          drive_url: a.drive_url ?? null,
          created_at: a.created_at,
        }))
    );
  }
  const demo = getDemoActas()
    .filter((a) => a.empresa_id === req.params.empresaId)
    .map((a) => ({
      id: a.id,
      empresa_id: a.empresa_id,
      tipo_comite: a.tipo_comite,
      numero_acta: a.numero_acta,
      version: a.version,
      fecha_reunion: a.fecha_reunion ?? a.fecha,
      estado: a.estado ?? "borrador",
      drive_url: a.drive_url ?? null,
      created_at: a.created_at,
    }));
  return res.json([...(data ?? []), ...demo]);
});

export default router;
