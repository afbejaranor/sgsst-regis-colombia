import { pgTable, uuid, text, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const examenesMedicosTable = pgTable("examenes_medicos", {
  id: uuid("id").primaryKey().defaultRandom(),
  empresa_id: uuid("empresa_id").notNull(),
  trabajador_id: uuid("trabajador_id"),
  nombre_trabajador: text("nombre_trabajador"),
  cedula_trabajador: text("cedula_trabajador"),
  cargo: text("cargo"),
  concepto: text("concepto").notNull().default("pendiente"),
  tipo: text("tipo"),
  fecha_examen: text("fecha_examen"),
  medico: text("medico"),
  restricciones: jsonb("restricciones"),
  recomendaciones: jsonb("recomendaciones"),
  texto_completo: text("texto_completo"),
  drive_url: text("drive_url"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertExamenMedicoSchema = createInsertSchema(examenesMedicosTable).omit({ id: true, created_at: true, updated_at: true });
export type InsertExamenMedico = z.infer<typeof insertExamenMedicoSchema>;
export type ExamenMedico = typeof examenesMedicosTable.$inferSelect;
