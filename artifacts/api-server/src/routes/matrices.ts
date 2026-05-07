import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { matricesRiesgoTable, empresasTable } from "@workspace/db";
import { eq, desc, max } from "drizzle-orm";
import { callAI } from "../lib/ai";
import { SKILL_MATRIZ_GTC45 } from "../lib/skills";
import { DEMO_EMPRESAS } from "../lib/demo-data";
import { generateMatrizDocx, generateMatrizPdf, EmpresaData } from "../lib/doc-generator";
import { uploadToEmpresaFolder } from "../lib/drive-client";

const router = Router();

async function resolveEmpresa(empresaId: string): Promise<EmpresaData> {
  const demo = DEMO_EMPRESAS.find((e) => e.id === empresaId);
  if (demo) return demo;
  try {
    const rows = await db.select({
      id: empresasTable.id,
      nombre: empresasTable.nombre,
      nit: empresasTable.nit,
      codigo_ciiu: empresasTable.codigo_ciiu,
      ciudad: empresasTable.ciudad,
    }).from(empresasTable).where(eq(empresasTable.id, empresaId)).limit(1);
    if (rows.length) return rows[0] as EmpresaData;
  } catch { /* ignore */ }
  return { id: "", nombre: "Empresa", nit: "—", codigo_ciiu: "—", ciudad: "—" };
}

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

  let newVersion = 1;
  try {
    const rows = await db.select({ v: max(matricesRiesgoTable.version) })
      .from(matricesRiesgoTable)
      .where(eq(matricesRiesgoTable.empresa_id, empresa_id));
    newVersion = (rows[0]?.v ?? 0) + 1;
  } catch { /* ignore */ }

  let matrizId: string;
  try {
    const rows = await db.insert(matricesRiesgoTable).values({
      empresa_id,
      codigo_ciiu: ciiu,
      contenido_json: resultado,
      estado: "borrador",
      version: newVersion,
    }).returning({ id: matricesRiesgoTable.id });
    matrizId = rows[0].id;
  } catch (err) {
    req.log.error({ err }, "Failed to persist matriz to DB");
    matrizId = crypto.randomUUID();
  }

  const procList = (resultado.procesos as unknown[]) ?? [];
  const resumen = (resultado.resumen_por_nivel as Record<string, number>) ?? {};

  return res.json({
    matriz_id: matrizId,
    ciiu,
    version: newVersion,
    actividad_economica: (resultado.actividad_economica as string) ?? "",
    num_peligros: procList.length,
    niveles_riesgo: resumen,
    peligros_prioritarios: (resultado.peligros_prioritarios as string[]) ?? [],
    contenido: resultado,
  });
});

async function handleExportar(req: Request, res: Response) {
  const matrizId = String(req.params.matrizId);
  const formato = (String(req.query.formato ?? "docx") || "docx").toLowerCase();
  if (formato !== "docx" && formato !== "pdf") {
    return res.status(400).json({ error: "Formato inválido. Use 'docx' o 'pdf'." });
  }

  let matriz: Record<string, unknown> | null = null;
  try {
    const rows = await db.select().from(matricesRiesgoTable).where(eq(matricesRiesgoTable.id, matrizId)).limit(1);
    matriz = rows[0] as Record<string, unknown> ?? null;
  } catch (err) {
    req.log.error({ err }, "Error fetching matriz for export");
  }
  if (!matriz) {
    return res.status(404).json({ error: "Matriz no encontrada" });
  }

  const empresa = await resolveEmpresa(matriz.empresa_id as string);

  const ciiu = (matriz.codigo_ciiu ?? "XXXX") as string;
  const version = (matriz.version as number) ?? 1;
  const fechaHoy = new Date().toISOString().slice(0, 10);

  let buffer: Buffer;
  let contentType: string;
  let fileName: string;

  try {
    if (formato === "pdf") {
      buffer = await generateMatrizPdf(matriz, empresa);
      contentType = "application/pdf";
      fileName = `Matriz_GTC45_${ciiu}_v${version}_${fechaHoy}.pdf`;
    } else {
      buffer = await generateMatrizDocx(matriz, empresa);
      contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      fileName = `Matriz_GTC45_${ciiu}_v${version}_${fechaHoy}.docx`;
    }
  } catch (err) {
    req.log.error({ err }, "Matrix document generation failed");
    return res.status(500).json({ error: "Error al generar el documento" });
  }

  const driveUrl = await uploadToEmpresaFolder(empresa.nombre, "Matrices", fileName, buffer, contentType);
  if (driveUrl) {
    try {
      await db.update(matricesRiesgoTable).set({ drive_url: driveUrl }).where(eq(matricesRiesgoTable.id, matrizId));
    } catch (err) {
      req.log.warn({ err }, "Failed to update drive_url for matriz");
    }
  }

  res.setHeader("Content-Type", contentType);
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
  if (driveUrl) res.setHeader("X-Drive-Url", driveUrl);
  return res.send(buffer);
}

router.get("/:matrizId/exportar", handleExportar);
router.post("/:matrizId/exportar", handleExportar);

router.get("/:empresaId", async (req, res) => {
  try {
    const data = await db.select({
      id: matricesRiesgoTable.id,
      empresa_id: matricesRiesgoTable.empresa_id,
      version: matricesRiesgoTable.version,
      codigo_ciiu: matricesRiesgoTable.codigo_ciiu,
      estado: matricesRiesgoTable.estado,
      drive_url: matricesRiesgoTable.drive_url,
      created_at: matricesRiesgoTable.created_at,
    }).from(matricesRiesgoTable)
      .where(eq(matricesRiesgoTable.empresa_id, req.params.empresaId))
      .orderBy(desc(matricesRiesgoTable.created_at));
    return res.json(data);
  } catch (err) {
    req.log.warn({ err }, "DB unavailable for matrices");
    return res.json([]);
  }
});

export default router;
