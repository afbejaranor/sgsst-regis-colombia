import { Router } from "express";
import { db } from "@workspace/db";
import { empresasTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { DEMO_EMPRESAS, addDemoEmpresa, removeDemoEmpresa } from "../lib/demo-data";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const data = await db
      .select()
      .from(empresasTable)
      .where(eq(empresasTable.activa, true))
      .orderBy(asc(empresasTable.nombre));
    return res.json(data.length ? data : DEMO_EMPRESAS);
  } catch (err) {
    req.log.warn({ err }, "DB unavailable, using demo data");
    return res.json(DEMO_EMPRESAS);
  }
});

router.post("/", async (req, res) => {
  const {
    nombre,
    nit,
    codigo_ciiu,
    descripcion_actividad,
    tamano,
    num_empleados,
    direccion,
    ciudad,
    contacto_nombre,
    contacto_email,
    contacto_whatsapp,
    nivel_sgsst,
    nivel_normativo,
  } = req.body as {
    nombre: string;
    nit: string;
    codigo_ciiu: string;
    descripcion_actividad?: string;
    tamano?: string;
    num_empleados?: number;
    direccion?: string;
    ciudad?: string;
    contacto_nombre?: string;
    contacto_email?: string;
    contacto_whatsapp?: string;
    nivel_sgsst?: string;
    nivel_normativo?: string;
  };

  if (!nombre?.trim() || !nit?.trim() || !codigo_ciiu?.trim()) {
    return res.status(400).json({ error: "nombre, nit y codigo_ciiu son requeridos" });
  }

  const newEmpresa = {
    nombre: nombre.trim(),
    nit: nit.trim(),
    codigo_ciiu: codigo_ciiu.trim(),
    descripcion_actividad: descripcion_actividad ?? null,
    tamano: tamano ?? null,
    num_empleados: num_empleados ? Number(num_empleados) : null,
    direccion: direccion ?? null,
    ciudad: ciudad ?? null,
    contacto_nombre: contacto_nombre ?? null,
    contacto_email: contacto_email ?? null,
    contacto_whatsapp: contacto_whatsapp ?? null,
    nivel_sgsst: nivel_sgsst ?? "estandar",
    nivel_normativo: nivel_normativo ?? (
      Number(num_empleados) <= 10 ? "7" : Number(num_empleados) <= 50 ? "21" : "60"
    ),
    activa: true,
  };

  try {
    const [inserted] = await db.insert(empresasTable).values(newEmpresa).returning();
    addDemoEmpresa(inserted as Parameters<typeof addDemoEmpresa>[0]);
    return res.status(201).json(inserted);
  } catch (err) {
    req.log.warn({ err }, "DB insert failed, storing in demo list");
    const withId = { ...newEmpresa, id: crypto.randomUUID(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    addDemoEmpresa(withId as Parameters<typeof addDemoEmpresa>[0]);
    return res.status(201).json(withId);
  }
});

router.get("/:id", async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(empresasTable)
      .where(eq(empresasTable.id, req.params.id))
      .limit(1);
    if (rows.length) return res.json(rows[0]);
    const demo = DEMO_EMPRESAS.find((e) => e.id === req.params.id);
    if (demo) return res.json(demo);
    return res.status(404).json({ error: "Empresa no encontrada" });
  } catch (err) {
    const demo = DEMO_EMPRESAS.find((e) => e.id === req.params.id);
    if (demo) return res.json(demo);
    req.log.error({ err }, "Error fetching empresa");
    return res.status(404).json({ error: "Empresa no encontrada" });
  }
});

router.delete("/:id", async (req, res) => {
  const id = String(req.params.id);

  try {
    await db
      .update(empresasTable)
      .set({ activa: false, updated_at: new Date() })
      .where(eq(empresasTable.id, id));
    removeDemoEmpresa(id);
    req.log.info({ id }, "Empresa soft-deleted");
    return res.json({ ok: true });
  } catch (err) {
    req.log.warn({ err, id }, "DB delete failed, removing from demo list");
    removeDemoEmpresa(id);
    return res.json({ ok: true });
  }
});

export default router;
