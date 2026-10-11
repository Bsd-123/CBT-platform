/**
 * Shared HTML shell for every email: table-based, inline-styled and right-to-left, so it renders
 * the same in Gmail, Outlook and phones. Colours follow the app (coral accent, deep red actions,
 * warm off-white background). Everything that comes from users is escaped here.
 */

export const BRAND = {
  name: "קהילת מטפלי CBT",
  accent: "#ff8066",
  action: "#a43c28",
  actionText: "#ffffff",
  background: "#f9f9f8",
  card: "#ffffff",
  border: "#e9e9e8",
  text: "#1c1c1b",
  muted: "#5c5c5b",
  quoteBackground: "#fff0ec",
  font: "Heebo, 'Segoe UI', Arial, sans-serif",
} as const;

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** A short, single-paragraph preview of user text for quoting in an email. */
export function previewText(value: string, max = 240): string {
  const flat = value.replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max).trimEnd()}…` : flat;
}

export type EmailBlock =
  | { kind: "paragraph"; text: string }
  | { kind: "quote"; text: string; byline?: string }
  | { kind: "details"; rows: { label: string; value: string }[] }
  | { kind: "changes"; rows: { label: string; before: string; after: string }[] };

export type EmailContent = {
  /** Shown by mail clients next to the subject; hidden in the body. */
  preheader: string;
  heading: string;
  /** Greeting line, e.g. "שלום נועה,". */
  greeting?: string;
  blocks: EmailBlock[];
  cta?: { label: string; url: string };
  /** Small print above the footer. */
  note?: string;
};

export type RenderedEmail = { html: string; text: string };

const p = (inner: string) =>
  `<p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:${BRAND.text};">${inner}</p>`;

function renderBlock(block: EmailBlock): string {
  switch (block.kind) {
    case "paragraph":
      return p(escapeHtml(block.text));
    case "quote":
      return `<blockquote style="margin:0 0 20px;padding:14px 16px;background:${BRAND.quoteBackground};border-right:4px solid ${BRAND.accent};border-radius:8px;">
        ${block.byline ? `<div style="font-size:13px;font-weight:700;color:${BRAND.action};margin-bottom:6px;">${escapeHtml(block.byline)}</div>` : ""}
        <div style="font-size:15px;line-height:1.7;color:${BRAND.text};white-space:pre-wrap;">${escapeHtml(block.text)}</div>
      </blockquote>`;
    case "details":
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;border:1px solid ${BRAND.border};border-radius:8px;border-collapse:separate;">
        ${block.rows
          .map(
            (row, index) => `<tr>
          <td style="padding:10px 14px;width:34%;font-size:13px;font-weight:700;color:${BRAND.muted};vertical-align:top;${index > 0 ? `border-top:1px solid ${BRAND.border};` : ""}">${escapeHtml(row.label)}</td>
          <td style="padding:10px 14px;font-size:15px;color:${BRAND.text};vertical-align:top;${index > 0 ? `border-top:1px solid ${BRAND.border};` : ""}">${escapeHtml(row.value)}</td>
        </tr>`,
          )
          .join("")}
      </table>`;
    case "changes":
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;border:1px solid ${BRAND.border};border-radius:8px;border-collapse:separate;">
        ${block.rows
          .map(
            (row, index) => `<tr><td style="padding:12px 14px;${index > 0 ? `border-top:1px solid ${BRAND.border};` : ""}">
          <div style="font-size:13px;font-weight:700;color:${BRAND.muted};margin-bottom:6px;">${escapeHtml(row.label)}</div>
          <div style="font-size:14px;color:${BRAND.muted};text-decoration:line-through;overflow-wrap:anywhere;">${escapeHtml(row.before)}</div>
          <div style="font-size:16px;font-weight:700;color:${BRAND.text};margin-top:4px;overflow-wrap:anywhere;">${escapeHtml(row.after)}</div>
        </td></tr>`,
          )
          .join("")}
      </table>`;
  }
}

function renderText(content: EmailContent): string {
  const lines: string[] = [content.heading, ""];
  if (content.greeting) lines.push(content.greeting, "");
  for (const block of content.blocks) {
    switch (block.kind) {
      case "paragraph":
        lines.push(block.text, "");
        break;
      case "quote":
        lines.push(`${block.byline ? `${block.byline}:\n` : ""}"${block.text}"`, "");
        break;
      case "details":
        lines.push(...block.rows.map((row) => `${row.label}: ${row.value}`), "");
        break;
      case "changes":
        lines.push(...block.rows.map((row) => `${row.label}: ${row.before} ← ${row.after}`), "");
        break;
    }
  }
  if (content.cta) lines.push(`${content.cta.label}: ${content.cta.url}`, "");
  if (content.note) lines.push(content.note, "");
  lines.push(`— ${BRAND.name}`);
  return lines.join("\n");
}

export function renderEmail(content: EmailContent): RenderedEmail {
  const cta = content.cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 24px;"><tr><td style="border-radius:8px;background:${BRAND.action};">
        <a href="${escapeHtml(content.cta.url)}" class="cta" style="display:inline-block;padding:13px 28px;font-size:16px;font-weight:700;color:${BRAND.actionText};text-decoration:none;border-radius:8px;">${escapeHtml(content.cta.label)}</a>
      </td></tr></table>
      <p style="margin:0 0 8px;font-size:12px;line-height:1.6;color:${BRAND.muted};word-break:break-all;">אם הכפתור לא נפתח: <a href="${escapeHtml(content.cta.url)}" style="color:${BRAND.action};">${escapeHtml(content.cta.url)}</a></p>`
    : "";

  const html = `<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<title>${escapeHtml(content.heading)}</title>
<style>
  @media only screen and (max-width:480px) {
    .container { width:100% !important; }
    .pad { padding:20px 16px !important; }
    .cta { display:block !important; text-align:center !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:${BRAND.background};font-family:${BRAND.font};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(content.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.background};">
  <tr><td align="center" style="padding:24px 12px;">
    <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%;background:${BRAND.card};border:1px solid ${BRAND.border};border-radius:12px;overflow:hidden;">
      <tr><td style="height:6px;background:${BRAND.accent};font-size:0;line-height:0;">&nbsp;</td></tr>
      <tr><td class="pad" style="padding:24px 32px 8px;text-align:right;">
        <div style="font-size:18px;font-weight:800;color:${BRAND.action};">${escapeHtml(BRAND.name)}</div>
      </td></tr>
      <tr><td class="pad" style="padding:8px 32px 28px;text-align:right;direction:rtl;">
        <h1 style="margin:8px 0 16px;font-size:22px;line-height:1.4;color:${BRAND.text};">${escapeHtml(content.heading)}</h1>
        ${content.greeting ? p(escapeHtml(content.greeting)) : ""}
        ${content.blocks.map(renderBlock).join("\n")}
        ${cta}
        ${content.note ? `<p style="margin:16px 0 0;padding-top:16px;border-top:1px solid ${BRAND.border};font-size:13px;line-height:1.7;color:${BRAND.muted};">${escapeHtml(content.note)}</p>` : ""}
      </td></tr>
    </table>
    <p style="max-width:600px;margin:16px auto 0;font-size:12px;line-height:1.6;color:${BRAND.muted};text-align:center;">
      קיבלתם הודעה זו כי אתם חברים ב${escapeHtml(BRAND.name)}.
    </p>
  </td></tr>
</table>
</body>
</html>`;

  return { html, text: renderText(content) };
}
