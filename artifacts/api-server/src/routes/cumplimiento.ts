import { Router } from "express";
import { supabase } from "../lib/supabase";
import { DEMO_EMPRESA, DEMO_EMPRESA_ID, getDemoCriterios, updateDemoCriterio } from "../lib/demo-data";

const router = Router();

function buildCumplimientoResponse(empresaId: string, criterios: Record<string, unknown>[]) {
  const estandaresMap = new Map<string, {
    estandar: string;
    criterios: Record<string, unknown>[];
    puntaje_obtenido: number;
    puntaje_posible: number;
  }>();

  for (const c of criterios) {
    const std = c.estandar as string;
    if (!estandaresMap.has(std)) {
      estandaresMap.set(std, { estandar: std, criterios: [], puntaje_obtenido: 0, puntaje_posible: 0 });
    }
    const est = estandaresMap.get(std)!;
    est.criterios.push(c);
    if (c.estado !== "no_aplica") est.puntaje_posible += Number(c.peso_porcentual);
    if (c.estado === "cumple") est.puntaje_obtenido += Number(c.peso_porcentual);
  }

  const estandares = Array.from(estandaresMap.values()).map((est) => ({
    estandar: est.estandar,
    puntaje_obtenido: Math.round(est.puntaje_obtenido * 10) / 10,
    puntaje_posible: Math.round(est.puntaje_posible * 10) / 10,
    porcentaje: est.puntaje_posible > 0 ? Math.round((est.puntaje_obtenido / est.puntaje_posible) * 100 * 10) / 10 : 0,
    criterios_cumplidos: est.criterios.filter((c) => c.estado === "cumple").length,
    criterios_incumplidos: est.criterios.filter((c) => c.estado === "no_cumple").length,
    criterios_en_proceso: est.criterios.filter((c) => c.estado === "en_proceso").length,
    criterios: est.criterios,
  }));

  const puntaje_total = estandares.reduce((s, e) => s + e.puntaje_obtenido, 0);
  const puntaje_posible_total = estandares.reduce((s, e) => s + e.puntaje_posible, 0);
  const porcentaje_total = puntaje_posible_total > 0
    ? Math.round((puntaje_total / puntaje_posible_total) * 100 * 10) / 10
    : 0;

  return {
    empresa_id: empresaId,
    puntaje_total: Math.round(puntaje_total * 10) / 10,
    porcentaje_total,
    nivel: porcentaje_total >= 85 ? "Aceptable" : porcentaje_total >= 60 ? "Moderadamente Aceptable" : "Crítico",
    estandares,
  };
}

router.get("/dashboard/resumen", async (req, res) => {
  const { data: empresas, error: empError } = await supabase
    .from("empresas")
    .select("id, nombre, nit, tamano, num_empleados")
    .eq("activa", true);

  const empresasList = empError ? [DEMO_EMPRESA] : (empresas?.length ? empresas : [DEMO_EMPRESA]);

  const { data: docs, error: docError } = await supabase
    .from("documentos_cumplimiento")
    .select("empresa_id, peso_porcentual, estado");

  const docsList: Record<string, unknown>[] = docError
    ? getDemoCriterios()
    : (docs?.length ? docs : getDemoCriterios());

  const empresasResumen = empresasList.map((emp) => {
    const criterios = docsList.filter((d) => d.empresa_id === emp.id);
    const posible = criterios.filter((c) => c.estado !== "no_aplica").reduce((s, c) => s + Number(c.peso_porcentual), 0);
    const obtenido = criterios.filter((c) => c.estado === "cumple").reduce((s, c) => s + Number(c.peso_porcentual), 0);
    const pct = posible > 0 ? Math.round((obtenido / posible) * 100 * 10) / 10 : 0;
    const pendientes = criterios.filter((c) => c.estado === "no_cumple").length;

    return {
      id: emp.id,
      nombre: emp.nombre,
      nit: emp.nit,
      tamano: emp.tamano,
      num_empleados: emp.num_empleados,
      porcentaje_cumplimiento: pct,
      nivel_semaforo: pct >= 85 ? "verde" : pct >= 60 ? "amarillo" : "rojo",
      criterios_pendientes: pendientes,
    };
  });

  const total = empresasResumen.length;
  const promedio = total > 0
    ? Math.round((empresasResumen.reduce((s, e) => s + e.porcentaje_cumplimiento, 0) / total) * 10) / 10
    : 0;

  return res.json({
    total_empresas: total,
    promedio_cumplimiento: promedio,
    empresas: empresasResumen.sort((a, b) => b.porcentaje_cumplimiento - a.porcentaje_cumplimiento),
  });
});

router.get("/:empresaId", async (req, res) => {
  const { empresaId } = req.params;

  const { data: criterios, error } = await supabase
    .from("documentos_cumplimiento")
    .select("*")
    .eq("empresa_id", empresaId)
    .order("criterio_codigo");

  const criteriosList: Record<string, unknown>[] = error
    ? getDemoCriterios().filter((c) => c.empresa_id === empresaId)
    : (criterios?.length ? criterios : getDemoCriterios().filter((c) => c.empresa_id === empresaId));

  return res.json(buildCumplimientoResponse(empresaId, criteriosList));
});

router.patch("/:empresaId/criterio/:criterioId", async (req, res) => {
  const { empresaId, criterioId } = req.params;
  const { estado, observaciones } = req.body as { estado: string; observaciones?: string };

  const { data, error } = await supabase
    .from("documentos_cumplimiento")
    .update({ estado, observaciones, updated_at: new Date().toISOString() })
    .eq("id", criterioId)
    .eq("empresa_id", empresaId)
    .select()
    .single();

  if (error) {
    const updated = updateDemoCriterio(criterioId, estado, observaciones);
    if (updated) return res.json(updated);
    return res.status(404).json({ error: "Criterio no encontrado" });
  }
  return res.json(data);
});

export default router;
