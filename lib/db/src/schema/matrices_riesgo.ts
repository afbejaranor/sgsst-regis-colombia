import { pgTable, uuid, text, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const matricesRiesgoTable = pgTable("matrices_riesgo", {
  id: uuid("id").primaryKey().defaultRandom(),
  empresa_id: uuid("empresa_id").notNull(),
  codigo_ciiu: text("codigo_ciiu"),
  contenido_json: jsonb("contenido_json"),
  estado: text("estado").notNull().default("borrador"),
  version: integer("version").notNull().default(1),
  drive_url: text("drive_url"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertMatrizRiesgoSchema = createInsertSchema(matricesRiesgoTable).omit({ id: true, created_at: true, updated_at: true });
export type InsertMatrizRiesgo = z.infer<typeof insertMatrizRiesgoSchema>;
export type MatrizRiesgo = typeof matricesRiesgoTable.$inferSelect;
