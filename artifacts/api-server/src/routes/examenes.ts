import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { examenesMedicosTable, empresasTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { callAI } from "../lib/ai";
import { SKILL_EXTRACTOR_MEDICO } from "../lib/skills";
import { DEMO_EMPRESAS, getDemoExamenById } from "../lib/demo-data";
import { generateExamenDocx, generateExamenPdf, EmpresaData } from "../lib/doc-generator";
import { uploadToEmpresaFolder } from "../lib/drive-client";
import { sendEmail, buildExamenConfirmacionHtml } from "../lib/email";

const router = Router();

const examenCache = new Map<string, Record<string, unknown>>();

function extractTextFromPdf(pdfBase64: string): string {
  try {
    const buf = Buffer.from(pdfBase64, "base64");
    const raw = buf.toString("binary");
    // Extract printable ASCII sequences (PDF text is often uncompressed for simple forms)
    const sequences = raw.match(/[\x20-\x7E\n\r\t]{6,}/g) ?? [];
    const text = sequences
      .map((s) => s.trim())
      .filter((s) => s.length > 5)
      .filter((s) => !/^[\d\s./\\()\[\]<>*+=@#$%^&!]+$/.test(s))
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    return text.length > 200 ? text.substring(0, 8000) : "";
  } catch {
    return "";
  }
}

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

router.post("/procesar", async (req, res) => {
  const { empresa_id, trabajador_id, pdf_base64, nombre_trabajador, cedula_trabajador } = req.body as {
    empresa_id: string;
    trabajador_id?: string;
    pdf_base64: string;
    nombre_trabajador?: string;
    cedula_trabajador?: string;
  };

  if (!empresa_id || !pdf_base64) {
    return res.status(400).json({ error: "empresa_id y pdf_base64 son requeridos" });
  }

  const extractedText = extractTextFromPdf(pdf_base64);
  const userMsg = extractedText.length > 0
    ? `Examen médico ocupacional bajo Res. 2346/2007 Colombia. Extrae toda la información estructurada disponible.

CONTENIDO DEL DOCUMENTO:
${extractedText}

Nombre del trabajador (del sistema): ${nombre_trabajador ?? "No especificado"}
Cédula (del sistema): ${cedula_trabajador ?? "No especificado"}`
    : `Examen médico ocupacional bajo Res. 2346/2007. El PDF es de imagen escaneada (no hay texto extraíble).
Nombre del trabajador: ${nombre_trabajador ?? "No especificado"}
Cédula: ${cedula_trabajador ?? "No especificado"}
Devuelve concepto "pendiente" con observacion_adicional indicando que se requiere revisión manual del documento físico.`;

  let resultado: Record<string, unknown>;
  try {
    resultado = (await callAI(SKILL_EXTRACTOR_MEDICO, userMsg)) as Record<string, unknown>;
  } catch (err) {
    req.log.error({ err }, "AI extraction failed");
    resultado = {
      concepto: "pendiente",
      restricciones: [],
      recomendaciones: [],
      requiere_seguimiento: true,
      observaciones_adicionales: "Error al procesar con IA. Revisar manualmente.",
    };
  }

  let examenId: string;
  try {
    const rows = await db.insert(examenesMedicosTable).values({
      empresa_id,
      trabajador_id: trabajador_id ?? null,
      nombre_trabajador: nombre_trabajador ?? null,
      cedula_trabajador: cedula_trabajador ?? null,
      cargo: (resultado.cargo as string) ?? null,
      concepto: (resultado.concepto as string) ?? "pendiente",
      tipo: (resultado.tipo_examen as string) ?? null,
      fecha_examen: (resultado.fecha_examen as string) ?? null,
      medico: (resultado.medico_nombre as string) ?? null,
      restricciones: (resultado.restricciones as unknown[]) ?? [],
      recomendaciones: (resultado.recomendaciones as unknown[]) ?? [],
      texto_completo: JSON.stringify(resultado),
    }).returning({ id: examenesMedicosTable.id });
    examenId = rows[0].id;
  } catch (err) {
    req.log.error({ err }, "Failed to persist examen to DB");
    examenId = crypto.randomUUID();
    examenCache.set(examenId, {
      id: examenId,
      empresa_id,
      nombre_trabajador: nombre_trabajador ?? null,
      cedula_trabajador: cedula_trabajador ?? null,
      concepto: (resultado.concepto as string) ?? "pendiente",
      tipo: (resultado.tipo_examen as string) ?? null,
      fecha_examen: (resultado.fecha_examen as string) ?? null,
      medico: (resultado.medico_nombre as string) ?? null,
      restricciones: (resultado.restricciones as unknown[]) ?? [],
      recomendaciones: (resultado.recomendaciones as unknown[]) ?? [],
    });
  }

  const emailTrabajador = (resultado.email_trabajador as string | undefined) ?? null;
  if (emailTrabajador) {
    const empresaInfo = await resolveEmpresa(empresa_id);
    sendEmail(
      emailTrabajador,
      `Resultado examen médico ocupacional — ${empresaInfo.nombre}`,
      buildExamenConfirmacionHtml({
        nombreTrabajador: nombre_trabajador ?? "Trabajador",
        concepto: (resultado.concepto as string) ?? "pendiente",
        empresa: empresaInfo.nombre,
        fecha: new Date().toLocaleDateString("es-CO"),
      })
    ).catch(() => {});
  }

  return res.json({
    examen_id: examenId,
    nombre_trabajador: nombre_trabajador ?? null,
    concepto: resultado.concepto ?? "pendiente",
    restricciones: resultado.restricciones ?? [],
    recomendaciones: resultado.recomendaciones ?? [],
    requiere_seguimiento: resultado.requiere_seguimiento ?? false,
    raw: resultado,
  });
});

async function handleInforme(req: Request, res: Response) {
  const examenId = String(req.params.examenId);
  const formato = (String(req.query.formato ?? "docx") || "docx").toLowerCase();
  if (formato !== "docx" && formato !== "pdf") {
    return res.status(400).json({ error: "Formato inválido. Use 'docx' o 'pdf'." });
  }

  let examen: Record<string, unknown> | null = null;
  try {
    const rows = await db.select().from(examenesMedicosTable).where(eq(examenesMedicosTable.id, examenId)).limit(1);
    examen = rows[0] as Record<string, unknown> ?? null;
  } catch (err) {
    req.log.warn({ err }, "DB unavailable for examen informe, trying demo fallback");
  }
  if (!examen) {
    examen = examenCache.get(examenId) ?? null;
  }
  if (!examen) {
    examen = getDemoExamenById(examenId) ?? null;
  }
  if (!examen) {
    return res.status(404).json({ error: "Examen no encontrado" });
  }

  const empresa = await resolveEmpresa(examen.empresa_id as string);

  const nombreTrabajador = (examen.nombre_trabajador as string) ?? "Trabajador";
  const fechaHoy = new Date().toISOString().slice(0, 10);
  const safeName = nombreTrabajador.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_-]/g, "");

  let buffer: Buffer;
  let contentType: string;
  let fileName: string;

  try {
    if (formato === "pdf") {
      buffer = await generateExamenPdf(examen, empresa);
      contentType = "application/pdf";
      fileName = `Examen_${safeName}_${fechaHoy}.pdf`;
    } else {
      buffer = await generateExamenDocx(examen, empresa);
      contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      fileName = `Examen_${safeName}_${fechaHoy}.docx`;
    }
  } catch (err) {
    req.log.error({ err }, "Document generation failed");
    return res.status(500).json({ error: "Error al generar el documento" });
  }

  const driveUrl = await uploadToEmpresaFolder(empresa.nombre, "Examenes", fileName, buffer, contentType);
  if (driveUrl) {
    try {
      await db.update(examenesMedicosTable).set({ drive_url: driveUrl }).where(eq(examenesMedicosTable.id, examenId));
    } catch (err) {
      req.log.warn({ err }, "Failed to update drive_url for examen");
    }
  }

  res.setHeader("Content-Type", contentType);
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
  if (driveUrl) res.setHeader("X-Drive-Url", driveUrl);
  return res.send(buffer);
}

router.get("/:examenId/informe", handleInforme);
router.post("/:examenId/informe", handleInforme);

router.get("/:empresaId", async (req, res) => {
  try {
    const data = await db.select()
      .from(examenesMedicosTable)
      .where(eq(examenesMedicosTable.empresa_id, req.params.empresaId))
      .orderBy(desc(examenesMedicosTable.created_at));
    return res.json(data);
  } catch (err) {
    req.log.warn({ err }, "DB unavailable for examenes");
    return res.json([]);
  }
});

export default router;
