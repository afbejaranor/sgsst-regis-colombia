export const DRIVE_ROOT = "https://drive.google.com/drive/u/0/folders/1-SdLdLriDUl3TFiTSJHllBsfjC1jk9Lf";

interface EmpresaDriveFolders {
  raiz: string;
  pila: string;
  examenes: string;
  matrices: string;
  actas_copasst: string;
  actas_convivencia: string;
  plan_prevencion: string;
  politicas: string;
}

const defaultFolders = (name: string): EmpresaDriveFolders => ({
  raiz: `${DRIVE_ROOT}`,
  pila: `${DRIVE_ROOT}`,
  examenes: `${DRIVE_ROOT}`,
  matrices: `${DRIVE_ROOT}`,
  actas_copasst: `${DRIVE_ROOT}`,
  actas_convivencia: `${DRIVE_ROOT}`,
  plan_prevencion: `${DRIVE_ROOT}`,
  politicas: `${DRIVE_ROOT}`,
});

export const DRIVE_FOLDERS: Record<string, EmpresaDriveFolders> = {
  "a1b2c3d4-e5f6-7890-abcd-ef1234567890": defaultFolders("Comercializadora_Demo_SAS"),
  "b2c3d4e5-f6a7-8901-bcde-f12345678901": defaultFolders("Constructora_Andina_SAS"),
  "c3d4e5f6-a7b8-9012-cdef-123456789012": defaultFolders("Clinica_Santa_Lucia_Ltda"),
};

export interface DriveDoc {
  nombre: string;
  fecha: string;
  tipo: string;
  tamano: string;
}

export const DRIVE_DOCS: Record<string, Record<string, DriveDoc[]>> = {
  "a1b2c3d4-e5f6-7890-abcd-ef1234567890": {
    examenes: [
      { nombre: "ExMed_Ingreso_JuanGarcia_2024-08.pdf", fecha: "2024-08-15", tipo: "Ingreso", tamano: "248 KB" },
      { nombre: "ExMed_Periodico_MariaLopez_2024-11.pdf", fecha: "2024-11-20", tipo: "Periódico", tamano: "315 KB" },
      { nombre: "ExMed_Periodico_PedroMartinez_2025-01.pdf", fecha: "2025-01-10", tipo: "Periódico", tamano: "289 KB" },
    ],
    pila: [
      { nombre: "PILA_ComercializadoraDemo_2025-01.pdf", fecha: "2025-02-05", tipo: "PILA", tamano: "182 KB" },
      { nombre: "PILA_ComercializadoraDemo_2025-02.pdf", fecha: "2025-03-05", tipo: "PILA", tamano: "178 KB" },
      { nombre: "PILA_ComercializadoraDemo_2025-03.pdf", fecha: "2025-04-07", tipo: "PILA", tamano: "191 KB" },
    ],
    matrices: [
      { nombre: "MatrizRiesgos_GTC45_CIIU4711_v1.xlsx", fecha: "2024-09-01", tipo: "Matriz", tamano: "124 KB" },
    ],
    actas: [
      { nombre: "Acta_COPASST_2025-01.pdf", fecha: "2025-01-20", tipo: "Acta", tamano: "98 KB" },
      { nombre: "Acta_COPASST_2025-02.pdf", fecha: "2025-02-18", tipo: "Acta", tamano: "102 KB" },
    ],
  },
  "b2c3d4e5-f6a7-8901-bcde-f12345678901": {
    examenes: [
      { nombre: "ExMed_Ingreso_CarlosRuiz_2024-09.pdf", fecha: "2024-09-03", tipo: "Ingreso", tamano: "302 KB" },
      { nombre: "ExMed_Ingreso_AndreinaVargas_2024-10.pdf", fecha: "2024-10-15", tipo: "Ingreso", tamano: "278 KB" },
      { nombre: "ExMed_Periodico_Lote_Altura_2025-02.pdf", fecha: "2025-02-20", tipo: "Periódico", tamano: "542 KB" },
      { nombre: "ExMed_Egreso_FernandoSosa_2025-03.pdf", fecha: "2025-03-10", tipo: "Egreso", tamano: "265 KB" },
    ],
    pila: [
      { nombre: "PILA_ConstructoraAndina_2025-01.pdf", fecha: "2025-02-07", tipo: "PILA", tamano: "234 KB" },
      { nombre: "PILA_ConstructoraAndina_2025-02.pdf", fecha: "2025-03-06", tipo: "PILA", tamano: "229 KB" },
      { nombre: "PILA_ConstructoraAndina_2025-03.pdf", fecha: "2025-04-05", tipo: "PILA", tamano: "241 KB" },
      { nombre: "PILA_ConstructoraAndina_2025-04.pdf", fecha: "2025-05-05", tipo: "PILA", tamano: "238 KB" },
    ],
    matrices: [
      { nombre: "MatrizRiesgos_GTC45_CIIU4111_v1.xlsx", fecha: "2024-07-15", tipo: "Matriz", tamano: "178 KB" },
      { nombre: "MatrizRiesgos_GTC45_CIIU4111_v2.xlsx", fecha: "2025-01-10", tipo: "Matriz", tamano: "195 KB" },
    ],
    actas: [
      { nombre: "Acta_COPASST_2025-01.pdf", fecha: "2025-01-22", tipo: "Acta", tamano: "110 KB" },
      { nombre: "Acta_COPASST_2025-02.pdf", fecha: "2025-02-25", tipo: "Acta", tamano: "108 KB" },
      { nombre: "Acta_Convivencia_2025-01.pdf", fecha: "2025-01-30", tipo: "Acta", tamano: "95 KB" },
    ],
  },
  "c3d4e5f6-a7b8-9012-cdef-123456789012": {
    examenes: [
      { nombre: "ExMed_Periodico_PersonalClinico_2024-10.pdf", fecha: "2024-10-05", tipo: "Periódico", tamano: "1.2 MB" },
      { nombre: "ExMed_Ingreso_NuevaEnfermera_2024-12.pdf", fecha: "2024-12-18", tipo: "Ingreso", tamano: "310 KB" },
      { nombre: "ExMed_Periodico_Administrativos_2025-03.pdf", fecha: "2025-03-22", tipo: "Periódico", tamano: "876 KB" },
      { nombre: "ExMed_PostIncap_LuisaRodriguez_2025-04.pdf", fecha: "2025-04-08", tipo: "Post-incapacidad", tamano: "290 KB" },
    ],
    pila: [
      { nombre: "PILA_ClinicaSantaLucia_2025-01.pdf", fecha: "2025-02-05", tipo: "PILA", tamano: "312 KB" },
      { nombre: "PILA_ClinicaSantaLucia_2025-02.pdf", fecha: "2025-03-05", tipo: "PILA", tamano: "308 KB" },
      { nombre: "PILA_ClinicaSantaLucia_2025-03.pdf", fecha: "2025-04-07", tipo: "PILA", tamano: "319 KB" },
      { nombre: "PILA_ClinicaSantaLucia_2025-04.pdf", fecha: "2025-05-06", tipo: "PILA", tamano: "322 KB" },
    ],
    matrices: [
      { nombre: "MatrizRiesgos_GTC45_CIIU8610_v1.xlsx", fecha: "2024-05-10", tipo: "Matriz", tamano: "210 KB" },
      { nombre: "MatrizRiesgos_GTC45_CIIU8610_v2.xlsx", fecha: "2025-02-15", tipo: "Matriz", tamano: "225 KB" },
    ],
    actas: [
      { nombre: "Acta_COPASST_2025-01.pdf", fecha: "2025-01-15", tipo: "Acta", tamano: "105 KB" },
      { nombre: "Acta_COPASST_2025-02.pdf", fecha: "2025-02-19", tipo: "Acta", tamano: "112 KB" },
      { nombre: "Acta_COPASST_2025-03.pdf", fecha: "2025-03-18", tipo: "Acta", tamano: "98 KB" },
      { nombre: "Acta_Convivencia_2025-01.pdf", fecha: "2025-01-28", tipo: "Acta", tamano: "90 KB" },
    ],
  },
};
