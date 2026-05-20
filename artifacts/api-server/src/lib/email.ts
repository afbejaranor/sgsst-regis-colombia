import nodemailer from "nodemailer";

// Configure via environment variables — zero code changes needed to switch providers:
//
//   Gmail:   SMTP_HOST=smtp.gmail.com  SMTP_PORT=465  SMTP_SECURE=true  SMTP_USER=...  SMTP_PASS=...
//   Outlook: SMTP_HOST=smtp.office365.com  SMTP_PORT=587  SMTP_SECURE=false  SMTP_USER=...  SMTP_PASS=...
//
// SMTP_FROM  (optional) — display name + address, e.g. "SG-SST Regis <notificaciones@regiscolombia.com>"

function createTransporter() {
  if (!process.env.SMTP_USER) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT ?? 465),
    secure: process.env.SMTP_SECURE !== "false",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const transporter = createTransporter();
  if (!transporter) {
    console.warn("[email] SMTP_USER not set — skipping email send");
    return false;
  }
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
      to,
      subject,
      html,
    });
    return true;
  } catch (err) {
    console.error("[email] Send failed", err);
    return false;
  }
}

export function buildExamenConfirmacionHtml(opts: {
  nombreTrabajador: string;
  concepto: string;
  empresa: string;
  fecha: string;
}): string {
  const conceptoColor = opts.concepto === "apto" ? "#059669" : opts.concepto === "no_apto" ? "#dc2626" : "#d97706";
  const conceptoLabel = { apto: "APTO", apto_con_restricciones: "APTO CON RESTRICCIONES", no_apto: "NO APTO", pendiente: "PENDIENTE" }[opts.concepto] ?? opts.concepto.toUpperCase();
  return `
<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:8px;">
  <div style="background:#006B35;padding:16px;border-radius:6px 6px 0 0;text-align:center;">
    <h2 style="color:#fff;margin:0;font-size:18px;">SG-SST · Regis Colombia</h2>
    <p style="color:#ccffcc;margin:4px 0 0;font-size:12px;">Sistema de Gestión de Seguridad y Salud en el Trabajo</p>
  </div>
  <div style="padding:24px;background:#fff;">
    <p style="color:#374151;font-size:14px;">Estimado/a <strong>${opts.nombreTrabajador}</strong>,</p>
    <p style="color:#374151;font-size:14px;">Se ha procesado su examen médico ocupacional de la empresa <strong>${opts.empresa}</strong>.</p>
    <div style="background:#f9fafb;border-left:4px solid ${conceptoColor};padding:12px 16px;margin:16px 0;border-radius:0 6px 6px 0;">
      <p style="margin:0;font-size:13px;color:#6b7280;">Concepto médico</p>
      <p style="margin:4px 0 0;font-size:16px;font-weight:bold;color:${conceptoColor};">${conceptoLabel}</p>
    </div>
    <p style="color:#6b7280;font-size:12px;margin-top:24px;">Fecha: ${opts.fecha} · Resolución 2346 de 2007</p>
  </div>
</div>`;
}

export function buildActaNotificacionHtml(opts: {
  tipoComite: string;
  empresa: string;
  fecha: string;
  asistentes: string[];
  actaUrl?: string;
}): string {
  return `
<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:8px;">
  <div style="background:#006B35;padding:16px;border-radius:6px 6px 0 0;text-align:center;">
    <h2 style="color:#fff;margin:0;font-size:18px;">SG-SST · Regis Colombia</h2>
  </div>
  <div style="padding:24px;">
    <p style="color:#374151;font-size:14px;">Se ha generado el acta de reunión del <strong>${opts.tipoComite}</strong> de <strong>${opts.empresa}</strong>.</p>
    <p style="color:#374151;font-size:14px;"><strong>Fecha:</strong> ${opts.fecha}</p>
    <p style="color:#374151;font-size:14px;"><strong>Asistentes:</strong> ${opts.asistentes.join(", ") || "—"}</p>
    ${opts.actaUrl ? `<p style="margin-top:16px;"><a href="${opts.actaUrl}" style="background:#006B35;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-size:13px;">Ver / descargar acta</a></p>` : ""}
    <p style="color:#9ca3af;font-size:11px;margin-top:24px;">Este mensaje fue generado automáticamente por SG-SST Regis Colombia.</p>
  </div>
</div>`;
}
