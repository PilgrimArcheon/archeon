import { neon } from "@neondatabase/serverless";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createHash, createHmac, randomBytes, randomUUID } from "node:crypto";
import { dummyPasswordCheck, hashPassword, validPassword, verifyPassword } from "./password";

// Shared across future Archeon apps; invoice records are scoped to a workspace.
export const COOKIE_NAME = "archeon_apps_session";
export const SESSION_AGE = 30 * 24 * 60 * 60;
const digest = (value: string) => createHash("sha256").update(value).digest("hex");
const randomToken = () => randomBytes(32).toString("base64url");
export const normalizeEmail = (email: string) => email.trim().toLowerCase();
export const validEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;

export function database() {
  const url = process.env.ARCHEON_DATABASE_URL || process.env.INVOICE_DATABASE_URL;
  if (!url) throw new Error("ARCHEON_DATABASE_URL is not configured.");
  return neon(url);
}
export function validOrigin(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  try { return new URL(origin).origin === new URL(req.url).origin; }
  catch { return false; }
}
export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
}
export function authProblem(err: unknown) {
  console.error("Archeon account authentication failed:", err);
  const pg = err as { code?: string } | null;
  if (pg?.code === "42P01" || pg?.code === "42703") return json({
    error: "The account database needs an update. Please contact the site administrator.",
    code: "AUTH_DATABASE_SCHEMA_MISSING",
  }, 503);
  return json({ error: "Accounts are temporarily unavailable. Please try later.", code: "AUTH_SERVICE_ERROR" }, 503);
}
export function accountSetup(): NextResponse | null {
  if (!process.env.ARCHEON_DATABASE_URL && !process.env.INVOICE_DATABASE_URL) {
    return json({ error: "Accounts aren't configured on this site yet.", code: "AUTH_DATABASE_NOT_CONFIGURED" }, 503);
  }
  if (!process.env.ARCHEON_AUTH_RATE_SECRET || process.env.ARCHEON_AUTH_RATE_SECRET.length < 32) {
    return json({ error: "Account security configuration is incomplete.", code: "AUTH_RATE_LIMIT_NOT_CONFIGURED" }, 503);
  }
  return null;
}
export type Account = { userId: string; workspaceId: string; email: string };
export async function currentAccount(): Promise<Account | null> {
  const value = (await cookies()).get(COOKIE_NAME)?.value;
  if (!value || value.length > 128) return null;
  const sql = database();
  const rows = await sql`
    SELECT u.id AS user_id, u.email, m.workspace_id
    FROM archeon_sessions s JOIN archeon_users u ON u.id=s.user_id
    JOIN archeon_workspace_members m ON m.user_id=u.id
    WHERE s.token_hash=${digest(value)} AND s.expires_at>NOW() AND m.role='owner'
    ORDER BY m.workspace_id ASC LIMIT 1`;
  return rows.length ? { userId: String(rows[0].user_id), email: String(rows[0].email), workspaceId: String(rows[0].workspace_id) } : null;
}
export async function revokeSession() {
  const value = (await cookies()).get(COOKIE_NAME)?.value;
  if (value) { const sql = database(); await sql`DELETE FROM archeon_sessions WHERE token_hash=${digest(value)}`; }
}
export function clearCookie(res: NextResponse) {
  res.cookies.set(COOKIE_NAME, "", { path: "/", httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 0 });
}
export function setSessionCookie(res: NextResponse, session: string) {
  res.cookies.set(COOKIE_NAME, session, {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: SESSION_AGE,
  });
}
function limiterKey(value: string) {
  const secret = process.env.ARCHEON_AUTH_RATE_SECRET;
  if (!secret || secret.length < 32) throw new Error("ARCHEON_AUTH_RATE_SECRET is missing.");
  return createHmac("sha256", secret).update(value).digest("hex");
}
async function hitLimit(key: string, ceiling: number) {
  const sql = database();
  const hashed = limiterKey(key);
  const rows = await sql`INSERT INTO archeon_auth_rate_limits(fingerprint,attempts,window_started)
    VALUES(${hashed},1,NOW()) ON CONFLICT(fingerprint) DO UPDATE SET
    attempts=CASE WHEN archeon_auth_rate_limits.window_started < NOW()-INTERVAL '1 hour' THEN 1 ELSE archeon_auth_rate_limits.attempts+1 END,
    window_started=CASE WHEN archeon_auth_rate_limits.window_started < NOW()-INTERVAL '1 hour' THEN NOW() ELSE archeon_auth_rate_limits.window_started END
    RETURNING attempts`;
  return Number(rows[0].attempts) > ceiling;
}
export async function canAttemptAccount(req: NextRequest, action: "login" | "register", email: string) {
  const ip = (req.headers.get("x-vercel-forwarded-for") || req.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim().slice(0, 80);
  const [ipLimited, pairLimited] = await Promise.all([
    hitLimit(`${action}:ip:${ip}`, action === "login" ? 30 : 12),
    hitLimit(`${action}:pair:${ip}:${email}`, action === "login" ? 8 : 5),
  ]);
  return !ipLimited && !pairLimited;
}
async function newSession(userId: string) {
  const token = randomToken();
  const sql = database();
  await sql`INSERT INTO archeon_sessions(token_hash,user_id,expires_at)
    VALUES(${digest(token)},${userId},NOW()+INTERVAL '30 days')`;
  return token;
}
export async function registerAccount(email: string, password: string) {
  if (!validEmail(email) || !validPassword(password)) throw new Error("Invalid registration input.");
  const sql = database();
  const userId = randomUUID();
  const workspaceId = randomUUID();
  const passwordHash = await hashPassword(password);
  // Single statement ensures account, credentials, workspace and ownership arrive together.
  const created = await sql`
    WITH new_user AS (
      INSERT INTO archeon_users(id,email,last_login_at) VALUES(${userId},${email},NOW())
      ON CONFLICT(email) DO NOTHING RETURNING id,email
    ), new_workspace AS (
      INSERT INTO archeon_workspaces(id,owner_user_id,name)
      SELECT ${workspaceId}::uuid,id,'My workspace' FROM new_user RETURNING id,owner_user_id
    ), new_member AS (
      INSERT INTO archeon_workspace_members(workspace_id,user_id,role)
      SELECT new_workspace.id,new_user.id,'owner' FROM new_workspace CROSS JOIN new_user
      RETURNING user_id
    ), new_credentials AS (
      INSERT INTO archeon_password_credentials(user_id,password_hash)
      SELECT id,${passwordHash} FROM new_user RETURNING user_id
    ) SELECT new_user.id AS user_id,new_user.email,new_workspace.id AS workspace_id
      FROM new_user CROSS JOIN new_workspace
      WHERE EXISTS(SELECT 1 FROM new_member) AND EXISTS(SELECT 1 FROM new_credentials)`;
  if (!created.length) return null;
  const account = { userId: String(created[0].user_id), workspaceId: String(created[0].workspace_id), email };
  return { account, session: await newSession(account.userId) };
}
export async function loginAccount(email: string, password: string) {
  const sql = database();
  const rows = await sql`SELECT u.id AS user_id,u.email,c.password_hash,m.workspace_id
    FROM archeon_users u
    JOIN archeon_password_credentials c ON c.user_id=u.id
    JOIN archeon_workspace_members m ON m.user_id=u.id AND m.role='owner'
    WHERE u.email=${email} LIMIT 1`;
  if (!rows.length) { await dummyPasswordCheck(password); return null; }
  if (!await verifyPassword(password, String(rows[0].password_hash))) return null;
  const userId = String(rows[0].user_id);
  await sql`UPDATE archeon_users SET last_login_at=NOW() WHERE id=${userId}`;
  return { account: { userId, workspaceId: String(rows[0].workspace_id), email: String(rows[0].email) }, session: await newSession(userId) };
}
