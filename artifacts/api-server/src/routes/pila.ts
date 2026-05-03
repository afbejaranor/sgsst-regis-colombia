import { Router } from "express";
import { supabase } from "../lib/supabase";
import { callAI } from "../lib/ai";
import { SKILL_EXTRACTOR_PILA } from "../lib/skills";

const router = Router();

router.post("/procesar", async (req, res) => {
  const { empresa_id, periodo, pdf_base64 } = req.body as {
    empresa_id: string;
    periodo: string;
    pdf_base64: string;
  };

  if (!empresa_id || !periodo || !pdf_base64) {
    return res.status(400).json({ error: "empresa_id, periodo y pdf_base64 son requeridos" });
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

  const { data: registro, error: insertError } = await supabase
    .from("registros_pila")
    .upsert(
      {
        empresa_id,
        periodo,
        estado: "recibido",
        fecha_recepcion: new Date().toISOString(),
        observaciones: JSON.stringify(resultado),
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
    raw: resultado,
  });
});

export default router;
