export interface EmailContent {
  eyebrow: string;
  heading: string;
  /** Soporta **negrita**. */
  intro?: string;
  highlight?: { badge: string; title: string };
  outro?: string;
  cta?: { label: string; url: string };
  /** Cada línea del recuadro gris. Soporta **negrita**. */
  notice?: string[];
}

const GOLD = '#A67C24';
const INK = '#1A1A1A';
const BODY = '#5B6B72';
const MUTED = '#A8A49C';
const LINE = '#E5E2DC';
const SOFT_BG = '#F7F6F3';

// Los valores vienen de la DB y del input de teachers: escapar antes de interpolar en HTML.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Negrita con **...** sobre texto ya escapado: el autor del copy no puede inyectar HTML.
function richText(value: string): string {
  return escapeHtml(value).replace(/\*\*(.+?)\*\*/g, '<strong style="color:#1A1A1A;">$1</strong>');
}

const P = `color:${BODY};font-size:15px;line-height:24px;margin:0 0 18px;`;

export function renderEmail(content: EmailContent, name?: string): string {
  const greeting = name
    ? `Hola, <strong style="color:${INK};">${escapeHtml(name)}</strong>,`
    : 'Hola,';

  const intro = content.intro ? `<p style="${P}">${richText(content.intro)}</p>` : '';

  const highlight = content.highlight
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
        <tr><td style="background:${SOFT_BG};border-left:4px solid ${GOLD};padding:18px 20px;">
          <span style="display:inline-block;background:#EFE7DA;color:${GOLD};font-size:11px;font-weight:700;letter-spacing:1.2px;padding:5px 10px;border-radius:3px;">${escapeHtml(content.highlight.badge)}</span>
          <div style="color:${INK};font-size:16px;font-weight:700;line-height:24px;margin:12px 0 0;">${escapeHtml(content.highlight.title)}</div>
        </td></tr>
      </table>`
    : '';

  const outro = content.outro ? `<p style="${P}">${richText(content.outro)}</p>` : '';

  const button = content.cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:6px 0 28px;">
        <tr><td style="background:${GOLD};border-radius:4px;">
          <a href="${escapeHtml(content.cta.url)}" style="display:inline-block;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:15px 30px;">${escapeHtml(content.cta.label)}</a>
        </td></tr>
      </table>`
    : '';

  const notice = content.notice?.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="background:${SOFT_BG};border:1px solid ${LINE};padding:18px 20px;">
          ${content.notice.map((line, i) => `<p style="color:${BODY};font-size:13px;line-height:21px;margin:${i === 0 ? '0' : '8px 0 0'};">${richText(line)}</p>`).join('')}
        </td></tr>
      </table>`
    : '';

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:32px 16px;background:#F2F0ED;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;border-top:4px solid ${GOLD};">
    <tr><td style="padding:40px 44px 44px;">

      <div style="text-align:center;">
        <div style="color:${GOLD};font-size:19px;font-weight:700;letter-spacing:2.5px;">INSCRIPCIONES CAMPUS CCP</div>
        <div style="color:${MUTED};font-size:11px;letter-spacing:2px;margin:8px 0 0;">CENTRO DE CRECIMIENTO PERSONAL</div>
      </div>

      <div style="border-top:1px solid ${LINE};margin:28px 0 30px;"></div>

      <p style="color:${GOLD};font-size:11px;font-weight:700;letter-spacing:1.6px;margin:0 0 10px;">${escapeHtml(content.eyebrow)}</p>
      <h1 style="color:${INK};font-size:26px;line-height:34px;font-weight:700;margin:0 0 22px;">${escapeHtml(content.heading)}</h1>

      <p style="${P}">${greeting}</p>
      ${intro}
      ${highlight}
      ${outro}
      ${button}
      ${notice}

      <div style="border-top:1px solid ${LINE};margin:34px 0 20px;"></div>

      <p style="color:${BODY};font-size:13px;line-height:20px;text-align:center;margin:0;">Centro de Crecimiento Personal — Campus CCP</p>
      <p style="color:${MUTED};font-size:12px;line-height:19px;text-align:center;margin:6px 0 0;">Este es un mensaje automático, por favor no respondas a este correo.</p>

    </td></tr>
  </table>
</body>
</html>`;
}
