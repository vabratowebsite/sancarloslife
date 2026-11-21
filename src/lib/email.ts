import "server-only";

/**
 * Transactional email through Resend's HTTP API. Without RESEND_API_KEY
 * (local development) the message is written to the server log instead.
 */
type Mail = { to: string | string[]; subject: string; text: string; html?: string; replyTo?: string };

export const EDITORS = (process.env.FORMS_NOTIFY_TO || "hello@sancarloslife.com").split(",").map((s) => s.trim());
const FROM = process.env.EMAIL_FROM || "San Carlos Life <hello@sancarloslife.com>";

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** A plain, readable email body from label/value pairs. */
export function summaryEmail(intro: string, rows: [string, string | undefined | null][]) {
  const kept = rows.filter(([, v]) => v);
  return {
    text: `${intro}\n\n${kept.map(([k, v]) => `${k}: ${v}`).join("\n")}`,
    html: `<p>${escapeHtml(intro)}</p><table cellpadding="6" style="border-collapse:collapse;font-family:sans-serif;font-size:14px">${kept
      .map(([k, v]) => `<tr><td style="color:#5B6B6B;vertical-align:top">${escapeHtml(k)}</td><td style="white-space:pre-wrap">${escapeHtml(String(v))}</td></tr>`)
      .join("")}</table>`,
  };
}

export async function sendEmail(mail: Mail): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.info(`[email not sent: no RESEND_API_KEY] to=${mail.to} subject="${mail.subject}"\n${mail.text}`);
    return false;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to: mail.to, subject: mail.subject, text: mail.text, html: mail.html, reply_to: mail.replyTo }),
  }).catch((e) => {
    console.error("Resend request failed", e);
    return null;
  });
  if (!res?.ok) console.error("Resend error", res?.status, await res?.text().catch(() => ""));
  return Boolean(res?.ok);
}
