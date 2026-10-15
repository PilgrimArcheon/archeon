import { NextRequest } from "next/server";
import { currentAccount, database, json, validOrigin, canAttemptAccount } from "@/features/auth/server";
import { verifyPassword } from "@/features/auth/password";
import { ADMIN_COOKIE, allowedAdmin, createAdminGrant } from "@/features/admin/access";
export const runtime = "nodejs";
export async function POST(req: NextRequest) {
  if (!validOrigin(req)) return json({ error: "Origin not allowed" }, 403);
  try {
    const account = await currentAccount();
    if (!allowedAdmin(account)) return json({ error: "Not found" }, 404);
    const body: unknown = await req.json();
    const password = (body && typeof body === "object" && "password" in body) ? (body as {password?:unknown}).password : null;
    if (typeof password !== "string" || !password || password.length > 128) return json({ error: "Enter your account password." }, 400);
    if (!(await canAttemptAccount(req, "login", `admin:${account!.email}`))) return json({ error: "Too many attempts. Try again later." }, 429);
    const sql = database();
    const rows = await sql`SELECT password_hash FROM archeon_password_credentials WHERE user_id=${account!.userId} LIMIT 1`;
    if (!rows.length || !(await verifyPassword(password, String(rows[0].password_hash)))) return json({ error: "Incorrect password." }, 401);
    const response = json({ unlocked: true });
    response.cookies.set(ADMIN_COOKIE, await createAdminGrant(account!), { httpOnly:true, secure:process.env.NODE_ENV === "production", sameSite:"strict", path:"/", maxAge:20*60 });
    return response;
  } catch (err) { console.error("Admin unlock failed", err); return json({ error: "Admin access temporarily unavailable." }, 503); }
}
export async function DELETE(req: NextRequest) {
  if (!validOrigin(req)) return json({ error: "Origin not allowed" }, 403);
  const response = json({ locked: true });
  response.cookies.set(ADMIN_COOKIE, "", { httpOnly:true, secure:process.env.NODE_ENV === "production", sameSite:"strict", path:"/", maxAge:0 });
  return response;
}
