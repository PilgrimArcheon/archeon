import { sendEmail } from "@/features/email/brevo";
import { NextResponse } from "next/server";

// An optional server-side email endpoint. No SMTP tokens or API keys are ever sent to the browser.
// For production deployments, also configure rate limiting / bot protection at your host.
export async function POST(request: Request) {
  let data: unknown;
  try { data = await request.json(); } catch { return NextResponse.json({ code: "INVALID_JSON" }, { status: 400 }); }
  if (!data || typeof data !== "object") return NextResponse.json({ code: "INVALID_PAYLOAD" }, { status: 400 });

  const fields = data as Record<string, unknown>;
  const name = typeof fields.name === "string" ? fields.name.trim() : "";
  const email = typeof fields.email === "string" ? fields.email.trim() : "";
  const message = typeof fields.message === "string" ? fields.message.trim() : "";
  const company = typeof fields.company === "string" ? fields.company : "";

  // Silently discard obvious bot submissions using the hidden honeypot field.
  if (company) return NextResponse.json({ success: true });
  if (!name || name.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || message.length < 10 || message.length > 5000) {
    return NextResponse.json({ code: "VALIDATION_ERROR" }, { status: 400 });
  }

  const to = process.env.CONTACT_TO_EMAIL;
  if (!process.env.BREVO_API_KEY || !process.env.ARCHEON_MAIL_FROM || !to)
    return NextResponse.json({ code: "MAIL_NOT_CONFIGURED" }, { status: 503 });

  try {
    const escapedName = name.replace(/[\r\n]/g, " ").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] || c));
    const escapedMessage = message.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] || c));
    await sendEmail({
      to: [to],
      replyTo: email,
      subject: `Portfolio enquiry from ${escapedName}`,
      html: `<p>From: ${escapedName} (${email})</p><p>${escapedMessage.replaceAll("\n", "<br/>")}</p>`,
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Portfolio contact delivery failed:", err);
    return NextResponse.json({ code: "SEND_FAILED" }, { status: 502 });
  }
}
