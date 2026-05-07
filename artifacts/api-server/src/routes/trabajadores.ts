import { Router } from "express";
import { db } from "@workspace/db";
import { trabajadoresTable } from "@workspace/db";
import { eq, and, asc } from "drizzle-orm";
import { DEMO_TRABAJADORES } from "../lib/demo-data";

const router = Router();

router.get("/:empresaId", async (req, res) => {
  try {
    const data = await db
      .select()
      .from(trabajadoresTable)
      .where(and(
        eq(trabajadoresTable.empresa_id, req.params.empresaId),
        eq(trabajadoresTable.activo, true)
      ))
      .orderBy(asc(trabajadoresTable.apellidos));
    return res.json(data.length ? data : DEMO_TRABAJADORES.filter((t) => t.empresa_id === req.params.empresaId));
  } catch (err) {
    req.log.warn({ err }, "DB unavailable, using demo data");
    return res.json(DEMO_TRABAJADORES.filter((t) => t.empresa_id === req.params.empresaId));
  }
});

export default router;
