import { NextRequest } from "next/server";
import { authProblem, canAttemptPassword, json, normalizeEmail, validOrigin } from "@/features/auth/server";
import { loginAccount, successWithSession } from "@/features/auth/password";
export const runtime = "nodejs";
export async function POST(req: NextRequest) {
  if (!validOrigin(req)) return json({ error: "Invalid request origin." }, 403);
  try {
    const body = await req.json();
    const email = typeof body?.email === "string" ? normalizeEmail(body.email) : "";
    const password = body?.password;
    if (typeof password !== "string" || password.length > 128 || email.length > 254)
      return json({ error: "Incorrect email or password." }, 401);
    if (!await canAttemptPassword(req, email, "login")) return json({ error: "Too many attempts. Try again later." }, 429);
    const account = await loginAccount(email, password);
    if (!account) return json({ error: "Incorrect email or password." }, 401);
    return successWithSession(account);
  } catch (error) { return authProblem(error); }
}
