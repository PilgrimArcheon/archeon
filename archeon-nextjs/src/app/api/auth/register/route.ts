import { NextRequest } from "next/server";
import { accountSetup, authProblem, canAttemptAccount, json, normalizeEmail, registerAccount, setSessionCookie, validEmail, validOrigin } from "@/features/auth/server";
import { validPassword } from "@/features/auth/password";
export const runtime = "nodejs";
export async function POST(req: NextRequest) {
  if (!validOrigin(req)) return json({ error: "Invalid request origin." }, 403);
  const missing = accountSetup(); if (missing) return missing;
  let email = ""; let password = "";
  try {
    const body = await req.json();
    email = typeof body?.email === "string" ? normalizeEmail(body.email) : "";
    password = typeof body?.password === "string" ? body.password : "";
  } catch { return json({ error: "Enter an email and password." }, 400); }
  if (!validEmail(email)) return json({ error: "Enter a valid email address." }, 400);
  if (!validPassword(password)) return json({ error: "Use a password with 12–128 characters." }, 400);
  try {
    if (!await canAttemptAccount(req, "register", email)) return json({ error: "Too many attempts. Please try again in an hour." }, 429);
    const result = await registerAccount(email, password);
    if (!result) return json({ error: "An account already exists with this address. Sign in instead." }, 409);
    const res = json({ signedIn: true, email: result.account.email }, 201);
    setSessionCookie(res, result.session);
    return res;
  } catch (err) { return authProblem(err); }
}
