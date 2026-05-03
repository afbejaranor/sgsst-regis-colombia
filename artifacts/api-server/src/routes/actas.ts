import { Router } from "express";
import { supabase } from "../lib/supabase";
import { callAI } from "../lib/ai";
import { SKILL_ACTAS_COPASST } from "../lib/skills";
import { DEMO_EMPRESA, getDemoActas, addDemoActa } from "../lib/demo-data";

const router = Router();

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

  const { data: empresa } = await supabase
    .from("empresas")
    .select("nombre, nit, ciudad")
    .eq("id", empresa_id)
    .single();

  const empresaData = empresa ?? { nombre: DEMO_EMPRESA.nombre, nit: DEMO_EMPRESA.nit, ciudad: DEMO_EMPRESA.ciudad };

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
    fecha_reunion: fecha,
    lugar,
    puntos_tratados: puntos,
    acta_generada: resultado.texto_acta_completo ?? JSON.stringify(resultado),
    estado: "borrador",
    asistentes_confirmados: asistentes,
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
    acta_id: insertError ? newActa.id : acta.id,
    numero_acta: numeroActa,
    tipo_comite,
    fecha,
    compromisos: (resultado.compromisos as unknown[]) ?? [],
    texto_acta_completo: (resultado.texto_acta_completo as string) ?? JSON.stringify(resultado),
    raw: resultado,
  });
});

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
