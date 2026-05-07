import { Router, Request, Response } from "express";
import { supabase } from "../lib/supabase";
import { callAI } from "../lib/ai";
import { SKILL_EXTRACTOR_MEDICO } from "../lib/skills";
import { getDemoExamenes, getDemoExamenById, addDemoExamen, DEMO_EMPRESAS } from "../lib/demo-data";
import { generateExamenDocx, generateExamenPdf, EmpresaData } from "../lib/doc-generator";
import { uploadToEmpresaFolder } from "../lib/drive-client";

const router = Router();

async function resolveEmpresa(empresaId: string): Promise<EmpresaData> {
  const demo = DEMO_EMPRESAS.find((e) => e.id === empresaId);
  if (demo) return demo;
  const { data } = await supabase
    .from("empresas")
    .select("id, nombre, nit, codigo_ciiu, ciudad")
    .eq("id", empresaId)
    .single();
  return (data as EmpresaData | null) ?? { id: "", nombre: "Empresa", nit: "—", codigo_ciiu: "—", ciudad: "—" };
}

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
Nombre trabajador: ${nombre_trabajador ?? "No especificado"}
Cédula trabajador: ${cedula_trabajador ?? "No especificado"}`;

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
    nombre_trabajador: nombre_trabajador ?? null,
    cedula_trabajador: cedula_trabajador ?? null,
    cargo: (resultado.cargo as string) ?? null,
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
    examen_id: savedExamen.id as string,
    nombre_trabajador: (newExamen.nombre_trabajador as string | null) ?? null,
    concepto: resultado.concepto ?? "pendiente",
    restricciones: resultado.restricciones ?? [],
    recomendaciones: resultado.recomendaciones ?? [],
    requiere_seguimiento: resultado.requiere_seguimiento ?? false,
    raw: resultado,
  });
});

async function handleInforme(req: Request, res: Response) {
  const { examenId } = req.params;
  const formato = ((req.query.formato as string) || "docx").toLowerCase();

  let examen = (getDemoExamenById(examenId) ?? null) as Record<string, unknown> | null;
  if (!examen) {
    const { data } = await supabase.from("examenes_medicos").select("*").eq("id", examenId).single();
    examen = data ?? null;
  }
  if (!examen) {
    return res.status(404).json({ error: "Examen no encontrado" });
  }

  const empresa = await resolveEmpresa(examen.empresa_id as string);

  const nombreTrabajador = (examen.nombre_trabajador as string) ?? "Trabajador";
  const fechaHoy = new Date().toISOString().slice(0, 10);
  const safeName = nombreTrabajador.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_-]/g, "");

  let buffer: Buffer;
  let contentType: string;
  let fileName: string;

  try {
    if (formato === "pdf") {
      buffer = await generateExamenPdf(examen, empresa);
      contentType = "application/pdf";
      fileName = `Examen_${safeName}_${fechaHoy}.pdf`;
    } else {
      buffer = await generateExamenDocx(examen, empresa);
      contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      fileName = `Examen_${safeName}_${fechaHoy}.docx`;
    }
  } catch (err) {
    req.log.error({ err }, "Document generation failed");
    return res.status(500).json({ error: "Error al generar el documento" });
  }

  const driveUrl = await uploadToEmpresaFolder(empresa.nombre, "Examenes", fileName, buffer, contentType);

  res.setHeader("Content-Type", contentType);
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
  if (driveUrl) res.setHeader("X-Drive-Url", driveUrl);
  return res.send(buffer);
}

router.get("/:examenId/informe", handleInforme);
router.post("/:examenId/informe", handleInforme);

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
