import { Router } from "express";
import { supabase } from "../lib/supabase";
import { DEMO_EMPRESAS, getDemoCriterios } from "../lib/demo-data";

const router = Router();

router.get("/resumen", async (req, res) => {
  const { data: empresas, error: empError } = await supabase
    .from("empresas")
    .select("id, nombre, nit, tamano, num_empleados")
    .eq("activa", true);

  const empresasList = empError
    ? DEMO_EMPRESAS
    : empresas?.length
      ? empresas
      : DEMO_EMPRESAS;

  const { data: docs, error: docError } = await supabase
    .from("documentos_cumplimiento")
    .select("empresa_id, peso_porcentual, estado");

  const docsList: Record<string, unknown>[] = docError
    ? getDemoCriterios()
    : docs?.length
      ? docs
      : getDemoCriterios();

  const empresasResumen = empresasList.map((emp) => {
    const criterios = docsList.filter((d) => d.empresa_id === emp.id);
    const posible = criterios
      .filter((c) => c.estado !== "no_aplica")
      .reduce((s, c) => s + Number(c.peso_porcentual), 0);
    const obtenido = criterios
      .filter((c) => c.estado === "cumple")
      .reduce((s, c) => s + Number(c.peso_porcentual), 0);
    const pct = posible > 0 ? Math.round((obtenido / posible) * 100 * 10) / 10 : 0;
    const pendientes = criterios.filter((c) => c.estado === "no_cumple").length;

    return {
      id: emp.id,
      nombre: emp.nombre,
      nit: emp.nit,
      tamano: emp.tamano,
      num_empleados: emp.num_empleados,
      porcentaje_cumplimiento: pct,
      nivel_semaforo: pct >= 90 ? "verde" : pct >= 60 ? "amarillo" : "rojo",
      criterios_pendientes: pendientes,
    };
  });

  const total = empresasResumen.length;
  const promedio =
    total > 0
      ? Math.round(
          (empresasResumen.reduce((s, e) => s + e.porcentaje_cumplimiento, 0) /
            total) *
            10
        ) / 10
      : 0;

  return res.json({
    total_empresas: total,
    promedio_cumplimiento: promedio,
    empresas: empresasResumen.sort(
      (a, b) => b.porcentaje_cumplimiento - a.porcentaje_cumplimiento
    ),
  });
});

export default router;
