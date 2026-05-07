import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const registrosPilaTable = pgTable("registros_pila", {
  id: uuid("id").primaryKey().defaultRandom(),
  empresa_id: uuid("empresa_id").notNull(),
  periodo: text("periodo").notNull(),
  estado: text("estado").notNull().default("recibido"),
  fecha_recepcion: timestamp("fecha_recepcion", { withTimezone: true }),
  observaciones: text("observaciones"),
  drive_url: text("drive_url"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertRegistroPilaSchema = createInsertSchema(registrosPilaTable).omit({ id: true, created_at: true, updated_at: true });
export type InsertRegistroPila = z.infer<typeof insertRegistroPilaSchema>;
export type RegistroPila = typeof registrosPilaTable.$inferSelect;
