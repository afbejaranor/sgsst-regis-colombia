import { Router } from "express";
import { supabase } from "../lib/supabase";
import { DEMO_EMPRESA, DEMO_EMPRESA_ID } from "../lib/demo-data";

const router = Router();

router.get("/", async (req, res) => {
  const { data, error } = await supabase
    .from("empresas")
    .select("*")
    .eq("activa", true)
    .order("nombre");

  if (error) {
    req.log.warn({ error }, "Supabase unavailable, using demo data");
    return res.json([DEMO_EMPRESA]);
  }
  return res.json(data?.length ? data : [DEMO_EMPRESA]);
});

router.get("/:id", async (req, res) => {
  const { data, error } = await supabase
    .from("empresas")
    .select("*")
    .eq("id", req.params.id)
    .single();

  if (error) {
    if (req.params.id === DEMO_EMPRESA_ID) return res.json(DEMO_EMPRESA);
    req.log.error({ error }, "Error fetching empresa");
    return res.status(404).json({ error: "Empresa no encontrada" });
  }
  return res.json(data);
});

export default router;
