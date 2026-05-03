-- ============================================================
-- SEED: Datos de prueba Regis Colombia
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. Empresa de prueba
INSERT INTO empresas (
  id, nombre, nit, codigo_ciiu, descripcion_actividad,
  tamano, num_empleados, ciudad, direccion,
  contacto_nombre, contacto_email, contacto_whatsapp,
  nivel_sgsst, activa
) VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Comercializadora Demo SAS',
  '900123456-1',
  '4711',
  'Comercio al por menor en establecimientos no especializados con surtido compuesto principalmente de alimentos, bebidas y tabaco',
  'pequeña',
  45,
  'Bogotá',
  'Cra 15 # 72-45, Chapinero',
  'María García',
  'maria.garcia@comercializadorademo.com',
  '3001234567',
  'estandar',
  true
);

-- 2. Trabajadores de prueba
INSERT INTO trabajadores (empresa_id, nombres, apellidos, cedula, cargo, area, email, activo)
VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Juan Carlos', 'Pérez López', '12345678', 'Gerente General', 'Gerencia', 'jperez@comercializadorademo.com', true),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Ana María', 'Rodríguez Torres', '23456789', 'Jefe RRHH', 'Recursos Humanos', 'arodriguez@comercializadorademo.com', true),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Carlos', 'Morales Sánchez', '34567890', 'Responsable SST', 'SST', 'cmorales@comercializadorademo.com', true),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Lucía', 'Hernández Díaz', '45678901', 'Vendedor', 'Ventas', 'lhernandez@comercializadorademo.com', true),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Roberto', 'Gómez Vargas', '56789012', 'Bodeguero', 'Logística', 'rgomez@comercializadorademo.com', true);

-- 3. COPASST vigente
INSERT INTO comites (empresa_id, tipo, vigencia_inicio, vigencia_fin, activo)
VALUES ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'COPASST', '2025-01-15', '2027-01-14', true);

-- Miembros COPASST (se obtiene el ID del comité insertado)
-- Titular empleador: Jefe RRHH como Presidente
-- Titular trabajador: Responsable SST como Secretario
-- (Ajustar IDs según lo que inserte la DB)

-- 4. Comité de Convivencia
INSERT INTO comites (empresa_id, tipo, vigencia_inicio, vigencia_fin, activo)
VALUES ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'convivencia', '2025-03-01', '2027-02-28', true);

-- ============================================================
-- SEED: Criterios Resolución 0312 para empresa de prueba
-- Empresas entre 11-50 trabajadores → Estándar (60 estándares)
-- Aquí se usa el nivel III (>50) como demo más completo
-- ============================================================

DO $$
DECLARE
  empresa_uuid UUID := 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
BEGIN

-- ESTÁNDAR I: RECURSOS (10%)
INSERT INTO documentos_cumplimiento (empresa_id, estandar, criterio_codigo, criterio_descripcion, peso_porcentual, estado) VALUES
(empresa_uuid, 'I. Recursos', '1.1.1', 'Responsable del SG-SST con funciones definidas', 0.5, 'cumple'),
(empresa_uuid, 'I. Recursos', '1.1.2', 'Responsabilidades del SG-SST definidas y documentadas', 0.5, 'cumple'),
(empresa_uuid, 'I. Recursos', '1.1.3', 'Asignación de recursos para el SG-SST', 0.5, 'cumple'),
(empresa_uuid, 'I. Recursos', '1.1.4', 'Afiliación al Sistema General de Riesgos Laborales', 0.5, 'cumple'),
(empresa_uuid, 'I. Recursos', '1.1.5', 'Pago de pensión trabajadores alto riesgo', 0.5, 'no_aplica'),
(empresa_uuid, 'I. Recursos', '1.1.6', 'Conformación COPASST / Vigía', 0.5, 'cumple'),
(empresa_uuid, 'I. Recursos', '1.1.7', 'Capacitación COPASST / Vigía', 0.5, 'no_cumple'),
(empresa_uuid, 'I. Recursos', '1.1.8', 'Conformación Comité de Convivencia Laboral', 0.5, 'cumple'),
(empresa_uuid, 'I. Recursos', '1.2.1', 'Programa Capacitación promoción y prevención PYP', 2.0, 'en_proceso'),
(empresa_uuid, 'I. Recursos', '1.2.2', 'Inducción y reinducción en SG-SST, actividades, peligros y riesgos', 2.0, 'no_cumple'),
(empresa_uuid, 'I. Recursos', '1.2.3', 'Responsables del SG-SST con curso virtual de 50 horas', 2.0, 'cumple');

-- ESTÁNDAR II: GESTIÓN INTEGRAL SG-SST (15%)
INSERT INTO documentos_cumplimiento (empresa_id, estandar, criterio_codigo, criterio_descripcion, peso_porcentual, estado) VALUES
(empresa_uuid, 'II. Gestión Integral SG-SST', '2.1.1', 'Política del SG-SST firmada, fechada y comunicada al trabajador', 1.0, 'cumple'),
(empresa_uuid, 'II. Gestión Integral SG-SST', '2.2.1', 'Objetivos definidos, claros, medibles, cuantificables y en tiempo', 1.0, 'cumple'),
(empresa_uuid, 'II. Gestión Integral SG-SST', '2.3.1', 'Evaluación e identificación de prioridades', 1.0, 'cumple'),
(empresa_uuid, 'II. Gestión Integral SG-SST', '2.4.1', 'Plan de trabajo anual y cronograma de actividades', 2.0, 'cumple'),
(empresa_uuid, 'II. Gestión Integral SG-SST', '2.5.1', 'Archivo o retención documental del SG-SST', 2.0, 'en_proceso'),
(empresa_uuid, 'II. Gestión Integral SG-SST', '2.6.1', 'Rendición de cuentas al interior de la empresa', 1.0, 'no_cumple'),
(empresa_uuid, 'II. Gestión Integral SG-SST', '2.7.1', 'Matriz legal actualizada con normativa del SG-SST aplicable', 2.0, 'cumple'),
(empresa_uuid, 'II. Gestión Integral SG-SST', '2.8.1', 'Mecanismos de comunicación, auto reporte SG-SST', 1.0, 'no_cumple'),
(empresa_uuid, 'II. Gestión Integral SG-SST', '2.9.1', 'Identificación, evaluación para adquisición de productos y servicios', 1.0, 'no_cumple'),
(empresa_uuid, 'II. Gestión Integral SG-SST', '2.10.1', 'Evaluación y selección de proveedores y contratistas', 2.0, 'no_cumple'),
(empresa_uuid, 'II. Gestión Integral SG-SST', '2.11.1', 'Evaluación del impacto de cambios internos y externos en el SG-SST', 1.0, 'no_cumple');

-- ESTÁNDAR III: GESTIÓN DE LA SALUD (20%)
INSERT INTO documentos_cumplimiento (empresa_id, estandar, criterio_codigo, criterio_descripcion, peso_porcentual, estado) VALUES
(empresa_uuid, 'III. Gestión de la Salud', '3.1.1', 'Evaluación Médica Ocupacional', 1.0, 'cumple'),
(empresa_uuid, 'III. Gestión de la Salud', '3.1.2', 'Actividades de Promoción y Prevención en Salud', 1.0, 'en_proceso'),
(empresa_uuid, 'III. Gestión de la Salud', '3.1.3', 'Información al médico de los perfiles de cargo', 1.0, 'cumple'),
(empresa_uuid, 'III. Gestión de la Salud', '3.1.4', 'Realización de los exámenes médicos ocupacionales', 1.0, 'cumple'),
(empresa_uuid, 'III. Gestión de la Salud', '3.1.5', 'Custodia de Historias Clínicas', 1.0, 'cumple'),
(empresa_uuid, 'III. Gestión de la Salud', '3.1.6', 'Restricciones y recomendaciones médico laborales', 1.0, 'en_proceso'),
(empresa_uuid, 'III. Gestión de la Salud', '3.1.7', 'Estilos de vida y entornos saludables', 1.0, 'no_cumple'),
(empresa_uuid, 'III. Gestión de la Salud', '3.1.8', 'Agua potable, servicios sanitarios y disposición de basuras', 1.0, 'cumple'),
(empresa_uuid, 'III. Gestión de la Salud', '3.1.9', 'Eliminación adecuada de residuos sólidos, líquidos o gaseosos', 1.0, 'cumple'),
(empresa_uuid, 'III. Gestión de la Salud', '3.2.1', 'Reporte de los accidentes de trabajo y enfermedad laboral a la ARL', 2.0, 'cumple'),
(empresa_uuid, 'III. Gestión de la Salud', '3.2.2', 'Investigación de Accidentes, Incidentes y Enfermedad Laboral', 2.0, 'en_proceso'),
(empresa_uuid, 'III. Gestión de la Salud', '3.2.3', 'Registro y análisis estadístico de Incidentes, AT y EL', 1.0, 'no_cumple'),
(empresa_uuid, 'III. Gestión de la Salud', '3.3.1', 'Medición de la severidad de los Accidentes de Trabajo y EL', 1.0, 'no_cumple'),
(empresa_uuid, 'III. Gestión de la Salud', '3.3.2', 'Medición de la frecuencia de los Incidentes, AT y EL', 1.0, 'no_cumple'),
(empresa_uuid, 'III. Gestión de la Salud', '3.3.3', 'Medición de la mortalidad de AT y EL', 1.0, 'no_cumple'),
(empresa_uuid, 'III. Gestión de la Salud', '3.3.4', 'Medición de la prevalencia de incidentes, AT y EL', 1.0, 'no_cumple'),
(empresa_uuid, 'III. Gestión de la Salud', '3.3.5', 'Medición de la incidencia de AT y EL', 1.0, 'no_cumple'),
(empresa_uuid, 'III. Gestión de la Salud', '3.3.6', 'Medición del ausentismo por incidentes, AT y EL', 1.0, 'no_cumple');

-- ESTÁNDAR IV: GESTIÓN DE PELIGROS Y RIESGOS (30%)
INSERT INTO documentos_cumplimiento (empresa_id, estandar, criterio_codigo, criterio_descripcion, peso_porcentual, estado) VALUES
(empresa_uuid, 'IV. Gestión de Peligros y Riesgos', '4.1.1', 'Metodología para identificación, evaluación y valoración de peligros', 4.0, 'cumple'),
(empresa_uuid, 'IV. Gestión de Peligros y Riesgos', '4.1.2', 'Identificación de peligros con participación de todos los niveles', 4.0, 'en_proceso'),
(empresa_uuid, 'IV. Gestión de Peligros y Riesgos', '4.1.3', 'Identificación y priorización de la naturaleza de los peligros', 3.0, 'en_proceso'),
(empresa_uuid, 'IV. Gestión de Peligros y Riesgos', '4.1.4', 'Realización mediciones ambientales, químicos, físicos y biológicos', 4.0, 'no_cumple'),
(empresa_uuid, 'IV. Gestión de Peligros y Riesgos', '4.2.1', 'Se implementan las medidas de prevención y control de peligros', 2.5, 'en_proceso'),
(empresa_uuid, 'IV. Gestión de Peligros y Riesgos', '4.2.2', 'Se verifica aplicación de las medidas de prevención y control', 2.5, 'no_cumple'),
(empresa_uuid, 'IV. Gestión de Peligros y Riesgos', '4.2.3', 'Hay procedimientos, instructivos, fichas técnicas, otros', 2.5, 'no_cumple'),
(empresa_uuid, 'IV. Gestión de Peligros y Riesgos', '4.2.4', 'Inspección con el COPASST o Vigía', 2.5, 'no_cumple'),
(empresa_uuid, 'IV. Gestión de Peligros y Riesgos', '4.2.5', 'Mantenimiento periódico de instalaciones, equipos, máquinas', 2.5, 'cumple'),
(empresa_uuid, 'IV. Gestión de Peligros y Riesgos', '4.2.6', 'Entrega de Elementos de Protección Personal EPP verificada', 2.5, 'cumple');

-- ESTÁNDAR V: GESTIÓN DE AMENAZAS (10%)
INSERT INTO documentos_cumplimiento (empresa_id, estandar, criterio_codigo, criterio_descripcion, peso_porcentual, estado) VALUES
(empresa_uuid, 'V. Gestión de Amenazas', '5.1.1', 'Plan de Prevención, Preparación y Respuesta ante Emergencias', 5.0, 'no_cumple'),
(empresa_uuid, 'V. Gestión de Amenazas', '5.1.2', 'Brigada de prevención conformada, capacitada y dotada', 5.0, 'no_cumple');

-- ESTÁNDAR VI: VERIFICACIÓN (5%)
INSERT INTO documentos_cumplimiento (empresa_id, estandar, criterio_codigo, criterio_descripcion, peso_porcentual, estado) VALUES
(empresa_uuid, 'VI. Verificación del SG-SST', '6.1.1', 'Indicadores estructura, proceso y resultado', 1.25, 'no_cumple'),
(empresa_uuid, 'VI. Verificación del SG-SST', '6.1.2', 'Auditoría anual del SG-SST', 1.25, 'no_cumple'),
(empresa_uuid, 'VI. Verificación del SG-SST', '6.1.3', 'Revisión anual por la alta dirección', 1.25, 'no_cumple'),
(empresa_uuid, 'VI. Verificación del SG-SST', '6.1.4', 'Planificación auditorías con el COPASST', 1.25, 'no_cumple');

-- ESTÁNDAR VII: MEJORAMIENTO (10%)
INSERT INTO documentos_cumplimiento (empresa_id, estandar, criterio_codigo, criterio_descripcion, peso_porcentual, estado) VALUES
(empresa_uuid, 'VII. Mejoramiento', '7.1.1', 'Acciones de Promoción y Prevención basadas en resultados', 2.5, 'no_cumple'),
(empresa_uuid, 'VII. Mejoramiento', '7.1.2', 'Toma de medidas correctivas, preventivas y de mejora', 2.5, 'no_cumple'),
(empresa_uuid, 'VII. Mejoramiento', '7.1.3', 'Ejecución de acciones preventivas, correctivas y de mejora', 2.5, 'no_cumple'),
(empresa_uuid, 'VII. Mejoramiento', '7.1.4', 'Implementar medidas correctivas de autoridades y ARL', 2.5, 'no_cumple');

END $$;

-- ============================================================
-- VISTA: Cálculo de cumplimiento en tiempo real
-- ============================================================
CREATE OR REPLACE VIEW v_cumplimiento_empresa AS
SELECT 
  e.id as empresa_id,
  e.nombre,
  e.nit,
  e.tamano,
  e.num_empleados,
  dc.estandar,
  SUM(CASE WHEN dc.estado = 'cumple' THEN dc.peso_porcentual ELSE 0 END) as puntaje_obtenido,
  SUM(CASE WHEN dc.estado != 'no_aplica' THEN dc.peso_porcentual ELSE 0 END) as puntaje_posible,
  COUNT(CASE WHEN dc.estado = 'cumple' THEN 1 END) as criterios_cumplidos,
  COUNT(CASE WHEN dc.estado = 'no_cumple' THEN 1 END) as criterios_incumplidos,
  COUNT(CASE WHEN dc.estado = 'en_proceso' THEN 1 END) as criterios_en_proceso,
  COUNT(CASE WHEN dc.estado = 'no_aplica' THEN 1 END) as criterios_no_aplican
FROM empresas e
JOIN documentos_cumplimiento dc ON e.id = dc.empresa_id
GROUP BY e.id, e.nombre, e.nit, e.tamano, e.num_empleados, dc.estandar;

CREATE OR REPLACE VIEW v_puntaje_total_empresa AS
SELECT
  empresa_id,
  nombre,
  nit,
  SUM(puntaje_obtenido) as puntaje_total,
  ROUND((SUM(puntaje_obtenido) / NULLIF(SUM(puntaje_posible), 0)) * 100, 1) as porcentaje_cumplimiento,
  CASE 
    WHEN (SUM(puntaje_obtenido) / NULLIF(SUM(puntaje_posible), 0)) * 100 >= 86 THEN 'ALTO'
    WHEN (SUM(puntaje_obtenido) / NULLIF(SUM(puntaje_posible), 0)) * 100 >= 61 THEN 'MODERADO'
    ELSE 'CRITICO'
  END as nivel_cumplimiento
FROM v_cumplimiento_empresa
GROUP BY empresa_id, nombre, nit;

-- Verificar puntaje de la empresa demo
SELECT * FROM v_puntaje_total_empresa;
SELECT * FROM v_cumplimiento_empresa WHERE nombre = 'Comercializadora Demo SAS' ORDER BY estandar;
