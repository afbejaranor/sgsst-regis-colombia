import { pgTable, uuid, text, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const documentosCumplimientoTable = pgTable("documentos_cumplimiento", {
  id: uuid("id").primaryKey().defaultRandom(),
  empresa_id: uuid("empresa_id").notNull(),
  estandar: text("estandar").notNull(),
  criterio_codigo: text("criterio_codigo").notNull(),
  criterio_descripcion: text("criterio_descripcion").notNull(),
  peso_porcentual: real("peso_porcentual").notNull(),
  estado: text("estado").notNull().default("no_cumple"),
  observaciones: text("observaciones"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertDocumentoCumplimientoSchema = createInsertSchema(documentosCumplimientoTable).omit({ id: true, created_at: true, updated_at: true });
export type InsertDocumentoCumplimiento = z.infer<typeof insertDocumentoCumplimientoSchema>;
export type DocumentoCumplimiento = typeof documentosCumplimientoTable.$inferSelect;
