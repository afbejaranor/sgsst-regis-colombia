import { pgTable, uuid, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const comitesTable = pgTable("comites", {
  id: uuid("id").primaryKey().defaultRandom(),
  empresa_id: uuid("empresa_id").notNull(),
  tipo: text("tipo").notNull(),
  vigencia_inicio: text("vigencia_inicio"),
  vigencia_fin: text("vigencia_fin"),
  activo: boolean("activo").notNull().default(true),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertComiteSchema = createInsertSchema(comitesTable).omit({ id: true, created_at: true });
export type InsertComite = z.infer<typeof insertComiteSchema>;
export type Comite = typeof comitesTable.$inferSelect;
