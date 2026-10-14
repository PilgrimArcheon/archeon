import { NextRequest } from "next/server";
import { authProblem, canAttemptPassword, json, normalizeEmail, validOrigin } from "@/features/auth/server";
import { registerAccount, successWithSession } from "@/features/auth/password";
export const runtime = "nodejs";
export async function POST(req: NextRequest) {
  if (!validOrigin(req)) return json({ error: "Invalid request origin." }, 403);
  try {
    const body = await req.json();
    const email = typeof body?.email === "string" ? normalizeEmail(body.email) : "";
    const password = body?.password;
    if (typeof password !== "string" || password.length < 8 || password.length > 128 || email.length > 254)
      return json({ error: "Use a valid email and a password of 8–128 characters." }, 400);
    if (!await canAttemptPassword(req, email, "register")) return json({ error: "Too many attempts. Try again later." }, 429);
    const account = await registerAccount(email, password);
    if (!account.ok) return json({ error: account.error }, account.status);
    return successWithSession(account);
  } catch (error) { return authProblem(error); }
}
