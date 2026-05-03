import { Router } from "express";
import { supabase } from "../lib/supabase";
import { DEMO_TRABAJADORES } from "../lib/demo-data";

const router = Router();

router.get("/:empresaId", async (req, res) => {
  const { data, error } = await supabase
    .from("trabajadores")
    .select("*")
    .eq("empresa_id", req.params.empresaId)
    .eq("activo", true)
    .order("apellidos");

  if (error) {
    return res.json(DEMO_TRABAJADORES.filter((t) => t.empresa_id === req.params.empresaId));
  }
  return res.json(data?.length ? data : DEMO_TRABAJADORES.filter((t) => t.empresa_id === req.params.empresaId));
});

export default router;
