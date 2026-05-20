import { Router } from "express";
import { db } from "@workspace/db";
import { documentosGeneralesTable, documentosCumplimientoTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { uploadToEmpresaFolder } from "../lib/drive-client";
import { DEMO_EMPRESAS } from "../lib/demo-data";

const router = Router();

router.get("/:empresaId", async (req, res) => {
  try {
    const data = await db
      .select()
      .from(documentosGeneralesTable)
      .where(eq(documentosGeneralesTable.empresa_id, req.params.empresaId))
      .orderBy(documentosGeneralesTable.created_at);
    return res.json(data);
  } catch (err) {
    req.log.warn({ err }, "DB unavailable for documentos generales");
    return res.json([]);
  }
});

router.post("/subir", async (req, res) => {
  const { empresa_id, nombre, tipo, criterio_codigo, file_base64, mime_type, cargado_por } = req.body as {
    empresa_id: string;
    nombre: string;
    tipo?: string;
    criterio_codigo?: string;
    file_base64?: string;
    mime_type?: string;
    cargado_por?: string;
  };

  if (!empresa_id || !nombre) {
    return res.status(400).json({ error: "empresa_id y nombre son requeridos" });
  }

  const empresaNombre =
    DEMO_EMPRESAS.find((e) => e.id === empresa_id)?.nombre ??
    (await (async () => {
      try {
        const { empresasTable } = await import("@workspace/db");
        const rows = await db.select({ nombre: empresasTable.nombre }).from(empresasTable).where(eq(empresasTable.id, empresa_id)).limit(1);
        return rows[0]?.nombre ?? "Empresa";
      } catch { return "Empresa"; }
    })());

  let driveUrl: string | null = null;
  if (file_base64 && mime_type) {
    try {
      const buffer = Buffer.from(file_base64, "base64");
      driveUrl = await uploadToEmpresaFolder(empresaNombre, "Documentos", nombre, buffer, mime_type);
    } catch (err) {
      req.log.warn({ err }, "Drive upload failed for documento general");
    }
  }

  try {
    const [inserted] = await db
      .insert(documentosGeneralesTable)
      .values({
        empresa_id,
        nombre,
        tipo: tipo ?? null,
        criterio_codigo: criterio_codigo ?? null,
        drive_url: driveUrl,
        estado: "cargado",
        cargado_por: cargado_por ?? null,
      })
      .returning();
    return res.status(201).json(inserted);
  } catch (err) {
    req.log.error({ err }, "Failed to insert documento general");
    return res.status(500).json({ error: "Error al guardar el documento" });
  }
});

router.patch("/:id/validar", async (req, res) => {
  const { estado } = req.body as { estado: "validado" | "aprobado" };
  if (!["validado", "aprobado"].includes(estado)) {
    return res.status(400).json({ error: "estado debe ser 'validado' o 'aprobado'" });
  }

  try {
    const [updated] = await db
      .update(documentosGeneralesTable)
      .set({ estado })
      .where(eq(documentosGeneralesTable.id, req.params.id))
      .returning();

    if (!updated) return res.status(404).json({ error: "Documento no encontrado" });

    if (estado === "aprobado" && updated.criterio_codigo) {
      try {
        await db
          .update(documentosCumplimientoTable)
          .set({ estado: "cumple" })
          .where(eq(documentosCumplimientoTable.criterio_codigo, updated.criterio_codigo));
      } catch (err) {
        req.log.warn({ err }, "Failed to update criterio estado on doc approval");
      }
    }

    return res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to validate documento");
    return res.status(500).json({ error: "Error al validar el documento" });
  }
});

export default router;
