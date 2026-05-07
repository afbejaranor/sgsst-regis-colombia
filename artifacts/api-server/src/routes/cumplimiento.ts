import { Router } from "express";
import { db } from "@workspace/db";
import { documentosCumplimientoTable, empresasTable } from "@workspace/db";
import { eq, and, asc } from "drizzle-orm";
import { DEMO_EMPRESA, getDemoCriterios } from "../lib/demo-data";

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
    nivel: porcentaje_total >= 90 ? "Aceptable" : porcentaje_total >= 60 ? "Moderadamente Aceptable" : "Crítico",
    estandares,
  };
}

router.get("/dashboard/resumen", async (req, res) => {
  try {
    const empresasList = await db.select({
      id: empresasTable.id,
      nombre: empresasTable.nombre,
      nit: empresasTable.nit,
      tamano: empresasTable.tamano,
      num_empleados: empresasTable.num_empleados,
    }).from(empresasTable).where(eq(empresasTable.activa, true));

    const docsList = await db.select({
      empresa_id: documentosCumplimientoTable.empresa_id,
      peso_porcentual: documentosCumplimientoTable.peso_porcentual,
      estado: documentosCumplimientoTable.estado,
    }).from(documentosCumplimientoTable);

    const empresasResumen = (empresasList.length ? empresasList : [DEMO_EMPRESA]).map((emp) => {
      const criterios = (docsList.length ? docsList : getDemoCriterios()).filter((d) => d.empresa_id === emp.id);
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

    return res.json({
      total_empresas: total,
      promedio_cumplimiento: promedio,
      empresas: empresasResumen.sort((a, b) => b.porcentaje_cumplimiento - a.porcentaje_cumplimiento),
    });
  } catch (err) {
    req.log.error({ err }, "Error fetching dashboard resumen");
    return res.status(500).json({ error: "Error al obtener resumen" });
  }
});

router.get("/:empresaId", async (req, res) => {
  const { empresaId } = req.params;
  try {
    const criterios = await db
      .select()
      .from(documentosCumplimientoTable)
      .where(eq(documentosCumplimientoTable.empresa_id, empresaId))
      .orderBy(asc(documentosCumplimientoTable.criterio_codigo));

    const criteriosList = criterios.length
      ? criterios
      : getDemoCriterios().filter((c) => c.empresa_id === empresaId) as unknown as typeof criterios;

    return res.json(buildCumplimientoResponse(empresaId, criteriosList as unknown as Record<string, unknown>[]));
  } catch (err) {
    req.log.warn({ err }, "DB unavailable, using demo data for cumplimiento");
    const fallback = getDemoCriterios().filter((c) => c.empresa_id === empresaId);
    return res.json(buildCumplimientoResponse(empresaId, fallback as unknown as Record<string, unknown>[]));
  }
});

router.patch("/:empresaId/criterio/:criterioId", async (req, res) => {
  const { empresaId, criterioId } = req.params;
  const { estado, observaciones } = req.body as { estado: string; observaciones?: string };

  try {
    const rows = await db
      .update(documentosCumplimientoTable)
      .set({ estado, observaciones: observaciones ?? null, updated_at: new Date() })
      .where(and(
        eq(documentosCumplimientoTable.id, criterioId),
        eq(documentosCumplimientoTable.empresa_id, empresaId)
      ))
      .returning();

    if (rows.length) return res.json(rows[0]);
    return res.status(404).json({ error: "Criterio no encontrado" });
  } catch (err) {
    req.log.error({ err }, "Error updating criterio");
    return res.status(500).json({ error: "Error al actualizar criterio" });
  }
});

export default router;
