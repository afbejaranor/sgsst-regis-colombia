import { pgTable, uuid, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const empresasTable = pgTable("empresas", {
  id: uuid("id").primaryKey().defaultRandom(),
  nombre: text("nombre").notNull(),
  nit: text("nit").notNull(),
  codigo_ciiu: text("codigo_ciiu").notNull(),
  descripcion_actividad: text("descripcion_actividad"),
  tamano: text("tamano"),
  num_empleados: integer("num_empleados"),
  direccion: text("direccion"),
  ciudad: text("ciudad"),
  contacto_nombre: text("contacto_nombre"),
  contacto_email: text("contacto_email"),
  contacto_whatsapp: text("contacto_whatsapp"),
  nivel_sgsst: text("nivel_sgsst"),
  activa: boolean("activa").notNull().default(true),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertEmpresaSchema = createInsertSchema(empresasTable).omit({ created_at: true, updated_at: true });
export type InsertEmpresa = z.infer<typeof insertEmpresaSchema>;
export type Empresa = typeof empresasTable.$inferSelect;
