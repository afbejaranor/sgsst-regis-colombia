import { Router } from "express";
import { supabase } from "../lib/supabase";
import { callAI } from "../lib/ai";
import { SKILL_EXTRACTOR_MEDICO } from "../lib/skills";
import { getDemoExamenes, addDemoExamen } from "../lib/demo-data";

const router = Router();

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

  const userMsg = `El siguiente contenido es un examen médico ocupacional. Analízalo y extrae la información estructurada bajo Res. 2346/2007.

PDF Base64 (primeros 500 chars): ${pdf_base64.substring(0, 500)}...
Nombre trabajador: ${nombre_trabajador ?? "No especificado"}`;

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

  const newExamen: Record<string, unknown> = {
    id: crypto.randomUUID(),
    empresa_id,
    trabajador_id: trabajador_id ?? null,
    concepto: (resultado.concepto as string) ?? "pendiente",
    tipo: (resultado.tipo_examen as string) ?? null,
    fecha_examen: (resultado.fecha_examen as string) ?? null,
    medico: (resultado.medico_nombre as string) ?? null,
    restricciones: resultado.restricciones ?? [],
    recomendaciones: resultado.recomendaciones ?? [],
    texto_completo: JSON.stringify(resultado),
    created_at: new Date().toISOString(),
  };

  const { data: examen, error: insertError } = await supabase
    .from("examenes_medicos")
    .insert({
      empresa_id,
      trabajador_id: trabajador_id ?? null,
      concepto: newExamen.concepto,
      tipo: newExamen.tipo,
      fecha_examen: newExamen.fecha_examen,
      medico: newExamen.medico,
      restricciones: resultado.restricciones ?? [],
      recomendaciones: resultado.recomendaciones ?? [],
      texto_completo: JSON.stringify(resultado),
    })
    .select()
    .single();

  const savedExamen = insertError ? newExamen : examen;
  if (insertError) addDemoExamen(newExamen);

  return res.json({
    examen_id: savedExamen.id,
    concepto: resultado.concepto ?? "pendiente",
    restricciones: resultado.restricciones ?? [],
    recomendaciones: resultado.recomendaciones ?? [],
    requiere_seguimiento: resultado.requiere_seguimiento ?? false,
    raw: resultado,
  });
});

router.get("/:empresaId", async (req, res) => {
  const { data, error } = await supabase
    .from("examenes_medicos")
    .select("*")
    .eq("empresa_id", req.params.empresaId)
    .order("created_at", { ascending: false });

  if (error) {
    return res.json(getDemoExamenes().filter((e) => e.empresa_id === req.params.empresaId));
  }
  const combined = [...(data ?? []), ...getDemoExamenes().filter((e) => e.empresa_id === req.params.empresaId)];
  return res.json(combined);
});

export default router;
