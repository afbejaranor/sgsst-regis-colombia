import { Router } from "express";
import { supabase } from "../lib/supabase";
import { callAI } from "../lib/ai";
import { SKILL_PLAN_ACCION } from "../lib/skills";
import { getDemoCriterios, DEMO_EMPRESAS } from "../lib/demo-data";

const router = Router();

const planCache = new Map<string, Record<string, unknown>>();

function getPrioridad(peso: number): "Alta" | "Media" | "Baja" {
  if (peso >= 4.0) return "Alta";
  if (peso >= 2.0) return "Media";
  return "Baja";
}

router.get("/:empresaId", async (req, res) => {
  const { empresaId } = req.params;

  const { data: criterios, error } = await supabase
    .from("documentos_cumplimiento")
    .select("*")
    .eq("empresa_id", empresaId)
    .in("estado", ["no_cumple", "en_proceso"])
    .order("peso_porcentual", { ascending: false });

  const allCriterios: Record<string, unknown>[] = error
    ? getDemoCriterios().filter(
        (c) => c.empresa_id === empresaId && (c.estado === "no_cumple" || c.estado === "en_proceso")
      )
    : criterios?.length
      ? criterios
      : getDemoCriterios().filter(
          (c) => c.empresa_id === empresaId && (c.estado === "no_cumple" || c.estado === "en_proceso")
        );

  const sorted = [...allCriterios].sort(
    (a, b) => Number(b.peso_porcentual) - Number(a.peso_porcentual)
  );

  const empresa = DEMO_EMPRESAS.find((e) => e.id === empresaId);
  const cached = planCache.get(empresaId);

  const accionesBase = sorted.map((c) => {
    const aiData = cached
      ? (cached.acciones as Record<string, unknown>[])?.find(
          (a) => a.criterio_codigo === c.criterio_codigo
        )
      : null;

    return {
      criterio_id: c.id,
      criterio_codigo: c.criterio_codigo,
      criterio_descripcion: c.criterio_descripcion,
      estandar: c.estandar,
      estado: c.estado,
      peso_porcentual: c.peso_porcentual,
      prioridad: (aiData?.prioridad as string) ?? getPrioridad(Number(c.peso_porcentual)),
      recomendacion: (aiData?.recomendacion as string) ?? null,
      responsable_sugerido: (aiData?.responsable_sugerido as string) ?? null,
      plazo_sugerido: (aiData?.plazo_sugerido as string) ?? null,
      recurso_estimado: (aiData?.recurso_estimado as string) ?? null,
      indicador_verificacion: (aiData?.indicador_verificacion as string) ?? null,
    };
  });

  const impacto_potencial = sorted.reduce((s, c) => s + Number(c.peso_porcentual), 0);

  return res.json({
    empresa_id: empresaId,
    empresa_nombre: empresa?.nombre ?? "Empresa",
    total_pendientes: sorted.length,
    impacto_potencial: Math.round(impacto_potencial * 10) / 10,
    plan_generado: !!cached,
    objetivo_general: (cached?.objetivo_general as string) ?? null,
    meta_porcentaje_estimado: (cached?.meta_porcentaje_estimado as number) ?? null,
    observacion_general: (cached?.observacion_general as string) ?? null,
    acciones: accionesBase,
  });
});

router.post("/:empresaId/generar", async (req, res) => {
  const { empresaId } = req.params;

  const { data: criterios, error } = await supabase
    .from("documentos_cumplimiento")
    .select("*")
    .eq("empresa_id", empresaId)
    .in("estado", ["no_cumple", "en_proceso"])
    .order("peso_porcentual", { ascending: false });

  const allCriterios: Record<string, unknown>[] = error
    ? getDemoCriterios().filter(
        (c) => c.empresa_id === empresaId && (c.estado === "no_cumple" || c.estado === "en_proceso")
      )
    : criterios?.length
      ? criterios
      : getDemoCriterios().filter(
          (c) => c.empresa_id === empresaId && (c.estado === "no_cumple" || c.estado === "en_proceso")
        );

  const sorted = [...allCriterios].sort(
    (a, b) => Number(b.peso_porcentual) - Number(a.peso_porcentual)
  );

  const empresa = DEMO_EMPRESAS.find((e) => e.id === empresaId);

  const userMsg = `Empresa: ${empresa?.nombre ?? "Empresa"} | Sector CIIU: ${empresa?.codigo_ciiu ?? "N/A"} | Empleados: ${empresa?.num_empleados ?? "N/A"} | Ciudad: ${empresa?.ciudad ?? "Colombia"}

Criterios incumplidos de la Resolución 0312 de 2019 (ordenados por peso):
${sorted.map((c) => `- [${c.criterio_codigo}] (${c.peso_porcentual} pts, estado: ${c.estado}): ${c.criterio_descripcion} | Estándar: ${c.estandar}`).join("\n")}

Genera el plan de acción completo para llevar esta empresa al nivel Aceptable (≥90%).`;

  let resultado: Record<string, unknown>;
  try {
    resultado = (await callAI(SKILL_PLAN_ACCION, userMsg)) as Record<string, unknown>;
  } catch (err) {
    req.log.error({ err }, "AI plan de accion failed");
    return res.status(500).json({ error: "Error al generar plan con IA" });
  }

  planCache.set(empresaId, resultado);

  return res.json({
    empresa_id: empresaId,
    plan_generado: true,
    objetivo_general: resultado.objetivo_general,
    meta_porcentaje_estimado: resultado.meta_porcentaje_estimado,
    observacion_general: resultado.observacion_general,
    acciones: resultado.acciones,
  });
});

export default router;
