export const DEMO_EMPRESA_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

export const DEMO_EMPRESA = {
  id: DEMO_EMPRESA_ID,
  nombre: "Comercializadora Demo SAS",
  nit: "900123456-1",
  codigo_ciiu: "4711",
  descripcion_actividad: "Comercio al por menor en establecimientos no especializados",
  tamano: "pequeña",
  num_empleados: 45,
  direccion: "Cra 15 # 72-45, Chapinero",
  ciudad: "Bogotá",
  contacto_nombre: "María García",
  contacto_email: "maria.garcia@comercializadorademo.com",
  contacto_whatsapp: "3001234567",
  nivel_sgsst: "estandar",
  activa: true,
  created_at: "2025-01-15T00:00:00Z",
  updated_at: "2025-01-15T00:00:00Z",
};

export const DEMO_CRITERIOS = [
  { id: "c001", empresa_id: DEMO_EMPRESA_ID, estandar: "I. Recursos", criterio_codigo: "1.1.1", criterio_descripcion: "Responsable del SG-SST con funciones definidas", peso_porcentual: 0.5, estado: "cumple", observaciones: null },
  { id: "c002", empresa_id: DEMO_EMPRESA_ID, estandar: "I. Recursos", criterio_codigo: "1.1.2", criterio_descripcion: "Responsabilidades del SG-SST definidas y documentadas", peso_porcentual: 0.5, estado: "cumple", observaciones: null },
  { id: "c003", empresa_id: DEMO_EMPRESA_ID, estandar: "I. Recursos", criterio_codigo: "1.1.3", criterio_descripcion: "Asignación de recursos para el SG-SST", peso_porcentual: 0.5, estado: "cumple", observaciones: null },
  { id: "c004", empresa_id: DEMO_EMPRESA_ID, estandar: "I. Recursos", criterio_codigo: "1.1.4", criterio_descripcion: "Afiliación al Sistema General de Riesgos Laborales", peso_porcentual: 0.5, estado: "cumple", observaciones: null },
  { id: "c005", empresa_id: DEMO_EMPRESA_ID, estandar: "I. Recursos", criterio_codigo: "1.1.5", criterio_descripcion: "Pago de pensión trabajadores alto riesgo", peso_porcentual: 0.5, estado: "no_aplica", observaciones: null },
  { id: "c006", empresa_id: DEMO_EMPRESA_ID, estandar: "I. Recursos", criterio_codigo: "1.1.6", criterio_descripcion: "Conformación COPASST / Vigía", peso_porcentual: 0.5, estado: "cumple", observaciones: null },
  { id: "c007", empresa_id: DEMO_EMPRESA_ID, estandar: "I. Recursos", criterio_codigo: "1.1.7", criterio_descripcion: "Capacitación COPASST / Vigía", peso_porcentual: 0.5, estado: "no_cumple", observaciones: null },
  { id: "c008", empresa_id: DEMO_EMPRESA_ID, estandar: "I. Recursos", criterio_codigo: "1.1.8", criterio_descripcion: "Conformación Comité de Convivencia Laboral", peso_porcentual: 0.5, estado: "cumple", observaciones: null },
  { id: "c009", empresa_id: DEMO_EMPRESA_ID, estandar: "I. Recursos", criterio_codigo: "1.2.1", criterio_descripcion: "Programa Capacitación promoción y prevención PYP", peso_porcentual: 2.0, estado: "en_proceso", observaciones: null },
  { id: "c010", empresa_id: DEMO_EMPRESA_ID, estandar: "I. Recursos", criterio_codigo: "1.2.2", criterio_descripcion: "Inducción y reinducción en SG-SST", peso_porcentual: 2.0, estado: "no_cumple", observaciones: null },
  { id: "c011", empresa_id: DEMO_EMPRESA_ID, estandar: "I. Recursos", criterio_codigo: "1.2.3", criterio_descripcion: "Responsables del SG-SST con curso virtual de 50 horas", peso_porcentual: 2.0, estado: "cumple", observaciones: null },
  { id: "c012", empresa_id: DEMO_EMPRESA_ID, estandar: "II. Gestión Integral SG-SST", criterio_codigo: "2.1.1", criterio_descripcion: "Política del SG-SST firmada, fechada y comunicada", peso_porcentual: 1.0, estado: "cumple", observaciones: null },
  { id: "c013", empresa_id: DEMO_EMPRESA_ID, estandar: "II. Gestión Integral SG-SST", criterio_codigo: "2.2.1", criterio_descripcion: "Objetivos definidos, claros, medibles, cuantificables", peso_porcentual: 1.0, estado: "cumple", observaciones: null },
  { id: "c014", empresa_id: DEMO_EMPRESA_ID, estandar: "II. Gestión Integral SG-SST", criterio_codigo: "2.3.1", criterio_descripcion: "Evaluación e identificación de prioridades", peso_porcentual: 1.0, estado: "cumple", observaciones: null },
  { id: "c015", empresa_id: DEMO_EMPRESA_ID, estandar: "II. Gestión Integral SG-SST", criterio_codigo: "2.4.1", criterio_descripcion: "Plan de trabajo anual y cronograma de actividades", peso_porcentual: 2.0, estado: "cumple", observaciones: null },
  { id: "c016", empresa_id: DEMO_EMPRESA_ID, estandar: "II. Gestión Integral SG-SST", criterio_codigo: "2.5.1", criterio_descripcion: "Archivo o retención documental del SG-SST", peso_porcentual: 2.0, estado: "en_proceso", observaciones: null },
  { id: "c017", empresa_id: DEMO_EMPRESA_ID, estandar: "II. Gestión Integral SG-SST", criterio_codigo: "2.6.1", criterio_descripcion: "Rendición de cuentas al interior de la empresa", peso_porcentual: 1.0, estado: "no_cumple", observaciones: null },
  { id: "c018", empresa_id: DEMO_EMPRESA_ID, estandar: "II. Gestión Integral SG-SST", criterio_codigo: "2.7.1", criterio_descripcion: "Matriz legal actualizada con normativa del SG-SST", peso_porcentual: 2.0, estado: "cumple", observaciones: null },
  { id: "c019", empresa_id: DEMO_EMPRESA_ID, estandar: "II. Gestión Integral SG-SST", criterio_codigo: "2.8.1", criterio_descripcion: "Mecanismos de comunicación, auto reporte SG-SST", peso_porcentual: 1.0, estado: "no_cumple", observaciones: null },
  { id: "c020", empresa_id: DEMO_EMPRESA_ID, estandar: "II. Gestión Integral SG-SST", criterio_codigo: "2.9.1", criterio_descripcion: "Identificación, evaluación para adquisición de productos", peso_porcentual: 1.0, estado: "no_cumple", observaciones: null },
  { id: "c021", empresa_id: DEMO_EMPRESA_ID, estandar: "II. Gestión Integral SG-SST", criterio_codigo: "2.10.1", criterio_descripcion: "Evaluación y selección de proveedores y contratistas", peso_porcentual: 2.0, estado: "no_cumple", observaciones: null },
  { id: "c022", empresa_id: DEMO_EMPRESA_ID, estandar: "II. Gestión Integral SG-SST", criterio_codigo: "2.11.1", criterio_descripcion: "Evaluación del impacto de cambios internos y externos", peso_porcentual: 1.0, estado: "no_cumple", observaciones: null },
  { id: "c023", empresa_id: DEMO_EMPRESA_ID, estandar: "III. Gestión de la Salud", criterio_codigo: "3.1.1", criterio_descripcion: "Evaluación Médica Ocupacional", peso_porcentual: 1.0, estado: "cumple", observaciones: null },
  { id: "c024", empresa_id: DEMO_EMPRESA_ID, estandar: "III. Gestión de la Salud", criterio_codigo: "3.1.2", criterio_descripcion: "Actividades de Promoción y Prevención en Salud", peso_porcentual: 1.0, estado: "en_proceso", observaciones: null },
  { id: "c025", empresa_id: DEMO_EMPRESA_ID, estandar: "III. Gestión de la Salud", criterio_codigo: "3.1.3", criterio_descripcion: "Información al médico de los perfiles de cargo", peso_porcentual: 1.0, estado: "cumple", observaciones: null },
  { id: "c026", empresa_id: DEMO_EMPRESA_ID, estandar: "III. Gestión de la Salud", criterio_codigo: "3.1.4", criterio_descripcion: "Realización de los exámenes médicos ocupacionales", peso_porcentual: 1.0, estado: "cumple", observaciones: null },
  { id: "c027", empresa_id: DEMO_EMPRESA_ID, estandar: "III. Gestión de la Salud", criterio_codigo: "3.1.5", criterio_descripcion: "Custodia de Historias Clínicas", peso_porcentual: 1.0, estado: "cumple", observaciones: null },
  { id: "c028", empresa_id: DEMO_EMPRESA_ID, estandar: "III. Gestión de la Salud", criterio_codigo: "3.1.6", criterio_descripcion: "Restricciones y recomendaciones médico laborales", peso_porcentual: 1.0, estado: "en_proceso", observaciones: null },
  { id: "c029", empresa_id: DEMO_EMPRESA_ID, estandar: "III. Gestión de la Salud", criterio_codigo: "3.1.7", criterio_descripcion: "Estilos de vida y entornos saludables", peso_porcentual: 1.0, estado: "no_cumple", observaciones: null },
  { id: "c030", empresa_id: DEMO_EMPRESA_ID, estandar: "III. Gestión de la Salud", criterio_codigo: "3.1.8", criterio_descripcion: "Agua potable, servicios sanitarios y disposición de basuras", peso_porcentual: 1.0, estado: "cumple", observaciones: null },
  { id: "c031", empresa_id: DEMO_EMPRESA_ID, estandar: "III. Gestión de la Salud", criterio_codigo: "3.1.9", criterio_descripcion: "Eliminación adecuada de residuos sólidos, líquidos o gaseosos", peso_porcentual: 1.0, estado: "cumple", observaciones: null },
  { id: "c032", empresa_id: DEMO_EMPRESA_ID, estandar: "III. Gestión de la Salud", criterio_codigo: "3.2.1", criterio_descripcion: "Reporte de los accidentes de trabajo y enfermedad laboral", peso_porcentual: 2.0, estado: "cumple", observaciones: null },
  { id: "c033", empresa_id: DEMO_EMPRESA_ID, estandar: "III. Gestión de la Salud", criterio_codigo: "3.2.2", criterio_descripcion: "Investigación de Accidentes, Incidentes y Enfermedad Laboral", peso_porcentual: 2.0, estado: "en_proceso", observaciones: null },
  { id: "c034", empresa_id: DEMO_EMPRESA_ID, estandar: "III. Gestión de la Salud", criterio_codigo: "3.2.3", criterio_descripcion: "Registro y análisis estadístico de Incidentes, AT y EL", peso_porcentual: 1.0, estado: "no_cumple", observaciones: null },
  { id: "c035", empresa_id: DEMO_EMPRESA_ID, estandar: "III. Gestión de la Salud", criterio_codigo: "3.3.1", criterio_descripcion: "Medición de la severidad de los Accidentes de Trabajo", peso_porcentual: 1.0, estado: "no_cumple", observaciones: null },
  { id: "c036", empresa_id: DEMO_EMPRESA_ID, estandar: "III. Gestión de la Salud", criterio_codigo: "3.3.2", criterio_descripcion: "Medición de la frecuencia de los Incidentes, AT y EL", peso_porcentual: 1.0, estado: "no_cumple", observaciones: null },
  { id: "c037", empresa_id: DEMO_EMPRESA_ID, estandar: "III. Gestión de la Salud", criterio_codigo: "3.3.3", criterio_descripcion: "Medición de la mortalidad de AT y EL", peso_porcentual: 1.0, estado: "no_cumple", observaciones: null },
  { id: "c038", empresa_id: DEMO_EMPRESA_ID, estandar: "III. Gestión de la Salud", criterio_codigo: "3.3.4", criterio_descripcion: "Medición de la prevalencia de incidentes, AT y EL", peso_porcentual: 1.0, estado: "no_cumple", observaciones: null },
  { id: "c039", empresa_id: DEMO_EMPRESA_ID, estandar: "III. Gestión de la Salud", criterio_codigo: "3.3.5", criterio_descripcion: "Medición de la incidencia de AT y EL", peso_porcentual: 1.0, estado: "no_cumple", observaciones: null },
  { id: "c040", empresa_id: DEMO_EMPRESA_ID, estandar: "III. Gestión de la Salud", criterio_codigo: "3.3.6", criterio_descripcion: "Medición del ausentismo por incidentes, AT y EL", peso_porcentual: 1.0, estado: "no_cumple", observaciones: null },
  { id: "c041", empresa_id: DEMO_EMPRESA_ID, estandar: "IV. Gestión de Peligros y Riesgos", criterio_codigo: "4.1.1", criterio_descripcion: "Metodología para identificación, evaluación y valoración de peligros", peso_porcentual: 4.0, estado: "cumple", observaciones: null },
  { id: "c042", empresa_id: DEMO_EMPRESA_ID, estandar: "IV. Gestión de Peligros y Riesgos", criterio_codigo: "4.1.2", criterio_descripcion: "Identificación de peligros con participación de todos los niveles", peso_porcentual: 4.0, estado: "en_proceso", observaciones: null },
  { id: "c043", empresa_id: DEMO_EMPRESA_ID, estandar: "IV. Gestión de Peligros y Riesgos", criterio_codigo: "4.1.3", criterio_descripcion: "Identificación y priorización de la naturaleza de los peligros", peso_porcentual: 3.0, estado: "en_proceso", observaciones: null },
  { id: "c044", empresa_id: DEMO_EMPRESA_ID, estandar: "IV. Gestión de Peligros y Riesgos", criterio_codigo: "4.1.4", criterio_descripcion: "Realización mediciones ambientales, químicos, físicos y biológicos", peso_porcentual: 4.0, estado: "no_cumple", observaciones: null },
  { id: "c045", empresa_id: DEMO_EMPRESA_ID, estandar: "IV. Gestión de Peligros y Riesgos", criterio_codigo: "4.2.1", criterio_descripcion: "Se implementan las medidas de prevención y control de peligros", peso_porcentual: 2.5, estado: "en_proceso", observaciones: null },
  { id: "c046", empresa_id: DEMO_EMPRESA_ID, estandar: "IV. Gestión de Peligros y Riesgos", criterio_codigo: "4.2.2", criterio_descripcion: "Se verifica aplicación de las medidas de prevención y control", peso_porcentual: 2.5, estado: "no_cumple", observaciones: null },
  { id: "c047", empresa_id: DEMO_EMPRESA_ID, estandar: "IV. Gestión de Peligros y Riesgos", criterio_codigo: "4.2.3", criterio_descripcion: "Hay procedimientos, instructivos, fichas técnicas", peso_porcentual: 2.5, estado: "no_cumple", observaciones: null },
  { id: "c048", empresa_id: DEMO_EMPRESA_ID, estandar: "IV. Gestión de Peligros y Riesgos", criterio_codigo: "4.2.4", criterio_descripcion: "Inspección con el COPASST o Vigía", peso_porcentual: 2.5, estado: "no_cumple", observaciones: null },
  { id: "c049", empresa_id: DEMO_EMPRESA_ID, estandar: "IV. Gestión de Peligros y Riesgos", criterio_codigo: "4.2.5", criterio_descripcion: "Mantenimiento periódico de instalaciones, equipos, máquinas", peso_porcentual: 2.5, estado: "cumple", observaciones: null },
  { id: "c050", empresa_id: DEMO_EMPRESA_ID, estandar: "IV. Gestión de Peligros y Riesgos", criterio_codigo: "4.2.6", criterio_descripcion: "Entrega de Elementos de Protección Personal EPP verificada", peso_porcentual: 2.5, estado: "cumple", observaciones: null },
  { id: "c051", empresa_id: DEMO_EMPRESA_ID, estandar: "V. Gestión de Amenazas", criterio_codigo: "5.1.1", criterio_descripcion: "Plan de Prevención, Preparación y Respuesta ante Emergencias", peso_porcentual: 5.0, estado: "no_cumple", observaciones: null },
  { id: "c052", empresa_id: DEMO_EMPRESA_ID, estandar: "V. Gestión de Amenazas", criterio_codigo: "5.1.2", criterio_descripcion: "Brigada de prevención conformada, capacitada y dotada", peso_porcentual: 5.0, estado: "no_cumple", observaciones: null },
  { id: "c053", empresa_id: DEMO_EMPRESA_ID, estandar: "VI. Verificación del SG-SST", criterio_codigo: "6.1.1", criterio_descripcion: "Indicadores estructura, proceso y resultado", peso_porcentual: 1.25, estado: "no_cumple", observaciones: null },
  { id: "c054", empresa_id: DEMO_EMPRESA_ID, estandar: "VI. Verificación del SG-SST", criterio_codigo: "6.1.2", criterio_descripcion: "Auditoría anual del SG-SST", peso_porcentual: 1.25, estado: "no_cumple", observaciones: null },
  { id: "c055", empresa_id: DEMO_EMPRESA_ID, estandar: "VI. Verificación del SG-SST", criterio_codigo: "6.1.3", criterio_descripcion: "Revisión anual por la alta dirección", peso_porcentual: 1.25, estado: "no_cumple", observaciones: null },
  { id: "c056", empresa_id: DEMO_EMPRESA_ID, estandar: "VI. Verificación del SG-SST", criterio_codigo: "6.1.4", criterio_descripcion: "Planificación auditorías con el COPASST", peso_porcentual: 1.25, estado: "no_cumple", observaciones: null },
  { id: "c057", empresa_id: DEMO_EMPRESA_ID, estandar: "VII. Mejoramiento", criterio_codigo: "7.1.1", criterio_descripcion: "Acciones de Promoción y Prevención basadas en resultados", peso_porcentual: 2.5, estado: "no_cumple", observaciones: null },
  { id: "c058", empresa_id: DEMO_EMPRESA_ID, estandar: "VII. Mejoramiento", criterio_codigo: "7.1.2", criterio_descripcion: "Toma de medidas correctivas, preventivas y de mejora", peso_porcentual: 2.5, estado: "no_cumple", observaciones: null },
  { id: "c059", empresa_id: DEMO_EMPRESA_ID, estandar: "VII. Mejoramiento", criterio_codigo: "7.1.3", criterio_descripcion: "Ejecución de acciones preventivas, correctivas y de mejora", peso_porcentual: 2.5, estado: "no_cumple", observaciones: null },
  { id: "c060", empresa_id: DEMO_EMPRESA_ID, estandar: "VII. Mejoramiento", criterio_codigo: "7.1.4", criterio_descripcion: "Implementar medidas correctivas de autoridades y ARL", peso_porcentual: 2.5, estado: "no_cumple", observaciones: null },
];

export const DEMO_COMITES = [
  {
    id: "com001",
    empresa_id: DEMO_EMPRESA_ID,
    tipo: "COPASST",
    vigencia_inicio: "2025-01-15",
    vigencia_fin: "2027-01-14",
    activo: true,
    created_at: "2025-01-15T00:00:00Z",
  },
  {
    id: "com002",
    empresa_id: DEMO_EMPRESA_ID,
    tipo: "convivencia",
    vigencia_inicio: "2025-03-01",
    vigencia_fin: "2027-02-28",
    activo: true,
    created_at: "2025-03-01T00:00:00Z",
  },
];

export const DEMO_TRABAJADORES = [
  { id: "t001", empresa_id: DEMO_EMPRESA_ID, nombres: "Juan Carlos", apellidos: "Pérez López", cedula: "12345678", cargo: "Gerente General", area: "Gerencia", email: "jperez@demo.com", activo: true, created_at: "2025-01-15T00:00:00Z" },
  { id: "t002", empresa_id: DEMO_EMPRESA_ID, nombres: "Ana María", apellidos: "Rodríguez Torres", cedula: "23456789", cargo: "Jefe RRHH", area: "Recursos Humanos", email: "arodriguez@demo.com", activo: true, created_at: "2025-01-15T00:00:00Z" },
  { id: "t003", empresa_id: DEMO_EMPRESA_ID, nombres: "Carlos", apellidos: "Morales Sánchez", cedula: "34567890", cargo: "Responsable SST", area: "SST", email: "cmorales@demo.com", activo: true, created_at: "2025-01-15T00:00:00Z" },
  { id: "t004", empresa_id: DEMO_EMPRESA_ID, nombres: "Lucía", apellidos: "Hernández Díaz", cedula: "45678901", cargo: "Vendedor", area: "Ventas", email: "lhernandez@demo.com", activo: true, created_at: "2025-01-15T00:00:00Z" },
  { id: "t005", empresa_id: DEMO_EMPRESA_ID, nombres: "Roberto", apellidos: "Gómez Vargas", cedula: "56789012", cargo: "Bodeguero", area: "Logística", email: "rgomez@demo.com", activo: true, created_at: "2025-01-15T00:00:00Z" },
];

let mutableCriterios = DEMO_CRITERIOS.map(c => ({ ...c }));

export function getDemoCriterios() {
  return mutableCriterios;
}

export function updateDemoCriterio(criterioId: string, estado: string, observaciones?: string) {
  const idx = mutableCriterios.findIndex(c => c.id === criterioId);
  if (idx !== -1) {
    mutableCriterios[idx] = { ...mutableCriterios[idx], estado, observaciones: observaciones ?? null };
    return mutableCriterios[idx];
  }
  return null;
}

let demoExamenes: Record<string, unknown>[] = [];
export function getDemoExamenes() { return demoExamenes; }
export function addDemoExamen(examen: Record<string, unknown>) { demoExamenes = [examen, ...demoExamenes]; }

let demoMatrices: Record<string, unknown>[] = [];
export function getDemoMatrices() { return demoMatrices; }
export function addDemoMatriz(m: Record<string, unknown>) { demoMatrices = [m, ...demoMatrices]; }

let demoActas: Record<string, unknown>[] = [];
export function getDemoActas() { return demoActas; }
export function addDemoActa(a: Record<string, unknown>) { demoActas = [a, ...demoActas]; }
