/** Server-only transactional email adapter shared by Archeon Apps. */

type Address = { email: string; name?: string };
type Attachment = { filename: string; base64: string };
export type SendEmail = {
  to: string[];
  subject: string;
  html: string;
  text?: string;
  bcc?: string[];
  replyTo?: string;
  attachments?: Attachment[];
};

export class BrevoError extends Error {
  constructor(public status: number, message: string) { super(message); this.name = "BrevoError"; }
}
export function parseSender(value: string): Address {
  const trimmed = value.trim();
  const match = /^(.*?)\s*<([^<>\s]+@[^<>\s]+)>$/.exec(trimmed);
  const email = match ? match[2] : trimmed;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("ARCHEON_MAIL_FROM must be an email, or a name with an email in angle brackets.");
  }
  return { email, ...(match && match[1].trim() ? { name: match[1].trim() } : {}) };
}

export async function sendEmail(mail: SendEmail): Promise<{ messageId: string }> {
  const apiKey = process.env.BREVO_API_KEY;
  const from = process.env.ARCHEON_MAIL_FROM;
  if (!apiKey || !from) throw new Error("Brevo email delivery is not configured.");
  const sender = parseSender(from);
  const payload: Record<string, unknown> = {
    sender,
    to: mail.to.map(email => ({ email })),
    subject: mail.subject,
    htmlContent: mail.html,
    ...(mail.bcc?.length ? { bcc: mail.bcc.map(email => ({ email })) } : {}),
    ...(mail.replyTo ? { replyTo: { email: mail.replyTo } } : {}),
    ...(mail.attachments?.length ? { attachment: mail.attachments.map(a => ({ name: a.filename, content: a.base64 })) } : {}),
  };
  // Provider API key stays on the server. Never use this function from client components.
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": apiKey, "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const details = (body && typeof body === "object" && "message" in body)
      ? String((body as { message?: unknown }).message).slice(0, 240)
      : `HTTP ${response.status}`;
    throw new BrevoError(response.status, details);
  }
  return {
    messageId: body && typeof body === "object" && "messageId" in body
      ? String((body as { messageId?: unknown }).messageId || "") : "",
  };
}
