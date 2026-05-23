import { Router } from "express";
import { db } from "@workspace/db";
import { registrosPilaTable, empresasTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { callAI } from "../lib/ai";
import { SKILL_EXTRACTOR_PILA } from "../lib/skills";
import { DEMO_EMPRESAS } from "../lib/demo-data";
import { uploadToEmpresaFolder } from "../lib/drive-client";

const router = Router();

async function resolveEmpresaNombre(empresaId: string): Promise<string | null> {
  const demo = DEMO_EMPRESAS.find((e) => e.id === empresaId);
  if (demo) return demo.nombre;
  try {
    const rows = await db.select({ nombre: empresasTable.nombre })
      .from(empresasTable)
      .where(eq(empresasTable.id, empresaId))
      .limit(1);
    return rows[0]?.nombre ?? null;
  } catch {
    return null;
  }
}

function extractTextFromPdf(pdfBase64: string): string {
  const buf = Buffer.from(pdfBase64, "base64");
  const raw = buf.toString("binary");
  const sequences = raw.match(/[\x20-\x7E\n\r\t]{6,}/g) ?? [];
  const text = sequences
    .map((s) => s.trim())
    .filter((s) => s.length > 5)
    .filter((s) => !/^[\d\s./\\()\[\]<>*+=@#$%^&!]+$/.test(s))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return text.length > 200 ? text.substring(0, 8000) : "";
}

router.get("/:empresaId", async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(registrosPilaTable)
      .where(eq(registrosPilaTable.empresa_id, req.params.empresaId))
      .orderBy(desc(registrosPilaTable.created_at));

    const records = rows.map((r) => {
      let parsed: Record<string, unknown> = {};
      try { parsed = JSON.parse(r.observaciones ?? "{}"); } catch { /* ignore */ }
      return {
        id: r.id,
        periodo: r.periodo,
        estado: (parsed.estado as string) ?? r.estado,
        num_afiliados: (parsed.num_afiliados as Record<string, number>) ?? {},
        aportes_liquidados: (parsed.aportes_liquidados as Record<string, number>) ?? {},
        total: ((parsed.aportes_liquidados as Record<string, number>)?.total ?? null) as number | null,
        alertas: (parsed.alertas_validacion as string[]) ?? [],
        drive_url: r.drive_url,
        fecha_recepcion: r.fecha_recepcion,
      };
    });
    return res.json(records);
  } catch (err) {
    req.log.warn({ err }, "DB unavailable for planillas PILA");
    return res.json([]);
  }
});

router.post("/procesar", async (req, res) => {
  const { empresa_id, periodo, pdf_base64 } = req.body as {
    empresa_id: string;
    periodo: string;
    pdf_base64: string;
  };

  if (!empresa_id || !periodo || !pdf_base64) {
    return res.status(400).json({ error: "empresa_id, periodo y pdf_base64 son requeridos" });
  }

  const empresaNombre = await resolveEmpresaNombre(empresa_id);
  if (!empresaNombre) {
    req.log.warn({ empresa_id }, "Could not resolve empresa name — Drive upload skipped");
  }

  // Extract readable text from the PDF instead of sending raw base64
  const extractedText = extractTextFromPdf(pdf_base64);
  const contenidoPila = extractedText.length > 100
    ? `Texto extraído del PDF:\n${extractedText}`
    : `No se pudo extraer texto legible del PDF. Período solicitado: ${periodo}. Genera datos estimados marcados como confianza baja.`;

  const userMsg = `Extrae la información de esta planilla PILA del período ${periodo}.

${contenidoPila}

Devuelve ÚNICAMENTE el JSON estructurado.`;

  let resultado: Record<string, unknown>;
  try {
    resultado = (await callAI(SKILL_EXTRACTOR_PILA, userMsg)) as Record<string, unknown>;
  } catch (err) {
    req.log.error({ err }, "AI PILA extraction failed");
    resultado = {
      periodo,
      estado: "pendiente",
      num_afiliados: { salud: 0, pension: 0, arl: 0, ccf: 0 },
      aportes_liquidados: { salud: 0, pension: 0, arl: 0, ccf: 0, total: 0 },
      alertas_validacion: ["Error al procesar con IA. Verifique manualmente."],
      datos_extraidos_confianza: "baja",
    };
  }

  let driveUrl: string | null = null;
  if (empresaNombre) {
    const periodoSlug = periodo.replace("-", "_");
    const safeNombre = empresaNombre.replace(/[^a-zA-Z0-9]/g, "_").replace(/_+/g, "_");
    const fileName = `PILA_${safeNombre}_${periodoSlug}.pdf`;
    const pdfBuffer = Buffer.from(pdf_base64, "base64");
    driveUrl = await uploadToEmpresaFolder(empresaNombre, "PILA", fileName, pdfBuffer, "application/pdf");
    if (driveUrl) {
      req.log.info({ empresa_id, periodo, driveUrl }, "PILA PDF uploaded to Drive");
    } else {
      req.log.warn({ empresa_id, periodo }, "PILA Drive upload failed — continuing without Drive link");
    }
  }

  const estadoExtraido = (resultado.estado as string) ?? "recibido";

  let registroId: string;
  try {
    const rows = await db.insert(registrosPilaTable)
      .values({
        empresa_id,
        periodo,
        estado: estadoExtraido,
        fecha_recepcion: new Date(),
        observaciones: JSON.stringify(resultado),
        drive_url: driveUrl ?? null,
      })
      .onConflictDoUpdate({
        target: [registrosPilaTable.empresa_id, registrosPilaTable.periodo],
        set: {
          estado: estadoExtraido,
          fecha_recepcion: new Date(),
          observaciones: JSON.stringify(resultado),
          drive_url: driveUrl ?? null,
          updated_at: new Date(),
        },
      })
      .returning({ id: registrosPilaTable.id });
    registroId = rows[0].id;
  } catch (err) {
    req.log.error({ err }, "Failed to persist registro PILA");
    registroId = crypto.randomUUID();
  }

  return res.json({
    registro_id: registroId,
    periodo,
    estado: estadoExtraido,
    num_afiliados: (resultado.num_afiliados as Record<string, number>) ?? {},
    aportes_liquidados: (resultado.aportes_liquidados as Record<string, number>) ?? {},
    alertas: (resultado.alertas_validacion as string[]) ?? [],
    drive_url: driveUrl ?? null,
    drive_disponible: driveUrl !== null,
    raw: resultado,
  });
});

export default router;
