import { Router } from "express";
import { supabase } from "../lib/supabase";
import { callAI } from "../lib/ai";
import { SKILL_MATRIZ_GTC45 } from "../lib/skills";
import { getDemoMatrices, addDemoMatriz } from "../lib/demo-data";

const router = Router();

router.post("/generar", async (req, res) => {
  const { empresa_id, ciiu, num_empleados, procesos, descripcion } = req.body as {
    empresa_id: string;
    ciiu: string;
    num_empleados?: number;
    procesos?: string;
    descripcion?: string;
  };

  if (!empresa_id || !ciiu) {
    return res.status(400).json({ error: "empresa_id y ciiu son requeridos" });
  }

  const userMsg = `Genera la matriz de peligros GTC-45 para:
Código CIIU: ${ciiu}
Número de trabajadores: ${num_empleados ?? "no especificado"}
Procesos principales: ${procesos ?? "según actividad típica del sector"}
Información adicional: ${descripcion ?? "ninguna"}

Devuelve ÚNICAMENTE el JSON estructurado.`;

  let resultado: Record<string, unknown>;
  try {
    resultado = (await callAI(SKILL_MATRIZ_GTC45, userMsg)) as Record<string, unknown>;
  } catch (err) {
    req.log.error({ err }, "AI matrix generation failed");
    return res.status(500).json({ error: "Error al generar la matriz con IA" });
  }

  const newMatriz: Record<string, unknown> = {
    id: crypto.randomUUID(),
    empresa_id,
    codigo_ciiu: ciiu,
    contenido_json: resultado,
    estado: "borrador",
    version: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data: matriz, error: insertError } = await supabase
    .from("matrices_riesgo")
    .insert({ empresa_id, codigo_ciiu: ciiu, contenido_json: resultado, estado: "borrador", version: 1 })
    .select()
    .single();

  const saved = insertError ? newMatriz : matriz;
  if (insertError) addDemoMatriz(newMatriz);

  const procList = (resultado.procesos as unknown[]) ?? [];
  const resumen = (resultado.resumen_por_nivel as Record<string, number>) ?? {};

  return res.json({
    matriz_id: saved.id,
    ciiu,
    actividad_economica: (resultado.actividad_economica as string) ?? "",
    num_peligros: procList.length,
    niveles_riesgo: resumen,
    peligros_prioritarios: (resultado.peligros_prioritarios as string[]) ?? [],
    contenido: resultado,
  });
});

router.get("/:empresaId", async (req, res) => {
  const { data, error } = await supabase
    .from("matrices_riesgo")
    .select("id, empresa_id, version, codigo_ciiu, estado, created_at")
    .eq("empresa_id", req.params.empresaId)
    .order("created_at", { ascending: false });

  if (error) {
    return res.json(getDemoMatrices().filter((m) => m.empresa_id === req.params.empresaId));
  }
  const combined = [...(data ?? []), ...getDemoMatrices().filter((m) => m.empresa_id === req.params.empresaId)];
  return res.json(combined);
});

export default router;
