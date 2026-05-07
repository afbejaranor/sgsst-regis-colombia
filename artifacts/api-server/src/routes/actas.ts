import { Router, Request, Response } from "express";
import { supabase } from "../lib/supabase";
import { callAI } from "../lib/ai";
import { SKILL_ACTAS_COPASST } from "../lib/skills";
import { DEMO_EMPRESA, getDemoActas, getDemoActaById, addDemoActa, DEMO_EMPRESAS } from "../lib/demo-data";
import { generateActaDocx, generateActaPdf, EmpresaData } from "../lib/doc-generator";
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

router.post("/generar", async (req, res) => {
  const { empresa_id, tipo_comite, fecha, hora_inicio, hora_fin, lugar, asistentes, puntos, transcripcion } = req.body as {
    empresa_id: string;
    tipo_comite: "COPASST" | "convivencia";
    fecha: string;
    hora_inicio: string;
    hora_fin: string;
    lugar: string;
    asistentes: unknown[];
    puntos: string[];
    transcripcion?: string;
  };

  const { data: empresaDb } = await supabase
    .from("empresas")
    .select("nombre, nit, ciudad")
    .eq("id", empresa_id)
    .single();

  const empresaData = empresaDb ?? { nombre: DEMO_EMPRESA.nombre, nit: DEMO_EMPRESA.nit, ciudad: DEMO_EMPRESA.ciudad };

  const userMsg = `Genera el acta para:
Empresa: ${empresaData.nombre} | NIT: ${empresaData.nit} | Ciudad: ${empresaData.ciudad}
Tipo comité: ${tipo_comite}
Fecha reunión: ${fecha}
Hora: ${hora_inicio} - ${hora_fin}
Lugar: ${lugar}
Asistentes: ${JSON.stringify(asistentes)}
Puntos tratados: ${JSON.stringify(puntos)}
Transcripción audio: ${transcripcion ?? "No disponible"}
Devuelve ÚNICAMENTE el JSON estructurado.`;

  let resultado: Record<string, unknown>;
  try {
    resultado = (await callAI(SKILL_ACTAS_COPASST, userMsg)) as Record<string, unknown>;
  } catch (err) {
    req.log.error({ err }, "AI acta generation failed");
    return res.status(500).json({ error: "Error al generar el acta con IA" });
  }

  const numeroActa = (resultado.numero_acta as string) ?? `${tipo_comite}-${fecha.substring(0, 7)}`;

  const newActa: Record<string, unknown> = {
    id: crypto.randomUUID(),
    empresa_id,
    numero_acta: numeroActa,
    tipo_comite,
    fecha_reunion: fecha,
    fecha: fecha,
    hora_inicio,
    hora_fin,
    lugar,
    puntos_tratados: puntos,
    puntos_orden: puntos,
    asistentes_confirmados: asistentes,
    asistentes,
    acta_generada: resultado.texto_acta_completo ?? JSON.stringify(resultado),
    texto_acta: resultado.texto_acta_completo ?? JSON.stringify(resultado),
    estado: "borrador",
    created_at: new Date().toISOString(),
  };

  const { data: acta, error: insertError } = await supabase
    .from("actas_comite")
    .insert({
      empresa_id,
      numero_acta: numeroActa,
      fecha_reunion: fecha,
      lugar,
      puntos_tratados: puntos,
      acta_generada: resultado.texto_acta_completo ?? JSON.stringify(resultado),
      estado: "borrador",
      asistentes_confirmados: asistentes,
    })
    .select()
    .single();

  if (insertError) addDemoActa(newActa);

  return res.json({
    acta_id: insertError ? (newActa.id as string) : acta.id,
    numero_acta: numeroActa,
    tipo_comite,
    fecha,
    compromisos: (resultado.compromisos as unknown[]) ?? [],
    texto_acta_completo: (resultado.texto_acta_completo as string) ?? JSON.stringify(resultado),
    raw: resultado,
  });
});

async function handleExportar(req: Request, res: Response) {
  const { actaId } = req.params;
  const formato = ((req.query.formato as string) || "docx").toLowerCase();
  if (formato !== "docx" && formato !== "pdf") {
    return res.status(400).json({ error: "Formato inválido. Use 'docx' o 'pdf'." });
  }

  let acta = (getDemoActaById(actaId) ?? null) as Record<string, unknown> | null;
  if (!acta) {
    const { data } = await supabase.from("actas_comite").select("*").eq("id", actaId).single();
    acta = data ?? null;
  }
  if (!acta) {
    return res.status(404).json({ error: "Acta no encontrada" });
  }

  const empresa = await resolveEmpresa(acta.empresa_id as string);

  const numeroActa = (acta.numero_acta ?? "ACTA") as string;
  const safeNum = numeroActa.replace(/[^a-zA-Z0-9_-]/g, "_");
  const fechaHoy = new Date().toISOString().slice(0, 10);

  let buffer: Buffer;
  let contentType: string;
  let fileName: string;

  try {
    if (formato === "pdf") {
      buffer = await generateActaPdf(acta, empresa);
      contentType = "application/pdf";
      fileName = `Acta_${safeNum}_${fechaHoy}.pdf`;
    } else {
      buffer = await generateActaDocx(acta, empresa);
      contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      fileName = `Acta_${safeNum}_${fechaHoy}.docx`;
    }
  } catch (err) {
    req.log.error({ err }, "Acta document generation failed");
    return res.status(500).json({ error: "Error al generar el documento" });
  }

  const tipoComite = (acta.tipo_comite as string) ?? "COPASST";
  const moduloFolder = tipoComite.toLowerCase().includes("convivencia") ? "Actas_Convivencia" : "Actas_COPASST";
  const driveUrl = await uploadToEmpresaFolder(empresa.nombre, moduloFolder, fileName, buffer, contentType);
  if (!driveUrl) req.log.warn({ actaId, fileName }, "Drive upload failed — file not saved to Drive");

  res.setHeader("Content-Type", contentType);
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
  if (driveUrl) res.setHeader("X-Drive-Url", driveUrl);
  return res.send(buffer);
}

router.get("/:actaId/exportar", handleExportar);
router.post("/:actaId/exportar", handleExportar);

router.get("/:empresaId", async (req, res) => {
  const { data, error } = await supabase
    .from("actas_comite")
    .select("id, empresa_id, numero_acta, fecha_reunion, estado, created_at")
    .eq("empresa_id", req.params.empresaId)
    .order("created_at", { ascending: false });

  if (error) {
    return res.json(getDemoActas().filter((a) => a.empresa_id === req.params.empresaId));
  }
  const combined = [...(data ?? []), ...getDemoActas().filter((a) => a.empresa_id === req.params.empresaId)];
  return res.json(combined);
});

export default router;
