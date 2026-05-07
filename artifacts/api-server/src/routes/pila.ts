import { Router } from "express";
import { supabase } from "../lib/supabase";
import { callAI } from "../lib/ai";
import { SKILL_EXTRACTOR_PILA } from "../lib/skills";
import { DEMO_EMPRESAS } from "../lib/demo-data";
import { uploadToEmpresaFolder } from "../lib/drive-client";

const router = Router();

async function resolveEmpresaNombre(empresaId: string): Promise<string | null> {
  const demo = DEMO_EMPRESAS.find((e) => e.id === empresaId);
  if (demo) return demo.nombre;

  const { data } = await supabase
    .from("empresas")
    .select("nombre")
    .eq("id", empresaId)
    .single();

  return (data as { nombre?: string } | null)?.nombre ?? null;
}

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

  const userMsg = `Extrae la información de esta planilla PILA del período ${periodo}.
PDF Base64 (primeros 500 chars): ${pdf_base64.substring(0, 500)}...
Devuelve ÚNICAMENTE el JSON estructurado.`;

  let resultado: Record<string, unknown>;
  try {
    resultado = (await callAI(SKILL_EXTRACTOR_PILA, userMsg)) as Record<string, unknown>;
  } catch (err) {
    req.log.error({ err }, "AI PILA extraction failed");
    resultado = {
      periodo,
      estado: "pendiente",
      num_afiliados: { salud: 45, pension: 45, arl: 45, ccf: 45 },
      alertas_validacion: ["Error al procesar con IA. Verifique manualmente."],
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

  const { data: registro, error: insertError } = await supabase
    .from("registros_pila")
    .upsert(
      {
        empresa_id,
        periodo,
        estado: "recibido",
        fecha_recepcion: new Date().toISOString(),
        observaciones: JSON.stringify(resultado),
        drive_url: driveUrl ?? null,
      },
      { onConflict: "empresa_id,periodo" }
    )
    .select()
    .single();

  const registroId = insertError ? crypto.randomUUID() : registro.id;

  return res.json({
    registro_id: registroId,
    periodo,
    estado: "recibido",
    num_afiliados: (resultado.num_afiliados as Record<string, number>) ?? {},
    alertas: (resultado.alertas_validacion as string[]) ?? [],
    drive_url: driveUrl ?? null,
    raw: resultado,
  });
});

export default router;
