import { NextRequest } from "next/server";
import { accountSetup, authProblem, canAttemptAccount, json, loginAccount, normalizeEmail, setSessionCookie, validEmail, validOrigin } from "@/features/auth/server";
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
  if (!validEmail(email) || !password || password.length > 128) return json({ error: "Incorrect email or password." }, 401);
  try {
    if (!await canAttemptAccount(req, "login", email)) return json({ error: "Too many attempts. Please try again in an hour." }, 429);
    const result = await loginAccount(email, password);
    if (!result) return json({ error: "Incorrect email or password." }, 401);
    const res = json({ signedIn: true, email: result.account.email });
    setSessionCookie(res, result.session);
    return res;
  } catch (err) { return authProblem(err); }
}
