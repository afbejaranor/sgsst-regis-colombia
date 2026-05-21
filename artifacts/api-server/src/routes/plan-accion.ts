import { Router } from "express";
import { db } from "@workspace/db";
import { documentosCumplimientoTable, empresasTable } from "@workspace/db";
import { eq, and, inArray, desc } from "drizzle-orm";
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

  let allCriterios: Record<string, unknown>[];
  try {
    const rows = await db
      .select()
      .from(documentosCumplimientoTable)
      .where(and(
        eq(documentosCumplimientoTable.empresa_id, empresaId),
        inArray(documentosCumplimientoTable.estado, ["no_cumple", "en_proceso"])
      ))
      .orderBy(desc(documentosCumplimientoTable.peso_porcentual));
    allCriterios = rows.length
      ? rows as unknown as Record<string, unknown>[]
      : getDemoCriterios().filter((c) => c.empresa_id === empresaId && (c.estado === "no_cumple" || c.estado === "en_proceso")) as unknown as Record<string, unknown>[];
  } catch {
    allCriterios = getDemoCriterios().filter(
      (c) => c.empresa_id === empresaId && (c.estado === "no_cumple" || c.estado === "en_proceso")
    ) as unknown as Record<string, unknown>[];
  }

  const sorted = [...allCriterios].sort((a, b) => Number(b.peso_porcentual) - Number(a.peso_porcentual));

  let empresa: { nombre?: string | null; codigo_ciiu?: string | null; num_empleados?: number | null; ciudad?: string | null } | undefined =
    DEMO_EMPRESAS.find((e) => e.id === empresaId);
  if (!empresa) {
    try {
      const rows = await db.select().from(empresasTable).where(eq(empresasTable.id, empresaId)).limit(1);
      if (rows.length) empresa = rows[0];
    } catch { /* ignore */ }
  }

  const cached = planCache.get(empresaId);

  const accionesBase = sorted.map((c) => {
    const aiData = cached
      ? (cached.acciones as Record<string, unknown>[])?.find((a) => a.criterio_codigo === c.criterio_codigo)
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

  let allCriterios: Record<string, unknown>[];
  try {
    const rows = await db
      .select()
      .from(documentosCumplimientoTable)
      .where(and(
        eq(documentosCumplimientoTable.empresa_id, empresaId),
        inArray(documentosCumplimientoTable.estado, ["no_cumple", "en_proceso"])
      ))
      .orderBy(desc(documentosCumplimientoTable.peso_porcentual));
    allCriterios = rows.length
      ? rows as unknown as Record<string, unknown>[]
      : getDemoCriterios().filter((c) => c.empresa_id === empresaId && (c.estado === "no_cumple" || c.estado === "en_proceso")) as unknown as Record<string, unknown>[];
  } catch {
    allCriterios = getDemoCriterios().filter(
      (c) => c.empresa_id === empresaId && (c.estado === "no_cumple" || c.estado === "en_proceso")
    ) as unknown as Record<string, unknown>[];
  }

  const sorted = [...allCriterios].sort((a, b) => Number(b.peso_porcentual) - Number(a.peso_porcentual));

  let empresa: { nombre?: string | null; codigo_ciiu?: string | null; num_empleados?: number | null; ciudad?: string | null } | undefined =
    DEMO_EMPRESAS.find((e) => e.id === empresaId);
  if (!empresa) {
    try {
      const rows = await db.select().from(empresasTable).where(eq(empresasTable.id, empresaId)).limit(1);
      if (rows.length) empresa = rows[0];
    } catch { /* ignore */ }
  }

  const totalPts = sorted.reduce((s, c) => s + Number(c.peso_porcentual), 0);
  const userMsg = `DATOS DE LA EMPRESA:
- Nombre: ${empresa?.nombre ?? "Empresa"}
- Sector CIIU: ${empresa?.codigo_ciiu ?? "N/A"}
- Número de empleados: ${empresa?.num_empleados ?? "N/A"}
- Ciudad: ${empresa?.ciudad ?? "Colombia"}
- Total criterios incumplidos: ${sorted.length}
- Puntos en riesgo: ${Math.round(totalPts * 10) / 10} de 100

CRITERIOS INCUMPLIDOS (ordenados por impacto, mayor a menor):
${sorted.map((c, i) => `${i + 1}. [${c.criterio_codigo}] ${c.criterio_descripcion}
   Estándar: ${c.estandar} | Peso: ${c.peso_porcentual} pts | Estado actual: ${c.estado}`).join("\n\n")}

INSTRUCCIÓN: Genera el plan de acción DETALLADO y ESPECÍFICO para ${empresa?.nombre ?? "esta empresa"} del sector CIIU ${empresa?.codigo_ciiu ?? "N/A"} en Colombia. Cada acción debe incluir pasos concretos adaptados al tamaño (${empresa?.num_empleados ?? "N/A"} empleados) y sector de la empresa. El objetivo es alcanzar nivel Aceptable (≥90%) según Resolución 0312 de 2019.`;

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
