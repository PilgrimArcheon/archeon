/** Archeon transactional mail using Brevo HTTP API; no SMTP ports or Resend. */
export type MailAttachment = { name: string; content: string };
export async function sendArcheonEmail(input: {
  to: string; subject: string; text?: string; html?: string;
  bcc?: string; replyTo?: string; attachments?: MailAttachment[];
}): Promise<string> {
  const apiKey = process.env.BREVO_API_KEY;
  const sender = process.env.BREVO_SENDER_EMAIL;
  if (!apiKey || !sender) throw new Error("Brevo transactional email is not configured.");
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": apiKey, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      sender: { name: "Archeon", email: sender },
      to: [{ email: input.to }],
      ...(input.bcc ? { bcc: [{ email: input.bcc }] } : {}),
      ...(input.replyTo ? { replyTo: { email: input.replyTo } } : {}),
      subject: input.subject,
      ...(input.text ? { textContent: input.text } : {}),
      ...(input.html ? { htmlContent: input.html } : {}),
      ...(input.attachments?.length ? { attachment: input.attachments } : {}),
    }),
    cache: "no-store",
  });
  if (!response.ok) {
    // Do not expose provider responses or recipient addresses to client logs.
    console.error("Brevo transactional email rejected", response.status);
    throw new Error("The email provider could not accept this message.");
  }
  const result = await response.json().catch(() => ({})) as { messageId?: string };
  return result.messageId || "accepted";
}
