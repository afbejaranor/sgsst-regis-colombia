import { Router } from "express";
import { supabase } from "../lib/supabase";
import { DEMO_EMPRESAS, DEMO_EMPRESA_ID, EMPRESA2_ID, EMPRESA3_ID } from "../lib/demo-data";

const DEMO_IDS = new Set([DEMO_EMPRESA_ID, EMPRESA2_ID, EMPRESA3_ID]);

const router = Router();

router.get("/", async (req, res) => {
  const { data, error } = await supabase
    .from("empresas")
    .select("*")
    .eq("activa", true)
    .order("nombre");

  if (error) {
    req.log.warn({ error }, "Supabase unavailable, using demo data");
    return res.json(DEMO_EMPRESAS);
  }
  return res.json(data?.length ? data : DEMO_EMPRESAS);
});

router.get("/:id", async (req, res) => {
  const { data, error } = await supabase
    .from("empresas")
    .select("*")
    .eq("id", req.params.id)
    .single();

  if (error) {
    const demo = DEMO_EMPRESAS.find((e) => e.id === req.params.id);
    if (demo) return res.json(demo);
    req.log.error({ error }, "Error fetching empresa");
    return res.status(404).json({ error: "Empresa no encontrada" });
  }
  return res.json(data);
});

export default router;
