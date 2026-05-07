import { Router } from "express";
import { supabase } from "../lib/supabase";
import { callAI } from "../lib/ai";
import { SKILL_MATRIZ_GTC45 } from "../lib/skills";
import { getDemoMatrices, getDemoMatrizById, addDemoMatriz, DEMO_EMPRESAS } from "../lib/demo-data";
import { generateMatrizDocx, generateMatrizPdf } from "../lib/doc-generator";
import { uploadToEmpresaFolder } from "../lib/drive-client";

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

  // Determine version (increment from existing)
  const existingInDemo = getDemoMatrices().filter((m) => m.empresa_id === empresa_id);
  const { data: dbMatrices } = await supabase
    .from("matrices_riesgo")
    .select("version")
    .eq("empresa_id", empresa_id)
    .order("version", { ascending: false })
    .limit(1);
  const maxVersion = Math.max(
    ...existingInDemo.map((m) => (m.version as number) ?? 0),
    ...((dbMatrices ?? []) as Array<{ version: number }>).map((m) => m.version ?? 0),
    0,
  );
  const newVersion = maxVersion + 1;

  const newMatriz: Record<string, unknown> = {
    id: crypto.randomUUID(),
    empresa_id,
    codigo_ciiu: ciiu,
    contenido_json: resultado,
    estado: "borrador",
    version: newVersion,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data: matriz, error: insertError } = await supabase
    .from("matrices_riesgo")
    .insert({ empresa_id, codigo_ciiu: ciiu, contenido_json: resultado, estado: "borrador", version: newVersion })
    .select()
    .single();

  const saved = insertError ? newMatriz : matriz;
  if (insertError) addDemoMatriz(newMatriz);

  const procList = (resultado.procesos as unknown[]) ?? [];
  const resumen = (resultado.resumen_por_nivel as Record<string, number>) ?? {};

  return res.json({
    matriz_id: saved.id as string,
    ciiu,
    version: newVersion,
    actividad_economica: (resultado.actividad_economica as string) ?? "",
    num_peligros: procList.length,
    niveles_riesgo: resumen,
    peligros_prioritarios: (resultado.peligros_prioritarios as string[]) ?? [],
    contenido: resultado,
  });
});

router.get("/:matrizId/exportar", async (req, res) => {
  const { matrizId } = req.params;
  const formato = ((req.query.formato as string) || "docx").toLowerCase();

  let matriz = (getDemoMatrizById(matrizId) ?? null) as Record<string, unknown> | null;
  if (!matriz) {
    const { data } = await supabase.from("matrices_riesgo").select("*").eq("id", matrizId).single();
    matriz = data ?? null;
  }
  if (!matriz) {
    return res.status(404).json({ error: "Matriz no encontrada" });
  }

  const empresa = DEMO_EMPRESAS.find((e) => e.id === matriz!.empresa_id) ?? {
    id: "", nombre: "Empresa", nit: "—", codigo_ciiu: "—", ciudad: "—",
  };

  const ciiu = (matriz.codigo_ciiu ?? matriz.ciiu ?? "XXXX") as string;
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

  res.setHeader("Content-Type", contentType);
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
  if (driveUrl) res.setHeader("X-Drive-Url", driveUrl);
  return res.send(buffer);
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
