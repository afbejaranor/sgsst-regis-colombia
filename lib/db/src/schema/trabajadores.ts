import { pgTable, uuid, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const trabajadoresTable = pgTable("trabajadores", {
  id: uuid("id").primaryKey().defaultRandom(),
  empresa_id: uuid("empresa_id").notNull(),
  nombres: text("nombres").notNull(),
  apellidos: text("apellidos").notNull(),
  cedula: text("cedula"),
  cargo: text("cargo"),
  area: text("area"),
  email: text("email"),
  activo: boolean("activo").notNull().default(true),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTrabajadorSchema = createInsertSchema(trabajadoresTable).omit({ id: true, created_at: true });
export type InsertTrabajador = z.infer<typeof insertTrabajadorSchema>;
export type Trabajador = typeof trabajadoresTable.$inferSelect;
