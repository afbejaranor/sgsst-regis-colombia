-- ================================================
-- SG-SST Regis Colombia — Migration 2026-05-21
-- Run this in Supabase SQL Editor before the demo
-- ================================================

-- 1. Add nivel_normativo to empresas table
ALTER TABLE empresas
  ADD COLUMN IF NOT EXISTS nivel_normativo TEXT DEFAULT '21';

-- Update existing companies based on num_empleados
UPDATE empresas SET nivel_normativo = '7'  WHERE num_empleados <= 10;
UPDATE empresas SET nivel_normativo = '21' WHERE num_empleados > 10 AND num_empleados <= 50;
UPDATE empresas SET nivel_normativo = '60' WHERE num_empleados > 50;

-- 2. Add nivel_minimo to plantilla_criterios_0312 for scalable standards
ALTER TABLE plantilla_criterios_0312
  ADD COLUMN IF NOT EXISTS nivel_minimo TEXT DEFAULT '60';

-- Mark 7 basic standards (Art. 9 Res. 0312 - micro enterprises ≤10 workers)
UPDATE plantilla_criterios_0312 SET nivel_minimo = '7' WHERE criterio_codigo IN (
  '1.1.1','1.1.2','1.1.3','1.1.4','1.1.6',
  '2.1.1',
  '3.1.1',
  '4.1.1',
  '5.1.1',
  '6.1.1',
  '7.1.1','7.1.2'
);

-- Mark 21 standards (Art. 14 Res. 0312 - small companies 11-50 workers)
-- includes all 7-standard criteria plus the following:
UPDATE plantilla_criterios_0312 SET nivel_minimo = '21' WHERE criterio_codigo IN (
  '1.1.1','1.1.2','1.1.3','1.1.4','1.1.5','1.1.6','1.1.7','1.1.8',
  '1.2.1','1.2.2','1.2.3',
  '2.1.1','2.2.1','2.3.1',
  '2.4.1',
  '2.5.1',
  '2.6.1',
  '2.7.1',
  '2.8.1',
  '2.9.1',
  '2.10.1',
  '2.11.1',
  '2.12.1',
  '3.1.1','3.1.2',
  '4.1.1','4.1.2','4.1.3','4.1.4',
  '4.2.1','4.2.2','4.2.3','4.2.4','4.2.5','4.2.6',
  '5.1.1','5.1.2','5.1.3',
  '6.1.1','6.1.2','6.1.3','6.1.4',
  '7.1.1','7.1.2','7.1.3','7.1.4','7.1.5'
);
-- Note: Remaining criteria (not updated) stay at '60' = full scope

-- 3. Create documentos_generales table
CREATE TABLE IF NOT EXISTS documentos_generales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  tipo TEXT,
  criterio_codigo TEXT,
  drive_url TEXT,
  estado TEXT NOT NULL DEFAULT 'cargado',
  cargado_por TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookups by empresa
CREATE INDEX IF NOT EXISTS idx_documentos_generales_empresa_id
  ON documentos_generales(empresa_id);

-- Row Level Security (RLS) — same pattern as other tables
ALTER TABLE documentos_generales ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Allow all for service role"
  ON documentos_generales
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 4. Grant permissions
GRANT ALL ON documentos_generales TO service_role;
GRANT SELECT ON documentos_generales TO anon;
