import {
  AlignmentType,
  Document,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from "pdf-lib";

export interface ExamenData {
  id?: string;
  empresa_id?: string;
  nombre_trabajador?: string | null;
  cedula_trabajador?: string | null;
  cargo?: string | null;
  concepto?: string | null;
  tipo?: string | null;
  fecha_examen?: string | null;
  medico?: string | null;
  restricciones?: unknown[] | null;
  recomendaciones?: unknown[] | null;
  [key: string]: unknown;
}

export interface EmpresaData {
  id?: string;
  nombre: string;
  nit: string;
  codigo_ciiu?: string | null;
  ciudad?: string | null;
}

const CONCEPTO_LABELS: Record<string, string> = {
  apto: "APTO",
  apto_con_restricciones: "APTO CON RESTRICCIONES",
  no_apto: "NO APTO",
  pendiente: "PENDIENTE",
};

const CONCEPTO_COLORS_DOCX: Record<string, string> = {
  apto: "00AA44",
  apto_con_restricciones: "CC8800",
  no_apto: "CC2200",
  pendiente: "888888",
};

const CONCEPTO_COLORS_PDF: Record<string, [number, number, number]> = {
  apto: [0, 0.67, 0.27],
  apto_con_restricciones: [0.8, 0.53, 0],
  no_apto: [0.8, 0.13, 0],
  pendiente: [0.53, 0.53, 0.53],
};

function toStringList(arr: unknown[]): string[] {
  return arr.map((item) => {
    if (typeof item === "string") return item;
    if (typeof item === "object" && item !== null) {
      const obj = item as Record<string, unknown>;
      return (obj.descripcion as string) ?? JSON.stringify(item);
    }
    return String(item);
  });
}

function dataRow(label: string, value: string): TableRow {
  return new TableRow({
    children: [
      new TableCell({
        width: { size: 35, type: WidthType.PERCENTAGE },
        shading: { fill: "EEF4EE", type: ShadingType.CLEAR, color: "auto" },
        children: [
          new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 20, color: "444444" })] }),
        ],
      }),
      new TableCell({
        width: { size: 65, type: WidthType.PERCENTAGE },
        children: [new Paragraph({ children: [new TextRun({ text: value, size: 20 })] })],
      }),
    ],
  });
}

export async function generateExamenDocx(examen: ExamenData, empresa: EmpresaData): Promise<Buffer> {
  const concepto = examen.concepto ?? "pendiente";
  const conceptoLabel = CONCEPTO_LABELS[concepto] ?? "PENDIENTE";
  const conceptoColor = CONCEPTO_COLORS_DOCX[concepto] ?? "888888";
  const restricciones = toStringList((examen.restricciones as unknown[]) ?? []);
  const recomendaciones = toStringList((examen.recomendaciones as unknown[]) ?? []);
  const fechaStr = examen.fecha_examen
    ? new Date(examen.fecha_examen).toLocaleDateString("es-CO")
    : "No disponible";
  const genDate = new Date().toLocaleDateString("es-CO");

  const sectionHeader = (text: string) =>
    new Paragraph({
      children: [new TextRun({ text, bold: true, size: 24, color: "006B35" })],
      spacing: { before: 280, after: 100 },
    });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: "INFORME DE SEGUIMIENTO DEL TRABAJADOR", bold: true, size: 28, color: "006B35" }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Resolución 2346 de 2007 · Gestión de Exámenes Médicos Ocupacionales",
                size: 18,
                color: "888888",
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),

          sectionHeader("DATOS DE LA EMPRESA"),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              dataRow("Empresa", empresa.nombre),
              dataRow("NIT", empresa.nit),
              dataRow("Ciudad", empresa.ciudad ?? "—"),
              dataRow("Código CIIU", empresa.codigo_ciiu ?? "—"),
            ],
          }),

          sectionHeader("DATOS DEL TRABAJADOR"),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              dataRow("Nombre completo", examen.nombre_trabajador ?? "No especificado"),
              dataRow("Cédula de ciudadanía", examen.cedula_trabajador ?? "No especificado"),
              dataRow("Cargo", examen.cargo ?? "No especificado"),
            ],
          }),

          sectionHeader("DATOS DEL EXAMEN"),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              dataRow("Tipo de examen", (examen.tipo ?? "Periódico").replace(/_/g, " ")),
              dataRow("Fecha del examen", fechaStr),
              dataRow("Médico responsable", examen.medico ?? "No especificado"),
            ],
          }),

          sectionHeader("CONCEPTO MÉDICO LABORAL"),
          new Table({
            width: { size: 55, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    shading: { fill: conceptoColor, type: ShadingType.CLEAR, color: "auto" },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: conceptoLabel, bold: true, size: 24, color: "FFFFFF" })],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          ...(restricciones.length > 0
            ? [
                sectionHeader("RESTRICCIONES"),
                ...restricciones.map(
                  (r) =>
                    new Paragraph({
                      children: [new TextRun({ text: `• ${r}`, size: 20 })],
                      spacing: { after: 80 },
                    }),
                ),
              ]
            : []),

          ...(recomendaciones.length > 0
            ? [
                sectionHeader("RECOMENDACIONES DE SALUD OCUPACIONAL"),
                ...recomendaciones.map(
                  (r) =>
                    new Paragraph({
                      children: [new TextRun({ text: `• ${r}`, size: 20 })],
                      spacing: { after: 80 },
                    }),
                ),
              ]
            : []),

          new Paragraph({ spacing: { before: 500 }, children: [] }),
          new Paragraph({
            children: [
              new TextRun({ text: `Generado por SG-SST Regis Colombia  ·  ${genDate}`, size: 16, color: "999999" }),
            ],
            alignment: AlignmentType.CENTER,
          }),
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}

// ────────────── Interfaces adicionales ──────────────

export interface MatrizData {
  id?: string;
  empresa_id?: string;
  ciiu?: string | null;
  codigo_ciiu?: string | null;
  version?: number;
  estado?: string | null;
  contenido_json?: unknown;
  riesgos?: unknown[];
  [key: string]: unknown;
}

export interface ActaData {
  id?: string;
  empresa_id?: string;
  numero_acta?: string | null;
  tipo_comite?: string | null;
  fecha?: string | null;
  fecha_reunion?: string | null;
  lugar?: string | null;
  hora_inicio?: string | null;
  hora_fin?: string | null;
  asistentes?: unknown[];
  asistentes_confirmados?: unknown[];
  puntos_orden?: unknown[];
  puntos_tratados?: unknown[];
  texto_acta?: string | null;
  acta_generada?: string | null;
  [key: string]: unknown;
}

const NIVEL_LABELS: Record<string, string> = {
  nivel_I: "Nivel I - No aceptable",
  nivel_II: "Nivel II - No aceptable / controlado",
  nivel_III: "Nivel III - Aceptable",
  nivel_IV: "Nivel IV - Aceptable",
};

// ────────────── Matriz GTC-45 DOCX ──────────────

export async function generateMatrizDocx(matriz: MatrizData, empresa: EmpresaData): Promise<Buffer> {
  const contenido = (matriz.contenido_json ?? {}) as Record<string, unknown>;
  const ciiu = (matriz.ciiu ?? matriz.codigo_ciiu ?? contenido.ciiu ?? "—") as string;
  const actividad = (contenido.actividad_economica ?? "—") as string;
  const version = matriz.version ?? 1;
  const genDate = new Date().toLocaleDateString("es-CO");
  const peligrosPrioritarios = (contenido.peligros_prioritarios as string[]) ?? [];
  const resumen = (contenido.resumen_por_nivel as Record<string, number>) ?? {};
  const procesos = (contenido.procesos as unknown[]) ?? (matriz.riesgos as unknown[]) ?? [];
  const recsGenerales = (contenido.recomendaciones_generales as string[]) ?? [];

  const sectionHeader = (text: string) =>
    new Paragraph({
      children: [new TextRun({ text, bold: true, size: 24, color: "006B35" })],
      spacing: { before: 280, after: 100 },
    });

  const riesgoRows = procesos.slice(0, 30).map((p) => {
    const proc = p as Record<string, unknown>;
    const peligroObj = (proc.peligro ?? {}) as Record<string, unknown>;
    const evalObj = (proc.evaluacion_sin_controles ?? {}) as Record<string, unknown>;
    const peligroStr = typeof proc.peligro === "string" ? proc.peligro : (peligroObj.descripcion as string) ?? "—";
    const procesoStr = (proc.proceso as string) ?? (proc.fuente as string) ?? "—";
    const efectoStr = Array.isArray(proc.efectos_posibles) ? (proc.efectos_posibles as string[])[0] ?? "—" : (proc.efecto as string) ?? "—";
    const nivelStr = (evalObj.nivel_nr as string) ?? (proc.nivel as string) ?? "—";
    return new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: procesoStr, size: 18 })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: peligroStr, size: 18 })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: efectoStr, size: 18 })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: nivelStr, bold: true, size: 18 })] })] }),
      ],
    });
  });

  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          children: [new TextRun({ text: "MATRIZ DE IDENTIFICACIÓN DE PELIGROS Y VALORACIÓN DE RIESGOS", bold: true, size: 26, color: "006B35" })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [new TextRun({ text: "Metodología GTC-45 (2012)  ·  Resolución 0312 de 2019", size: 18, color: "888888" })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        }),

        sectionHeader("INFORMACIÓN GENERAL"),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            dataRow("Empresa", empresa.nombre),
            dataRow("NIT", empresa.nit),
            dataRow("Código CIIU", ciiu),
            dataRow("Actividad económica", actividad),
            dataRow("Versión del documento", `v${version}`),
            dataRow("Fecha de generación", genDate),
          ],
        }),

        ...(Object.keys(resumen).length > 0 ? [
          sectionHeader("RESUMEN POR NIVEL DE RIESGO"),
          new Table({
            width: { size: 70, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: Object.keys(resumen).map((nivel) =>
                  new TableCell({
                    shading: {
                      fill: nivel === "nivel_I" ? "CC2200" : nivel === "nivel_II" ? "E07820" : nivel === "nivel_III" ? "CCAA00" : "00AA44",
                      type: ShadingType.CLEAR, color: "auto",
                    },
                    children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(resumen[nivel]), bold: true, size: 28, color: "FFFFFF" })] })],
                  })
                ),
              }),
              new TableRow({
                children: Object.keys(resumen).map((nivel) =>
                  new TableCell({
                    children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: NIVEL_LABELS[nivel] ?? nivel, size: 16 })] })],
                  })
                ),
              }),
            ],
          }),
        ] : []),

        ...(peligrosPrioritarios.length > 0 ? [
          sectionHeader("PELIGROS PRIORITARIOS"),
          ...peligrosPrioritarios.map((p) => new Paragraph({ children: [new TextRun({ text: `• ${p}`, size: 20 })], spacing: { after: 80 } })),
        ] : []),

        ...(riesgoRows.length > 0 ? [
          sectionHeader("IDENTIFICACIÓN Y VALORACIÓN DE PELIGROS"),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                tableHeader: true,
                children: ["Proceso", "Peligro", "Efectos posibles", "Nivel de riesgo"].map((h) =>
                  new TableCell({
                    shading: { fill: "006B35", type: ShadingType.CLEAR, color: "auto" },
                    children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, color: "FFFFFF", size: 18 })] })],
                  })
                ),
              }),
              ...riesgoRows,
            ],
          }),
        ] : []),

        ...(recsGenerales.length > 0 ? [
          sectionHeader("RECOMENDACIONES GENERALES"),
          ...recsGenerales.map((r) => new Paragraph({ children: [new TextRun({ text: `• ${r}`, size: 20 })], spacing: { after: 80 } })),
        ] : []),

        new Paragraph({ spacing: { before: 400 }, children: [] }),
        new Paragraph({
          children: [new TextRun({ text: `Generado por SG-SST Regis Colombia  ·  ${genDate}`, size: 16, color: "999999" })],
          alignment: AlignmentType.CENTER,
        }),
      ],
    }],
  });
  return Packer.toBuffer(doc);
}

// ────────────── Matriz GTC-45 PDF ──────────────

export async function generateMatrizPdf(matriz: MatrizData, empresa: EmpresaData): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const W = 595, H = 842, M = 50;
  const CW = W - 2 * M;
  const LH = 15, GAP = 8;

  let page: PDFPage = pdfDoc.addPage([W, H]);
  let y = H - M;

  function ensureSpace(n: number) { if (y - n < M + 30) { page = pdfDoc.addPage([W, H]); y = H - M; } }
  function drawWrapped(text: string, x: number, maxW: number, size: number, font: PDFFont) {
    for (const line of wrapTextLocal(text, font, size, maxW)) {
      ensureSpace(LH);
      page.drawText(line, { x, y, size, font });
      y -= LH;
    }
  }
  function wrapTextLocal(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
    const words = text.split(" ");
    const lines: string[] = [];
    let line = "";
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, fontSize) > maxWidth && line) { lines.push(line); line = word; }
      else line = candidate;
    }
    if (line) lines.push(line);
    return lines.length ? lines : [""];
  }
  function drawSH(text: string) {
    y -= GAP;
    ensureSpace(LH + 8);
    page.drawRectangle({ x: M, y: y - 4, width: CW, height: LH + 7, color: rgb(0.9, 0.97, 0.93) });
    page.drawLine({ start: { x: M, y: y - 4 }, end: { x: M, y: y + LH + 3 }, thickness: 3, color: rgb(0, 0.42, 0.21) });
    page.drawText(text, { x: M + 8, y, size: 11, font: boldFont, color: rgb(0, 0.42, 0.21) });
    y -= LH + 10;
  }
  function drawDR(label: string, value: string) {
    ensureSpace(LH + 2);
    page.drawText(`${label}:`, { x: M + 4, y, size: 10, font: boldFont, color: rgb(0.35, 0.35, 0.35) });
    const lw = boldFont.widthOfTextAtSize(`${label}: `, 10);
    drawWrapped(value, M + 4 + lw, CW - lw - 8, 10, regularFont);
  }

  const contenido = (matriz.contenido_json ?? {}) as Record<string, unknown>;
  const ciiu = (matriz.ciiu ?? matriz.codigo_ciiu ?? contenido.ciiu ?? "—") as string;
  const actividad = (contenido.actividad_economica ?? "—") as string;
  const version = matriz.version ?? 1;
  const genDate = new Date().toLocaleDateString("es-CO");
  const peligrosPrioritarios = (contenido.peligros_prioritarios as string[]) ?? [];
  const resumen = (contenido.resumen_por_nivel as Record<string, number>) ?? {};
  const procesos = (contenido.procesos as unknown[]) ?? (matriz.riesgos as unknown[]) ?? [];

  const title = "MATRIZ DE PELIGROS Y VALORACIÓN DE RIESGOS GTC-45";
  const titleW = boldFont.widthOfTextAtSize(title, 13);
  page.drawText(title, { x: (W - titleW) / 2, y, size: 13, font: boldFont, color: rgb(0, 0.42, 0.21) });
  y -= 20;
  const sub = "Metodología GTC-45 (2012)  ·  Resolución 0312 de 2019";
  const subW = regularFont.widthOfTextAtSize(sub, 9);
  page.drawText(sub, { x: (W - subW) / 2, y, size: 9, font: regularFont, color: rgb(0.55, 0.55, 0.55) });
  y -= 14;
  page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 1.5, color: rgb(0, 0.42, 0.21) });
  y -= 18;

  drawSH("INFORMACIÓN GENERAL");
  drawDR("Empresa", empresa.nombre);
  drawDR("NIT", empresa.nit);
  drawDR("Código CIIU", ciiu);
  drawDR("Actividad económica", actividad);
  drawDR("Versión", `v${version}`);
  drawDR("Fecha de generación", genDate);
  y -= GAP;

  if (Object.keys(resumen).length > 0) {
    drawSH("RESUMEN POR NIVEL DE RIESGO");
    const nivelColors: Record<string, [number, number, number]> = {
      nivel_I: [0.8, 0.13, 0], nivel_II: [0.88, 0.47, 0.13],
      nivel_III: [0.8, 0.67, 0], nivel_IV: [0, 0.67, 0.27],
    };
    const boxW = CW / Math.max(Object.keys(resumen).length, 1);
    let bx = M;
    for (const [nivel, count] of Object.entries(resumen)) {
      const [cr, cg, cb] = nivelColors[nivel] ?? [0.5, 0.5, 0.5];
      ensureSpace(44);
      page.drawRectangle({ x: bx, y: y - 24, width: boxW - 2, height: 30, color: rgb(cr, cg, cb) });
      const cStr = String(count);
      const cW = boldFont.widthOfTextAtSize(cStr, 14);
      page.drawText(cStr, { x: bx + (boxW - 2 - cW) / 2, y: y - 8, size: 14, font: boldFont, color: rgb(1, 1, 1) });
      bx += boxW;
    }
    y -= 30;
    bx = M;
    for (const nivel of Object.keys(resumen)) {
      const label = NIVEL_LABELS[nivel] ?? nivel;
      drawWrapped(label, bx + 2, boxW - 6, 8, regularFont);
      bx += boxW;
    }
    y -= GAP;
  }

  if (peligrosPrioritarios.length > 0) {
    drawSH("PELIGROS PRIORITARIOS");
    for (const p of peligrosPrioritarios) drawWrapped(`• ${p}`, M + 8, CW - 14, 10, regularFont);
    y -= GAP;
  }

  if (procesos.length > 0) {
    drawSH("IDENTIFICACIÓN Y VALORACIÓN DE PELIGROS");
    const colW = [110, 130, 140, 95];
    const headers = ["Proceso", "Peligro", "Efectos posibles", "Nivel riesgo"];
    ensureSpace(LH + 4);
    let hx = M;
    page.drawRectangle({ x: M, y: y - 4, width: CW, height: LH + 6, color: rgb(0, 0.42, 0.21) });
    for (let i = 0; i < headers.length; i++) {
      page.drawText(headers[i], { x: hx + 3, y, size: 9, font: boldFont, color: rgb(1, 1, 1) });
      hx += colW[i];
    }
    y -= LH + 8;
    for (const p of procesos.slice(0, 25)) {
      const proc = p as Record<string, unknown>;
      const peligroObj = (proc.peligro ?? {}) as Record<string, unknown>;
      const evalObj = (proc.evaluacion_sin_controles ?? {}) as Record<string, unknown>;
      const cells = [
        (proc.proceso as string) ?? (proc.fuente as string) ?? "—",
        typeof proc.peligro === "string" ? proc.peligro : (peligroObj.descripcion as string) ?? "—",
        Array.isArray(proc.efectos_posibles) ? (proc.efectos_posibles as string[])[0] ?? "—" : (proc.efecto as string) ?? "—",
        (evalObj.nivel_nr as string) ?? (proc.nivel as string) ?? "—",
      ];
      const rowH = Math.max(...cells.map((c, i) => wrapTextLocal(c, regularFont, 9, colW[i] - 6).length)) * LH + 4;
      ensureSpace(rowH + 2);
      page.drawLine({ start: { x: M, y: y - rowH }, end: { x: W - M, y: y - rowH }, thickness: 0.3, color: rgb(0.8, 0.8, 0.8) });
      let cx = M;
      for (let i = 0; i < cells.length; i++) {
        const lines = wrapTextLocal(cells[i], regularFont, 9, colW[i] - 6);
        let ly = y - 2;
        for (const line of lines) { page.drawText(line, { x: cx + 3, y: ly, size: 9, font: regularFont }); ly -= LH; }
        cx += colW[i];
      }
      y -= rowH + 2;
    }
    y -= GAP;
  }

  y -= 20;
  page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) });
  y -= 14;
  const footer = `Generado por SG-SST Regis Colombia  ·  ${genDate}`;
  const footerW = regularFont.widthOfTextAtSize(footer, 8);
  page.drawText(footer, { x: (W - footerW) / 2, y, size: 8, font: regularFont, color: rgb(0.6, 0.6, 0.6) });
  return Buffer.from(await pdfDoc.save());
}

// ────────────── Acta COPASST DOCX ──────────────

export async function generateActaDocx(acta: ActaData, empresa: EmpresaData): Promise<Buffer> {
  const tipoComite = (acta.tipo_comite ?? "COPASST").toUpperCase();
  const numeroActa = (acta.numero_acta ?? `${tipoComite}-${acta.fecha ?? acta.fecha_reunion ?? ""}`.substring(0, 20)) as string;
  const fecha = acta.fecha ?? acta.fecha_reunion ?? "—";
  const lugar = acta.lugar ?? "—";
  const horaInicio = acta.hora_inicio ?? "—";
  const horaFin = acta.hora_fin ?? "—";
  const asistentes = (acta.asistentes ?? acta.asistentes_confirmados ?? []) as Record<string, string>[];
  const puntos = (acta.puntos_orden ?? acta.puntos_tratados ?? []) as string[];
  const textoActa = (acta.acta_generada ?? acta.texto_acta ?? "No disponible") as string;
  const genDate = new Date().toLocaleDateString("es-CO");

  const sectionHeader = (text: string) =>
    new Paragraph({
      children: [new TextRun({ text, bold: true, size: 24, color: "006B35" })],
      spacing: { before: 280, after: 100 },
    });

  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          children: [new TextRun({ text: `ACTA DE REUNIÓN - ${tipoComite}`, bold: true, size: 28, color: "006B35" })],
          alignment: AlignmentType.CENTER, spacing: { after: 100 },
        }),
        new Paragraph({
          children: [new TextRun({ text: `${empresa.nombre}  ·  NIT ${empresa.nit}`, size: 20, color: "555555" })],
          alignment: AlignmentType.CENTER, spacing: { after: 400 },
        }),

        sectionHeader("DATOS DE LA REUNIÓN"),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            dataRow("Número de acta", numeroActa),
            dataRow("Tipo de comité", tipoComite),
            dataRow("Fecha", fecha),
            dataRow("Hora inicio / fin", `${horaInicio} - ${horaFin}`),
            dataRow("Lugar", lugar),
          ],
        }),

        ...(asistentes.length > 0 ? [
          sectionHeader("ASISTENTES"),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                tableHeader: true,
                children: ["Nombre", "Cargo"].map((h) =>
                  new TableCell({
                    shading: { fill: "006B35", type: ShadingType.CLEAR, color: "auto" },
                    children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, color: "FFFFFF", size: 20 })] })],
                  })
                ),
              }),
              ...asistentes.map((a) =>
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: a.nombre ?? "—", size: 20 })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: a.cargo ?? a.cargo_empresa ?? "—", size: 20 })] })] }),
                  ],
                })
              ),
            ],
          }),
        ] : []),

        ...(puntos.length > 0 ? [
          sectionHeader("ORDEN DEL DÍA"),
          ...puntos.map((p, i) =>
            new Paragraph({
              children: [new TextRun({ text: `${i + 1}. ${typeof p === "string" ? p : JSON.stringify(p)}`, size: 20 })],
              spacing: { after: 80 },
            })
          ),
        ] : []),

        sectionHeader("DESARROLLO DEL ACTA"),
        ...textoActa.split("\n").map((line) =>
          new Paragraph({ children: [new TextRun({ text: line, size: 20 })], spacing: { after: 60 } })
        ),

        sectionHeader("FIRMAS"),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: ["Presidente del Comité", "Secretario(a)"].map((cargo) =>
                new TableCell({
                  children: [
                    new Paragraph({ spacing: { before: 480 }, children: [new TextRun({ text: "________________________________", size: 20 })] }),
                    new Paragraph({ children: [new TextRun({ text: cargo, bold: true, size: 20 })] }),
                    new Paragraph({ children: [new TextRun({ text: "Nombre y firma", size: 18, color: "888888" })] }),
                  ],
                })
              ),
            }),
          ],
        }),

        new Paragraph({ spacing: { before: 500 }, children: [] }),
        new Paragraph({
          children: [new TextRun({ text: `Generado por SG-SST Regis Colombia  ·  ${genDate}`, size: 16, color: "999999" })],
          alignment: AlignmentType.CENTER,
        }),
      ],
    }],
  });
  return Packer.toBuffer(doc);
}

// ────────────── Acta COPASST PDF ──────────────

export async function generateActaPdf(acta: ActaData, empresa: EmpresaData): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const W = 595, H = 842, M = 50;
  const CW = W - 2 * M;
  const LH = 15, GAP = 8;

  let page: PDFPage = pdfDoc.addPage([W, H]);
  let y = H - M;

  function ensureSpace(n: number) { if (y - n < M + 30) { page = pdfDoc.addPage([W, H]); y = H - M; } }
  function wrapLocal(text: string, font: PDFFont, size: number, maxW: number): string[] {
    const words = text.split(" ");
    const lines: string[] = [];
    let line = "";
    for (const word of words) {
      const c = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(c, size) > maxW && line) { lines.push(line); line = word; }
      else line = c;
    }
    if (line) lines.push(line);
    return lines.length ? lines : [""];
  }
  function dw(text: string, x: number, maxW: number, size: number, font: PDFFont) {
    for (const line of wrapLocal(text, font, size, maxW)) { ensureSpace(LH); page.drawText(line, { x, y, size, font }); y -= LH; }
  }
  function drawSH(text: string) {
    y -= GAP;
    ensureSpace(LH + 8);
    page.drawRectangle({ x: M, y: y - 4, width: CW, height: LH + 7, color: rgb(0.9, 0.97, 0.93) });
    page.drawLine({ start: { x: M, y: y - 4 }, end: { x: M, y: y + LH + 3 }, thickness: 3, color: rgb(0, 0.42, 0.21) });
    page.drawText(text, { x: M + 8, y, size: 11, font: boldFont, color: rgb(0, 0.42, 0.21) });
    y -= LH + 10;
  }

  const tipoComite = (acta.tipo_comite ?? "COPASST").toUpperCase();
  const numeroActa = acta.numero_acta ?? `${tipoComite}-${acta.fecha ?? ""}`;
  const fecha = acta.fecha ?? acta.fecha_reunion ?? "—";
  const lugar = acta.lugar ?? "—";
  const asistentes = (acta.asistentes ?? acta.asistentes_confirmados ?? []) as Record<string, string>[];
  const puntos = (acta.puntos_orden ?? acta.puntos_tratados ?? []) as string[];
  const textoActa = (acta.acta_generada ?? acta.texto_acta ?? "No disponible") as string;
  const genDate = new Date().toLocaleDateString("es-CO");

  const titleStr = `ACTA DE REUNIÓN - ${tipoComite}`;
  const titleW = boldFont.widthOfTextAtSize(titleStr, 14);
  page.drawText(titleStr, { x: (W - titleW) / 2, y, size: 14, font: boldFont, color: rgb(0, 0.42, 0.21) });
  y -= 20;
  const compStr = `${empresa.nombre}  ·  NIT ${empresa.nit}`;
  const compW = regularFont.widthOfTextAtSize(compStr, 10);
  page.drawText(compStr, { x: (W - compW) / 2, y, size: 10, font: regularFont, color: rgb(0.4, 0.4, 0.4) });
  y -= 14;
  page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 1.5, color: rgb(0, 0.42, 0.21) });
  y -= 18;

  drawSH("DATOS DE LA REUNIÓN");
  const meetingData = [
    ["Número de acta", String(numeroActa)],
    ["Tipo de comité", tipoComite],
    ["Fecha", fecha],
    ["Hora inicio / fin", `${acta.hora_inicio ?? "—"} - ${acta.hora_fin ?? "—"}`],
    ["Lugar", lugar],
  ];
  for (const [label, value] of meetingData) {
    ensureSpace(LH + 2);
    page.drawText(`${label}:`, { x: M + 4, y, size: 10, font: boldFont, color: rgb(0.35, 0.35, 0.35) });
    const lw = boldFont.widthOfTextAtSize(`${label}: `, 10);
    dw(value, M + 4 + lw, CW - lw - 8, 10, regularFont);
  }
  y -= GAP;

  if (asistentes.length > 0) {
    drawSH("ASISTENTES");
    for (const a of asistentes) {
      ensureSpace(LH);
      const nombre = a.nombre ?? "—";
      const cargo = a.cargo ?? a.cargo_empresa ?? "—";
      page.drawText(`• ${nombre}`, { x: M + 8, y, size: 10, font: boldFont });
      const nW = boldFont.widthOfTextAtSize(`• ${nombre}  `, 10);
      page.drawText(`(${cargo})`, { x: M + 8 + nW, y, size: 10, font: regularFont, color: rgb(0.4, 0.4, 0.4) });
      y -= LH;
    }
    y -= GAP;
  }

  if (puntos.length > 0) {
    drawSH("ORDEN DEL DÍA");
    puntos.forEach((p, i) => dw(`${i + 1}. ${typeof p === "string" ? p : JSON.stringify(p)}`, M + 8, CW - 14, 10, regularFont));
    y -= GAP;
  }

  drawSH("DESARROLLO DEL ACTA");
  for (const line of textoActa.split("\n")) {
    if (line.trim()) dw(line, M + 4, CW - 8, 10, regularFont);
    else { ensureSpace(GAP); y -= GAP / 2; }
  }
  y -= GAP;

  drawSH("FIRMAS");
  const sigY = y - 30;
  ensureSpace(60);
  page.drawLine({ start: { x: M + 20, y: sigY }, end: { x: M + 180, y: sigY }, thickness: 0.5, color: rgb(0.3, 0.3, 0.3) });
  page.drawText("Presidente del Comité", { x: M + 20, y: sigY - 14, size: 9, font: boldFont });
  page.drawLine({ start: { x: W - M - 180, y: sigY }, end: { x: W - M - 20, y: sigY }, thickness: 0.5, color: rgb(0.3, 0.3, 0.3) });
  page.drawText("Secretario(a)", { x: W - M - 180, y: sigY - 14, size: 9, font: boldFont });
  y = sigY - 30;

  y -= 20;
  page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) });
  y -= 14;
  const footer = `Generado por SG-SST Regis Colombia  ·  ${genDate}`;
  const footerW = regularFont.widthOfTextAtSize(footer, 8);
  page.drawText(footer, { x: (W - footerW) / 2, y, size: 8, font: regularFont, color: rgb(0.6, 0.6, 0.6) });
  return Buffer.from(await pdfDoc.save());
}

function wrapText(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, fontSize) > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

export async function generateExamenPdf(examen: ExamenData, empresa: EmpresaData): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const W = 595, H = 842, M = 50;
  const CW = W - 2 * M;
  const LH = 16, GAP = 8;

  let page: PDFPage = pdfDoc.addPage([W, H]);
  let y = H - M;

  function ensureSpace(needed: number) {
    if (y - needed < M + 30) {
      page = pdfDoc.addPage([W, H]);
      y = H - M;
    }
  }

  function drawText(text: string, x: number, size: number, font: PDFFont, color = rgb(0.1, 0.1, 0.1)) {
    ensureSpace(LH);
    page.drawText(text, { x, y, size, font, color });
    y -= LH;
  }

  function drawWrapped(text: string, x: number, maxW: number, size: number, font: PDFFont) {
    for (const line of wrapText(text, font, size, maxW)) {
      ensureSpace(LH);
      page.drawText(line, { x, y, size, font });
      y -= LH;
    }
  }

  function drawSectionHeader(text: string) {
    y -= GAP;
    ensureSpace(LH + 8);
    page.drawRectangle({ x: M, y: y - 4, width: CW, height: LH + 7, color: rgb(0.9, 0.97, 0.93) });
    page.drawLine({ start: { x: M, y: y - 4 }, end: { x: M, y: y + LH + 3 }, thickness: 3, color: rgb(0, 0.42, 0.21) });
    page.drawText(text, { x: M + 8, y, size: 11, font: boldFont, color: rgb(0, 0.42, 0.21) });
    y -= LH + 10;
  }

  function drawDataRow(label: string, value: string) {
    ensureSpace(LH + 4);
    page.drawText(`${label}:`, { x: M + 4, y, size: 10, font: boldFont, color: rgb(0.35, 0.35, 0.35) });
    const labelW = boldFont.widthOfTextAtSize(`${label}: `, 10);
    const valueX = M + 4 + labelW;
    const valueMaxW = CW - labelW - 8;
    const lines = wrapText(value, regularFont, 10, valueMaxW);
    page.drawText(lines[0] ?? "", { x: valueX, y, size: 10, font: regularFont });
    y -= LH;
    for (let i = 1; i < lines.length; i++) {
      ensureSpace(LH);
      page.drawText(lines[i], { x: valueX, y, size: 10, font: regularFont });
      y -= LH;
    }
  }

  // Title
  const title = "INFORME DE SEGUIMIENTO DEL TRABAJADOR";
  const titleW = boldFont.widthOfTextAtSize(title, 14);
  page.drawText(title, { x: (W - titleW) / 2, y, size: 14, font: boldFont, color: rgb(0, 0.42, 0.21) });
  y -= 22;
  const sub = "Resolución 2346 de 2007 · Gestión de Exámenes Médicos Ocupacionales";
  const subW = regularFont.widthOfTextAtSize(sub, 9);
  page.drawText(sub, { x: (W - subW) / 2, y, size: 9, font: regularFont, color: rgb(0.55, 0.55, 0.55) });
  y -= 16;
  page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 1.5, color: rgb(0, 0.42, 0.21) });
  y -= 20;

  drawSectionHeader("DATOS DE LA EMPRESA");
  drawDataRow("Empresa", empresa.nombre);
  drawDataRow("NIT", empresa.nit);
  drawDataRow("Ciudad", empresa.ciudad ?? "—");
  drawDataRow("Código CIIU", empresa.codigo_ciiu ?? "—");
  y -= GAP;

  drawSectionHeader("DATOS DEL TRABAJADOR");
  drawDataRow("Nombre completo", examen.nombre_trabajador ?? "No especificado");
  drawDataRow("Cédula", examen.cedula_trabajador ?? "No especificado");
  drawDataRow("Cargo", examen.cargo ?? "No especificado");
  y -= GAP;

  drawSectionHeader("DATOS DEL EXAMEN");
  const fechaStr = examen.fecha_examen
    ? new Date(examen.fecha_examen).toLocaleDateString("es-CO")
    : "No disponible";
  drawDataRow("Tipo de examen", (examen.tipo ?? "Periódico").replace(/_/g, " "));
  drawDataRow("Fecha del examen", fechaStr);
  drawDataRow("Médico responsable", examen.medico ?? "No especificado");
  y -= GAP;

  drawSectionHeader("CONCEPTO MÉDICO LABORAL");
  const concepto = examen.concepto ?? "pendiente";
  const conceptoLabel = CONCEPTO_LABELS[concepto] ?? "PENDIENTE";
  const [cr, cg, cb] = CONCEPTO_COLORS_PDF[concepto] ?? [0.53, 0.53, 0.53];
  const boxW = boldFont.widthOfTextAtSize(conceptoLabel, 12) + 28;
  ensureSpace(32);
  page.drawRectangle({ x: M, y: y - 6, width: boxW, height: 28, color: rgb(cr, cg, cb) });
  page.drawText(conceptoLabel, { x: M + 14, y: y + 3, size: 12, font: boldFont, color: rgb(1, 1, 1) });
  y -= 36;

  const restricciones = toStringList((examen.restricciones as unknown[]) ?? []);
  if (restricciones.length > 0) {
    drawSectionHeader("RESTRICCIONES");
    for (const r of restricciones) drawWrapped(`• ${r}`, M + 8, CW - 14, 10, regularFont);
    y -= GAP;
  }

  const recomendaciones = toStringList((examen.recomendaciones as unknown[]) ?? []);
  if (recomendaciones.length > 0) {
    drawSectionHeader("RECOMENDACIONES DE SALUD OCUPACIONAL");
    for (const r of recomendaciones) drawWrapped(`• ${r}`, M + 8, CW - 14, 10, regularFont);
    y -= GAP;
  }

  y -= 20;
  page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) });
  y -= 14;
  const genDate = new Date().toLocaleDateString("es-CO");
  const footer = `Generado por SG-SST Regis Colombia  ·  ${genDate}`;
  const footerW = regularFont.widthOfTextAtSize(footer, 8);
  page.drawText(footer, { x: (W - footerW) / 2, y, size: 8, font: regularFont, color: rgb(0.6, 0.6, 0.6) });

  return Buffer.from(await pdfDoc.save());
}
