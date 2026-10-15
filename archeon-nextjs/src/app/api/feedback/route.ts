import { randomUUID, createHmac } from "node:crypto";
import { NextRequest } from "next/server";
import { currentAccount, database, json, validEmail, validOrigin } from "@/features/auth/server";
import { feedbackCategories, feedbackSource } from "@/features/feedback/constants";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!validOrigin(req)) return json({ error: "Origin not allowed." }, 403);
  if (Number(req.headers.get("content-length") || 0) > 12000) return json({ error: "Message too large." }, 413);
  // Read a bounded body even if the client omits Content-Length.
  let body: Record<string, unknown>;
  try {
    const raw = await req.text();
    if (raw.length > 12000) return json({ error: "Message too large." }, 413);
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw Error();
    body = parsed as Record<string, unknown>;
  } catch { return json({ error: "Invalid feedback data." }, 400); }
  if (body.website) return json({ success: true }); // hidden spam honeypot
  const category = body.category;
  const subject = typeof body.subject === "string" ? body.subject.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!feedbackCategories.some(c => c === category) || subject.length < 3 || subject.length > 160 || message.length < 10 || message.length > 4000 || (email && !validEmail(email)))
    return json({ error: "Please complete the subject, message and a valid optional email." }, 400);
  const secret = process.env.ARCHEON_AUTH_RATE_SECRET;
  if (!secret || secret.length < 32) return json({ error: "Support is temporarily unavailable." }, 503);
  const ip = (req.headers.get("x-vercel-forwarded-for") || req.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim().slice(0,100);
  const fingerprint = createHmac("sha256", secret).update(`feedback:${ip}`).digest("hex");
  try {
    const sql = database();
    const rate = await sql`INSERT INTO archeon_feedback_rate_limits(fingerprint, attempts, window_started)
      VALUES (${fingerprint}, 1, NOW()) ON CONFLICT(fingerprint) DO UPDATE SET
      attempts=CASE WHEN archeon_feedback_rate_limits.window_started < NOW()-INTERVAL '1 hour' THEN 1 ELSE archeon_feedback_rate_limits.attempts+1 END,
      window_started=CASE WHEN archeon_feedback_rate_limits.window_started < NOW()-INTERVAL '1 hour' THEN NOW() ELSE archeon_feedback_rate_limits.window_started END
      RETURNING attempts`;
    if (Number(rate[0]?.attempts) > 8) return json({ error: "Too many messages. Please try again later." }, 429);
    let userId: string | null = null;
    try { userId = (await currentAccount())?.userId || null; } catch { /* guest messages still work */ }
    await sql`INSERT INTO archeon_feedback(id,user_id,category,source_app,subject,message,reply_email)
      VALUES (${randomUUID()}, ${userId}, ${category as string}, ${feedbackSource(body.source)}, ${subject}, ${message}, ${email || null})`;
    return json({ success: true }, 201);
  } catch (error) {
    console.error("Feedback submission failed", error);
    return json({ error: "Support is temporarily unavailable. Please try again later." }, 503);
  }
}
