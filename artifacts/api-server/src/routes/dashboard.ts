import { Router } from "express";
import { db } from "@workspace/db";
import { empresasTable, documentosCumplimientoTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { DEMO_EMPRESAS, getDemoCriterios } from "../lib/demo-data";

const router = Router();

function buildResumen(eList: { id: string; nombre: string; nit: string; tamano?: string | null; num_empleados?: number | null }[], dList: { empresa_id: string; peso_porcentual: unknown; estado: string }[]) {
  const empresasResumen = eList.map((emp) => {
    const criterios = dList.filter((d) => d.empresa_id === emp.id);
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
      nivel_semaforo: pct >= 90 ? "verde" : pct >= 60 ? "amarillo" : "rojo",
      criterios_pendientes: pendientes,
    };
  });
  const total = empresasResumen.length;
  const promedio = total > 0
    ? Math.round((empresasResumen.reduce((s, e) => s + e.porcentaje_cumplimiento, 0) / total) * 10) / 10
    : 0;
  return {
    total_empresas: total,
    promedio_cumplimiento: promedio,
    empresas: empresasResumen.sort((a, b) => b.porcentaje_cumplimiento - a.porcentaje_cumplimiento),
  };
}

router.get("/resumen", async (req, res) => {
  let empresasList: { id: string; nombre: string; nit: string; tamano?: string | null; num_empleados?: number | null }[] = [];
  let docsList: { empresa_id: string; peso_porcentual: unknown; estado: string }[] = [];

  try {
    empresasList = await db.select({
      id: empresasTable.id,
      nombre: empresasTable.nombre,
      nit: empresasTable.nit,
      tamano: empresasTable.tamano,
      num_empleados: empresasTable.num_empleados,
    }).from(empresasTable).where(eq(empresasTable.activa, true));
  } catch (err) {
    req.log.warn({ err }, "DB unavailable for empresas in dashboard, using demo data");
  }

  try {
    docsList = await db.select({
      empresa_id: documentosCumplimientoTable.empresa_id,
      peso_porcentual: documentosCumplimientoTable.peso_porcentual,
      estado: documentosCumplimientoTable.estado,
    }).from(documentosCumplimientoTable);
  } catch (err) {
    req.log.warn({ err }, "DB unavailable for cumplimiento in dashboard, using demo data");
  }

  const eList = empresasList.length ? empresasList : DEMO_EMPRESAS;
  const dList = docsList.length ? docsList : getDemoCriterios();

  return res.json(buildResumen(eList, dList));
});

export default router;
