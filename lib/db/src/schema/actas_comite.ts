import { pgTable, uuid, text, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const actasComiteTable = pgTable("actas_comite", {
  id: uuid("id").primaryKey().defaultRandom(),
  empresa_id: uuid("empresa_id").notNull(),
  numero_acta: text("numero_acta"),
  tipo_comite: text("tipo_comite").notNull(),
  version: integer("version").notNull().default(1),
  fecha_reunion: text("fecha_reunion"),
  lugar: text("lugar"),
  hora_inicio: text("hora_inicio"),
  hora_fin: text("hora_fin"),
  citada_por: text("citada_por"),
  puntos_tratados: jsonb("puntos_tratados"),
  asistentes_confirmados: jsonb("asistentes_confirmados"),
  compromisos: jsonb("compromisos"),
  acta_generada: text("acta_generada"),
  estado: text("estado").notNull().default("borrador"),
  drive_url: text("drive_url"),
  drive_url_firmada: text("drive_url_firmada"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertActaComiteSchema = createInsertSchema(actasComiteTable).omit({ id: true, created_at: true, updated_at: true });
export type InsertActaComite = z.infer<typeof insertActaComiteSchema>;
export type ActaComite = typeof actasComiteTable.$inferSelect;
