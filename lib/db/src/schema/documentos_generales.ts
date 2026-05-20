import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const documentosGeneralesTable = pgTable("documentos_generales", {
  id: uuid("id").primaryKey().defaultRandom(),
  empresa_id: uuid("empresa_id").notNull(),
  nombre: text("nombre").notNull(),
  tipo: text("tipo"),
  criterio_codigo: text("criterio_codigo"),
  drive_url: text("drive_url"),
  estado: text("estado").notNull().default("cargado"),
  cargado_por: text("cargado_por"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertDocumentoGeneralSchema = createInsertSchema(documentosGeneralesTable).omit({ id: true, created_at: true });
export type InsertDocumentoGeneral = z.infer<typeof insertDocumentoGeneralSchema>;
export type DocumentoGeneral = typeof documentosGeneralesTable.$inferSelect;
