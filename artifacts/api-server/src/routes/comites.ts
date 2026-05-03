import { Router } from "express";
import { supabase } from "../lib/supabase";
import { DEMO_COMITES } from "../lib/demo-data";

const router = Router();

router.get("/:empresaId", async (req, res) => {
  const { data, error } = await supabase
    .from("comites")
    .select("*")
    .eq("empresa_id", req.params.empresaId)
    .order("created_at", { ascending: false });

  if (error) {
    return res.json(DEMO_COMITES.filter((c) => c.empresa_id === req.params.empresaId));
  }
  return res.json(data?.length ? data : DEMO_COMITES.filter((c) => c.empresa_id === req.params.empresaId));
});

export default router;
