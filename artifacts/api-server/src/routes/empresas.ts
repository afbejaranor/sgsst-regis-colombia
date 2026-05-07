import { Router } from "express";
import { supabase } from "../lib/supabase";
import {
  getDemoEmpresas,
  getDemoEmpresaById,
  addDemoEmpresa,
  removeDemoEmpresa,
  DEMO_EMPRESA_ID,
  EMPRESA2_ID,
  EMPRESA3_ID,
} from "../lib/demo-data";

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
    return res.json(getDemoEmpresas());
  }
  return res.json(data?.length ? data : getDemoEmpresas());
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
  };

  if (!nombre?.trim() || !nit?.trim() || !codigo_ciiu?.trim()) {
    return res.status(400).json({ error: "nombre, nit y codigo_ciiu son requeridos" });
  }

  const now = new Date().toISOString();
  const newId = crypto.randomUUID();

  const newEmpresa = {
    id: newId,
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
    activa: true,
    created_at: now,
    updated_at: now,
  };

  const { data: dbEmpresa, error: insertError } = await supabase
    .from("empresas")
    .insert(newEmpresa)
    .select()
    .single();

  if (insertError) {
    req.log.warn({ insertError }, "Supabase insert failed, storing in demo list");
    addDemoEmpresa(newEmpresa as Parameters<typeof addDemoEmpresa>[0]);
    return res.status(201).json(newEmpresa);
  }

  addDemoEmpresa(dbEmpresa as Parameters<typeof addDemoEmpresa>[0]);
  return res.status(201).json(dbEmpresa);
});

router.get("/:id", async (req, res) => {
  const id = String(req.params.id);
  const { data, error } = await supabase
    .from("empresas")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    const demo = getDemoEmpresaById(id);
    if (demo) return res.json(demo);
    req.log.error({ error }, "Error fetching empresa");
    return res.status(404).json({ error: "Empresa no encontrada" });
  }
  return res.json(data);
});

router.delete("/:id", async (req, res) => {
  const id = String(req.params.id);

  if (DEMO_IDS.has(id)) {
    removeDemoEmpresa(id);
    req.log.info({ id }, "Demo empresa removed from in-memory list");
    return res.json({ ok: true });
  }

  const { error } = await supabase
    .from("empresas")
    .update({ activa: false, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    req.log.warn({ error, id }, "Supabase delete failed, removing from demo list");
    removeDemoEmpresa(id);
    return res.json({ ok: true });
  }

  removeDemoEmpresa(id);
  req.log.info({ id }, "Empresa soft-deleted");
  return res.json({ ok: true });
});

export default router;
