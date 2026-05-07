import { Router } from "express";
import { db } from "@workspace/db";
import { comitesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { DEMO_COMITES } from "../lib/demo-data";

const router = Router();

router.get("/:empresaId", async (req, res) => {
  try {
    const data = await db
      .select()
      .from(comitesTable)
      .where(eq(comitesTable.empresa_id, req.params.empresaId))
      .orderBy(desc(comitesTable.created_at));
    return res.json(data.length ? data : DEMO_COMITES.filter((c) => c.empresa_id === req.params.empresaId));
  } catch (err) {
    req.log.warn({ err }, "DB unavailable, using demo data");
    return res.json(DEMO_COMITES.filter((c) => c.empresa_id === req.params.empresaId));
  }
});

export default router;
