export const DEMO_EMPRESA_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
export const EMPRESA2_ID = "b2c3d4e5-f6a7-8901-bcde-f12345678901";
export const EMPRESA3_ID = "c3d4e5f6-a7b8-9012-cdef-123456789012";

export const DEMO_EMPRESAS = [
  {
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
  },
  {
    id: EMPRESA2_ID,
    nombre: "Constructora Andina SAS",
    nit: "800456789-2",
    codigo_ciiu: "4111",
    descripcion_actividad: "Construcción de edificios residenciales",
    tamano: "mediana",
    num_empleados: 120,
    direccion: "Cl 50 # 40-20, El Poblado",
    ciudad: "Medellín",
    contacto_nombre: "Ricardo Ospina",
    contacto_email: "ricardo.ospina@constructoraandina.com",
    contacto_whatsapp: "3112345678",
    nivel_sgsst: "estandar",
    activa: true,
    created_at: "2024-06-01T00:00:00Z",
    updated_at: "2025-03-10T00:00:00Z",
  },
  {
    id: EMPRESA3_ID,
    nombre: "Clínica Santa Lucía Ltda",
    nit: "700987654-3",
    codigo_ciiu: "8610",
    descripcion_actividad: "Actividades de hospitales y clínicas con internación",
    tamano: "pequeña",
    num_empleados: 85,
    direccion: "Av 6N # 28-45, San Fernando",
    ciudad: "Cali",
    contacto_nombre: "Dra. Claudia Restrepo",
    contacto_email: "claudia.restrepo@clinicasantalucia.com",
    contacto_whatsapp: "3156789012",
    nivel_sgsst: "avanzado",
    activa: true,
    created_at: "2024-03-01T00:00:00Z",
    updated_at: "2025-04-15T00:00:00Z",
  },
];

export const DEMO_EMPRESA = DEMO_EMPRESAS[0];

type Estado = "cumple" | "no_cumple" | "en_proceso" | "no_aplica";

const CRITERIOS_TEMPLATE: Array<{
  codigo: string;
  estandar: string;
  descripcion: string;
  peso: number;
}> = [
  { codigo: "1.1.1", estandar: "I. Recursos", descripcion: "Responsable del SG-SST con funciones definidas", peso: 0.5 },
  { codigo: "1.1.2", estandar: "I. Recursos", descripcion: "Responsabilidades del SG-SST definidas y documentadas", peso: 0.5 },
  { codigo: "1.1.3", estandar: "I. Recursos", descripcion: "Asignación de recursos para el SG-SST", peso: 0.5 },
  { codigo: "1.1.4", estandar: "I. Recursos", descripcion: "Afiliación al Sistema General de Riesgos Laborales", peso: 0.5 },
  { codigo: "1.1.5", estandar: "I. Recursos", descripcion: "Pago de pensión trabajadores alto riesgo", peso: 0.5 },
  { codigo: "1.1.6", estandar: "I. Recursos", descripcion: "Conformación COPASST / Vigía", peso: 0.5 },
  { codigo: "1.1.7", estandar: "I. Recursos", descripcion: "Capacitación COPASST / Vigía", peso: 0.5 },
  { codigo: "1.1.8", estandar: "I. Recursos", descripcion: "Conformación Comité de Convivencia Laboral", peso: 0.5 },
  { codigo: "1.2.1", estandar: "I. Recursos", descripcion: "Programa Capacitación promoción y prevención PYP", peso: 2.0 },
  { codigo: "1.2.2", estandar: "I. Recursos", descripcion: "Inducción y reinducción en SG-SST", peso: 2.0 },
  { codigo: "1.2.3", estandar: "I. Recursos", descripcion: "Responsables del SG-SST con curso virtual de 50 horas", peso: 2.0 },
  { codigo: "2.1.1", estandar: "II. Gestión Integral SG-SST", descripcion: "Política del SG-SST firmada, fechada y comunicada", peso: 1.0 },
  { codigo: "2.2.1", estandar: "II. Gestión Integral SG-SST", descripcion: "Objetivos definidos, claros, medibles, cuantificables", peso: 1.0 },
  { codigo: "2.3.1", estandar: "II. Gestión Integral SG-SST", descripcion: "Evaluación e identificación de prioridades", peso: 1.0 },
  { codigo: "2.4.1", estandar: "II. Gestión Integral SG-SST", descripcion: "Plan de trabajo anual y cronograma de actividades", peso: 2.0 },
  { codigo: "2.5.1", estandar: "II. Gestión Integral SG-SST", descripcion: "Archivo o retención documental del SG-SST", peso: 2.0 },
  { codigo: "2.6.1", estandar: "II. Gestión Integral SG-SST", descripcion: "Rendición de cuentas al interior de la empresa", peso: 1.0 },
  { codigo: "2.7.1", estandar: "II. Gestión Integral SG-SST", descripcion: "Matriz legal actualizada con normativa del SG-SST", peso: 2.0 },
  { codigo: "2.8.1", estandar: "II. Gestión Integral SG-SST", descripcion: "Mecanismos de comunicación, auto reporte SG-SST", peso: 1.0 },
  { codigo: "2.9.1", estandar: "II. Gestión Integral SG-SST", descripcion: "Identificación, evaluación para adquisición de productos", peso: 1.0 },
  { codigo: "2.10.1", estandar: "II. Gestión Integral SG-SST", descripcion: "Evaluación y selección de proveedores y contratistas", peso: 2.0 },
  { codigo: "2.11.1", estandar: "II. Gestión Integral SG-SST", descripcion: "Evaluación del impacto de cambios internos y externos", peso: 1.0 },
  { codigo: "3.1.1", estandar: "III. Gestión de la Salud", descripcion: "Evaluación Médica Ocupacional", peso: 1.0 },
  { codigo: "3.1.2", estandar: "III. Gestión de la Salud", descripcion: "Actividades de Promoción y Prevención en Salud", peso: 1.0 },
  { codigo: "3.1.3", estandar: "III. Gestión de la Salud", descripcion: "Información al médico de los perfiles de cargo", peso: 1.0 },
  { codigo: "3.1.4", estandar: "III. Gestión de la Salud", descripcion: "Realización de los exámenes médicos ocupacionales", peso: 1.0 },
  { codigo: "3.1.5", estandar: "III. Gestión de la Salud", descripcion: "Custodia de Historias Clínicas", peso: 1.0 },
  { codigo: "3.1.6", estandar: "III. Gestión de la Salud", descripcion: "Restricciones y recomendaciones médico laborales", peso: 1.0 },
  { codigo: "3.1.7", estandar: "III. Gestión de la Salud", descripcion: "Estilos de vida y entornos saludables", peso: 1.0 },
  { codigo: "3.1.8", estandar: "III. Gestión de la Salud", descripcion: "Agua potable, servicios sanitarios y disposición de basuras", peso: 1.0 },
  { codigo: "3.1.9", estandar: "III. Gestión de la Salud", descripcion: "Eliminación adecuada de residuos sólidos, líquidos o gaseosos", peso: 1.0 },
  { codigo: "3.2.1", estandar: "III. Gestión de la Salud", descripcion: "Reporte de los accidentes de trabajo y enfermedad laboral", peso: 2.0 },
  { codigo: "3.2.2", estandar: "III. Gestión de la Salud", descripcion: "Investigación de Accidentes, Incidentes y Enfermedad Laboral", peso: 2.0 },
  { codigo: "3.2.3", estandar: "III. Gestión de la Salud", descripcion: "Registro y análisis estadístico de Incidentes, AT y EL", peso: 1.0 },
  { codigo: "3.3.1", estandar: "III. Gestión de la Salud", descripcion: "Medición de la severidad de los Accidentes de Trabajo", peso: 1.0 },
  { codigo: "3.3.2", estandar: "III. Gestión de la Salud", descripcion: "Medición de la frecuencia de los Incidentes, AT y EL", peso: 1.0 },
  { codigo: "3.3.3", estandar: "III. Gestión de la Salud", descripcion: "Medición de la mortalidad de AT y EL", peso: 1.0 },
  { codigo: "3.3.4", estandar: "III. Gestión de la Salud", descripcion: "Medición de la prevalencia de incidentes, AT y EL", peso: 1.0 },
  { codigo: "3.3.5", estandar: "III. Gestión de la Salud", descripcion: "Medición de la incidencia de AT y EL", peso: 1.0 },
  { codigo: "3.3.6", estandar: "III. Gestión de la Salud", descripcion: "Medición del ausentismo por incidentes, AT y EL", peso: 1.0 },
  { codigo: "4.1.1", estandar: "IV. Gestión de Peligros y Riesgos", descripcion: "Metodología para identificación, evaluación y valoración de peligros", peso: 4.0 },
  { codigo: "4.1.2", estandar: "IV. Gestión de Peligros y Riesgos", descripcion: "Identificación de peligros con participación de todos los niveles", peso: 4.0 },
  { codigo: "4.1.3", estandar: "IV. Gestión de Peligros y Riesgos", descripcion: "Identificación y priorización de la naturaleza de los peligros", peso: 3.0 },
  { codigo: "4.1.4", estandar: "IV. Gestión de Peligros y Riesgos", descripcion: "Realización mediciones ambientales, químicos, físicos y biológicos", peso: 4.0 },
  { codigo: "4.2.1", estandar: "IV. Gestión de Peligros y Riesgos", descripcion: "Se implementan las medidas de prevención y control de peligros", peso: 2.5 },
  { codigo: "4.2.2", estandar: "IV. Gestión de Peligros y Riesgos", descripcion: "Se verifica aplicación de las medidas de prevención y control", peso: 2.5 },
  { codigo: "4.2.3", estandar: "IV. Gestión de Peligros y Riesgos", descripcion: "Hay procedimientos, instructivos, fichas técnicas", peso: 2.5 },
  { codigo: "4.2.4", estandar: "IV. Gestión de Peligros y Riesgos", descripcion: "Inspección con el COPASST o Vigía", peso: 2.5 },
  { codigo: "4.2.5", estandar: "IV. Gestión de Peligros y Riesgos", descripcion: "Mantenimiento periódico de instalaciones, equipos, máquinas", peso: 2.5 },
  { codigo: "4.2.6", estandar: "IV. Gestión de Peligros y Riesgos", descripcion: "Entrega de Elementos de Protección Personal EPP verificada", peso: 2.5 },
  { codigo: "5.1.1", estandar: "V. Gestión de Amenazas", descripcion: "Plan de Prevención, Preparación y Respuesta ante Emergencias", peso: 5.0 },
  { codigo: "5.1.2", estandar: "V. Gestión de Amenazas", descripcion: "Brigada de prevención conformada, capacitada y dotada", peso: 5.0 },
  { codigo: "6.1.1", estandar: "VI. Verificación del SG-SST", descripcion: "Indicadores estructura, proceso y resultado", peso: 1.25 },
  { codigo: "6.1.2", estandar: "VI. Verificación del SG-SST", descripcion: "Auditoría anual del SG-SST", peso: 1.25 },
  { codigo: "6.1.3", estandar: "VI. Verificación del SG-SST", descripcion: "Revisión anual por la alta dirección", peso: 1.25 },
  { codigo: "6.1.4", estandar: "VI. Verificación del SG-SST", descripcion: "Planificación auditorías con el COPASST", peso: 1.25 },
  { codigo: "7.1.1", estandar: "VII. Mejoramiento", descripcion: "Acciones de Promoción y Prevención basadas en resultados", peso: 2.5 },
  { codigo: "7.1.2", estandar: "VII. Mejoramiento", descripcion: "Toma de medidas correctivas, preventivas y de mejora", peso: 2.5 },
  { codigo: "7.1.3", estandar: "VII. Mejoramiento", descripcion: "Ejecución de acciones preventivas, correctivas y de mejora", peso: 2.5 },
  { codigo: "7.1.4", estandar: "VII. Mejoramiento", descripcion: "Implementar medidas correctivas de autoridades y ARL", peso: 2.5 },
];

function makeCriterios(empresaId: string, prefix: string, states: Estado[]) {
  return CRITERIOS_TEMPLATE.map((t, i) => ({
    id: `${prefix}${String(i + 1).padStart(3, "0")}`,
    empresa_id: empresaId,
    estandar: t.estandar,
    criterio_codigo: t.codigo,
    criterio_descripcion: t.descripcion,
    peso_porcentual: t.peso,
    estado: states[i] ?? "no_cumple",
    observaciones: null as string | null,
  }));
}

// Empresa 1: Comercializadora Demo SAS — ~29% (Crítico)
// 60 estados: muchos no_cumple, algunos cumple en lo básico
const states1: Estado[] = [
  // I. Recursos (0-10)
  "cumple", "cumple", "cumple", "cumple", "no_aplica", "cumple", "no_cumple", "cumple",
  "en_proceso", "no_cumple", "cumple",
  // II. Gestión Integral (11-21)
  "cumple", "cumple", "cumple", "cumple", "en_proceso",
  "no_cumple", "cumple", "no_cumple", "no_cumple", "no_cumple", "no_cumple",
  // III. Gestión de la Salud (22-39)
  "cumple", "en_proceso", "cumple", "cumple", "cumple",
  "en_proceso", "no_cumple", "cumple", "cumple",
  "cumple", "en_proceso", "no_cumple",
  "no_cumple", "no_cumple", "no_cumple", "no_cumple", "no_cumple", "no_cumple",
  // IV. Gestión de Peligros y Riesgos (40-49)
  "cumple", "en_proceso", "en_proceso", "no_cumple",
  "en_proceso", "no_cumple", "no_cumple", "no_cumple", "cumple", "cumple",
  // V. Gestión de Amenazas (50-51)
  "no_cumple", "no_cumple",
  // VI. Verificación (52-55)
  "no_cumple", "no_cumple", "no_cumple", "no_cumple",
  // VII. Mejoramiento (56-59)
  "no_cumple", "no_cumple", "no_cumple", "no_cumple",
];

// Empresa 2: Constructora Andina SAS — ~68% (Moderadamente Aceptable)
// Construcción: fuerte en SST operativo, débil en gestión documental/estadísticas
const states2: Estado[] = [
  // I. Recursos (0-10) — todo cumple, empresa mediana
  "cumple", "cumple", "cumple", "cumple", "cumple", "cumple", "cumple", "cumple",
  "cumple", "en_proceso", "cumple",
  // II. Gestión Integral (11-21)
  "cumple", "cumple", "cumple", "cumple", "cumple",
  "cumple", "cumple", "cumple", "en_proceso", "en_proceso", "no_cumple",
  // III. Gestión de la Salud (22-39)
  "cumple", "cumple", "cumple", "cumple", "cumple",
  "cumple", "en_proceso", "cumple", "cumple",
  "cumple", "cumple", "cumple",
  "cumple", "cumple", "en_proceso", "en_proceso", "en_proceso", "en_proceso",
  // IV. Gestión de Peligros y Riesgos (40-49)
  "cumple", "cumple", "cumple", "en_proceso",
  "cumple", "en_proceso", "cumple", "cumple", "cumple", "cumple",
  // V. Gestión de Amenazas (50-51)
  "cumple", "en_proceso",
  // VI. Verificación (52-55)
  "cumple", "cumple", "en_proceso", "no_cumple",
  // VII. Mejoramiento (56-59)
  "cumple", "en_proceso", "no_cumple", "no_cumple",
];

// Empresa 3: Clínica Santa Lucía — ~95.5% (Aceptable)
// Clínica: excelente en salud y gestión, brecha solo en indicadores estadísticos y mejoramiento ARL
const states3: Estado[] = [
  // I. Recursos (0-10) — todo cumple
  "cumple", "cumple", "cumple", "cumple", "cumple", "cumple", "cumple", "cumple",
  "cumple", "cumple", "cumple",
  // II. Gestión Integral (11-21) — todo cumple
  "cumple", "cumple", "cumple", "cumple", "cumple",
  "cumple", "cumple", "cumple", "cumple", "cumple", "cumple",
  // III. Gestión de la Salud (22-39)
  "cumple", "cumple", "cumple", "cumple", "cumple",
  "cumple", "cumple", "cumple", "cumple",
  "cumple", "cumple", "cumple",
  "cumple", "cumple", "en_proceso", "en_proceso", "cumple", "cumple",
  // IV. Gestión de Peligros y Riesgos (40-49)
  "cumple", "cumple", "cumple", "cumple",
  "cumple", "cumple", "cumple", "cumple", "cumple", "cumple",
  // V. Gestión de Amenazas (50-51)
  "cumple", "cumple",
  // VI. Verificación (52-55)
  "cumple", "cumple", "cumple", "cumple",
  // VII. Mejoramiento (56-59)
  "cumple", "cumple", "cumple", "en_proceso",
];

export const DEMO_CRITERIOS_E1 = makeCriterios(DEMO_EMPRESA_ID, "c", states1);
export const DEMO_CRITERIOS_E2 = makeCriterios(EMPRESA2_ID, "d", states2);
export const DEMO_CRITERIOS_E3 = makeCriterios(EMPRESA3_ID, "e", states3);

export const DEMO_CRITERIOS = [
  ...DEMO_CRITERIOS_E1,
  ...DEMO_CRITERIOS_E2,
  ...DEMO_CRITERIOS_E3,
];

export const DEMO_COMITES = [
  // Empresa 1
  { id: "com001", empresa_id: DEMO_EMPRESA_ID, tipo: "COPASST", vigencia_inicio: "2025-01-15", vigencia_fin: "2027-01-14", activo: true, created_at: "2025-01-15T00:00:00Z" },
  { id: "com002", empresa_id: DEMO_EMPRESA_ID, tipo: "convivencia", vigencia_inicio: "2025-03-01", vigencia_fin: "2027-02-28", activo: true, created_at: "2025-03-01T00:00:00Z" },
  // Empresa 2
  { id: "com003", empresa_id: EMPRESA2_ID, tipo: "COPASST", vigencia_inicio: "2024-07-01", vigencia_fin: "2026-06-30", activo: true, created_at: "2024-07-01T00:00:00Z" },
  { id: "com004", empresa_id: EMPRESA2_ID, tipo: "convivencia", vigencia_inicio: "2024-08-15", vigencia_fin: "2026-08-14", activo: true, created_at: "2024-08-15T00:00:00Z" },
  // Empresa 3
  { id: "com005", empresa_id: EMPRESA3_ID, tipo: "COPASST", vigencia_inicio: "2025-03-01", vigencia_fin: "2027-02-28", activo: true, created_at: "2025-03-01T00:00:00Z" },
  { id: "com006", empresa_id: EMPRESA3_ID, tipo: "convivencia", vigencia_inicio: "2025-04-01", vigencia_fin: "2027-03-31", activo: true, created_at: "2025-04-01T00:00:00Z" },
];

export const DEMO_TRABAJADORES = [
  // Empresa 1
  { id: "t001", empresa_id: DEMO_EMPRESA_ID, nombres: "Juan Carlos", apellidos: "Pérez López", cedula: "12345678", cargo: "Gerente General", area: "Gerencia", email: "jperez@demo.com", activo: true, created_at: "2025-01-15T00:00:00Z" },
  { id: "t002", empresa_id: DEMO_EMPRESA_ID, nombres: "Ana María", apellidos: "Rodríguez Torres", cedula: "23456789", cargo: "Jefe RRHH", area: "Recursos Humanos", email: "arodriguez@demo.com", activo: true, created_at: "2025-01-15T00:00:00Z" },
  { id: "t003", empresa_id: DEMO_EMPRESA_ID, nombres: "Carlos", apellidos: "Morales Sánchez", cedula: "34567890", cargo: "Responsable SST", area: "SST", email: "cmorales@demo.com", activo: true, created_at: "2025-01-15T00:00:00Z" },
  // Empresa 2
  { id: "t004", empresa_id: EMPRESA2_ID, nombres: "Ricardo", apellidos: "Ospina Vélez", cedula: "45678901", cargo: "Director de Obra", area: "Operaciones", email: "rospina@andina.com", activo: true, created_at: "2024-06-01T00:00:00Z" },
  { id: "t005", empresa_id: EMPRESA2_ID, nombres: "Paola", apellidos: "Jiménez Ríos", cedula: "56789012", cargo: "Coordinadora SST", area: "SST", email: "pjimenez@andina.com", activo: true, created_at: "2024-06-01T00:00:00Z" },
  { id: "t006", empresa_id: EMPRESA2_ID, nombres: "Andrés", apellidos: "Cárdenas Muñoz", cedula: "67890123", cargo: "Maestro de Obra", area: "Construcción", email: "acardenas@andina.com", activo: true, created_at: "2024-06-01T00:00:00Z" },
  // Empresa 3
  { id: "t007", empresa_id: EMPRESA3_ID, nombres: "Claudia", apellidos: "Restrepo Salazar", cedula: "78901234", cargo: "Directora Médica", area: "Dirección", email: "crestrepo@santalucia.com", activo: true, created_at: "2024-03-01T00:00:00Z" },
  { id: "t008", empresa_id: EMPRESA3_ID, nombres: "Fernando", apellidos: "Valencia Cruz", cedula: "89012345", cargo: "Jefe de Enfermería", area: "Asistencial", email: "fvalencia@santalucia.com", activo: true, created_at: "2024-03-01T00:00:00Z" },
  { id: "t009", empresa_id: EMPRESA3_ID, nombres: "Marcela", apellidos: "Pinto Agudelo", cedula: "90123456", cargo: "Coordinadora SST", area: "SST", email: "mpinto@santalucia.com", activo: true, created_at: "2024-03-01T00:00:00Z" },
];

let mutableCriterios = DEMO_CRITERIOS.map(c => ({ ...c }));

export function getDemoCriterios() {
  return mutableCriterios;
}

export function updateDemoCriterio(criterioId: string, estado: string, observaciones?: string) {
  const idx = mutableCriterios.findIndex(c => c.id === criterioId);
  if (idx !== -1) {
    mutableCriterios[idx] = { ...mutableCriterios[idx], estado: estado as Estado, observaciones: observaciones ?? null };
    return mutableCriterios[idx];
  }
  return null;
}

let demoExamenes: Record<string, unknown>[] = [
  { id: "ex001", empresa_id: EMPRESA2_ID, trabajador_id: "t005", concepto: "apto", tipo: "Ingreso", fecha_examen: "2025-02-10", medico: "Dr. Hernán Zuluaga", restricciones: [], recomendaciones: ["Uso obligatorio de EPP en alturas"], created_at: "2025-02-10T09:00:00Z" },
  { id: "ex002", empresa_id: EMPRESA2_ID, trabajador_id: "t006", concepto: "apto_con_restricciones", tipo: "Periódico", fecha_examen: "2025-03-05", medico: "Dr. Hernán Zuluaga", restricciones: ["No trabajo en alturas mayores a 1.5m"], recomendaciones: ["Control médico en 6 meses"], created_at: "2025-03-05T10:30:00Z" },
  { id: "ex003", empresa_id: EMPRESA3_ID, trabajador_id: "t008", concepto: "apto", tipo: "Periódico", fecha_examen: "2025-04-01", medico: "Dra. Lucía Bermúdez", restricciones: [], recomendaciones: ["Mantenimiento de vacunación hepatitis B"], created_at: "2025-04-01T08:00:00Z" },
  { id: "ex004", empresa_id: EMPRESA3_ID, trabajador_id: "t009", concepto: "apto", tipo: "Ingreso", fecha_examen: "2025-01-15", medico: "Dra. Lucía Bermúdez", restricciones: [], recomendaciones: [], created_at: "2025-01-15T11:00:00Z" },
];
export function getDemoExamenes() { return demoExamenes; }
export function getDemoExamenById(id: string): Record<string, unknown> | undefined {
  return demoExamenes.find((e) => e.id === id);
}
export function addDemoExamen(examen: Record<string, unknown>) { demoExamenes = [examen, ...demoExamenes]; }

let demoMatrices: Record<string, unknown>[] = [
  {
    id: "mx001", empresa_id: EMPRESA2_ID, ciiu: "4111", version: 1, estado: "activa",
    riesgos: [
      { peligro: "Trabajo en alturas", fuente: "Andamios y escaleras", efecto: "Caída al vacío", probabilidad: "Alta", consecuencia: "Muy grave", nivel: "I - No aceptable", controles: "Arnés, línea de vida, permiso trabajo alturas" },
      { peligro: "Eléctrico", fuente: "Instalaciones provisionales de obra", efecto: "Electrocución", probabilidad: "Media", consecuencia: "Grave", nivel: "II - No aceptable o aceptable con control", controles: "GFCI, inspección de herramientas, capacitación" },
      { peligro: "Físico - Ruido", fuente: "Maquinaria pesada y herramientas", efecto: "Hipoacusia neurosensorial", probabilidad: "Alta", consecuencia: "Moderada", nivel: "II - No aceptable o aceptable con control", controles: "Protección auditiva, rotación de puestos" },
    ],
    created_at: "2025-01-20T00:00:00Z",
  },
  {
    id: "mx002", empresa_id: EMPRESA3_ID, ciiu: "8610", version: 1, estado: "activa",
    riesgos: [
      { peligro: "Biológico", fuente: "Pacientes con enfermedades infectocontagiosas", efecto: "Infección ocupacional", probabilidad: "Alta", consecuencia: "Grave", nivel: "II - No aceptable o aceptable con control", controles: "EPP completo, vacunación, protocolos de bioseguridad" },
      { peligro: "Psicosocial", fuente: "Carga laboral asistencial, contacto con muerte", efecto: "Síndrome de burnout, estrés", probabilidad: "Alta", consecuencia: "Moderada", nivel: "II - No aceptable o aceptable con control", controles: "Pausas activas, apoyo psicológico, rotación de turnos" },
      { peligro: "Ergonómico", fuente: "Movilización de pacientes", efecto: "Lesiones osteomusculares", probabilidad: "Alta", consecuencia: "Moderada", nivel: "II - No aceptable o aceptable con control", controles: "Capacitación en movilización, uso de camillas con freno" },
    ],
    created_at: "2025-02-10T00:00:00Z",
  },
];
export function getDemoMatrices() { return demoMatrices; }
export function getDemoMatrizById(id: string): Record<string, unknown> | undefined {
  return demoMatrices.find((m) => m.id === id);
}
export function addDemoMatriz(m: Record<string, unknown>) { demoMatrices = [m, ...demoMatrices]; }
export function updateDemoMatriz(id: string, fields: Record<string, unknown>) {
  const idx = demoMatrices.findIndex((m) => m.id === id);
  if (idx !== -1) demoMatrices[idx] = { ...demoMatrices[idx], ...fields };
}

let demoActas: Record<string, unknown>[] = [
  {
    id: "ac001", empresa_id: EMPRESA2_ID, tipo_comite: "COPASST", version: 1,
    fecha: "2025-04-15", fecha_reunion: "2025-04-15",
    lugar: "Sala de Reuniones Obra Norte", hora_inicio: "07:00", hora_fin: "08:30",
    numero_acta: "COPASST-2025-04",
    asistentes: [
      { nombre: "Paola Jiménez", cargo: "Presidente COPASST" },
      { nombre: "Andrés Cárdenas", cargo: "Representante Trabajadores" },
      { nombre: "Ricardo Ospina", cargo: "Representante Empleador" },
    ],
    puntos_orden: ["Revisión de accidentes e incidentes del mes", "Inspección de andamios pendiente", "Revisión entrega EPP"],
    texto_acta: "En las instalaciones de la obra, se reunió el COPASST con quórum reglamentario. Se revisó el accidente con incapacidad ocurrido el 10 de abril (caída de mismo nivel). Se acordó inspección de EPP para el 22 de abril y capacitación en trabajo seguro en alturas.",
    estado: "firmado",
    drive_url: null,
    created_at: "2025-04-15T08:30:00Z",
  },
  {
    id: "ac002", empresa_id: EMPRESA3_ID, tipo_comite: "COPASST", version: 1,
    fecha: "2025-04-08", fecha_reunion: "2025-04-08",
    lugar: "Sala de Juntas Clínica", hora_inicio: "08:00", hora_fin: "09:15",
    numero_acta: "COPASST-2025-04",
    asistentes: [
      { nombre: "Marcela Pinto", cargo: "Presidenta COPASST" },
      { nombre: "Fernando Valencia", cargo: "Representante Trabajadores" },
      { nombre: "Claudia Restrepo", cargo: "Representante Empleador" },
    ],
    puntos_orden: ["Seguimiento indicadores de accidentalidad", "Revisión programa de bioseguridad", "Cronograma vacunación hepatitis B"],
    texto_acta: "La clínica reporta cero accidentes de trabajo en el trimestre. Se aprobó el plan de vacunación contra hepatitis B para el personal nuevo. Se revisaron los indicadores de ausentismo con resultado satisfactorio.",
    estado: "firmado",
    drive_url: null,
    created_at: "2025-04-08T09:15:00Z",
  },
];
export function getDemoActas() { return demoActas; }
export function getDemoActaById(id: string): Record<string, unknown> | undefined {
  return demoActas.find((a) => a.id === id);
}
export function addDemoActa(a: Record<string, unknown>) { demoActas = [a, ...demoActas]; }
export function updateDemoActa(id: string, fields: Record<string, unknown>) {
  const idx = demoActas.findIndex((a) => a.id === id);
  if (idx !== -1) demoActas[idx] = { ...demoActas[idx], ...fields };
}
