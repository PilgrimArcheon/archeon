import { NextRequest } from "next/server";
import { randomBytes } from "node:crypto";
import { currentAccount, database, json, validOrigin, authProblem } from "@/features/auth/server";
import { tokenHash } from "@/features/tackboard/server/sync";
export const runtime = "nodejs";

export async function GET() {
  try {
    const account = await currentAccount();
    if (!account) return json({ error: "Sign in to manage companion devices." }, 401);
    const sql = database();
    const rows = await sql`SELECT token_hash, label, created_at, expires_at FROM tack_extension_tokens
      WHERE user_id=${account.userId} AND revoked_at IS NULL AND expires_at>NOW() ORDER BY created_at DESC LIMIT 10`;
    return json({ devices: rows.map(r => ({ id: String(r.token_hash).slice(0, 16), label: r.label, createdAt: r.created_at, expiresAt: r.expires_at })) });
  } catch (error) { return authProblem(error); }
}
export async function POST(req: NextRequest) {
  if (!validOrigin(req)) return json({ error: "Invalid request origin." }, 403);
  try {
    const account = await currentAccount();
    if (!account) return json({ error: "Sign in first." }, 401);
    const body = await req.json().catch(() => ({}));
    const label = typeof body?.label === "string" ? body.label.trim().slice(0, 60) : "TackBoard Desktop";
    const sql = database();
    const token = `tb_${randomBytes(32).toString("base64url")}`;
    // Lock the owner row in the same transaction as the quota check + insert.
    // Concurrent creation requests therefore cannot exceed four paired devices.
    const [locked, inserted] = await sql.transaction([
      sql`SELECT id FROM archeon_users WHERE id=${account.userId} FOR UPDATE`,
      sql`INSERT INTO tack_extension_tokens(token_hash,user_id,label,expires_at)
        SELECT ${tokenHash(token)}, ${account.userId}, ${label || "TackBoard Desktop"}, NOW()+INTERVAL '90 days'
        WHERE (SELECT count(*) FROM tack_extension_tokens
          WHERE user_id=${account.userId} AND revoked_at IS NULL AND expires_at>NOW()) < 4
        RETURNING token_hash`,
    ]);
    if (!locked.length || !inserted.length) return json({ error: "Limit of four paired devices reached. Revoke an old device first." }, 409);
    return json({ token, expiresInDays: 90 }, 201);
  } catch (error) { return authProblem(error); }
}
export async function DELETE(req: NextRequest) {
  if (!validOrigin(req)) return json({ error: "Invalid request origin." }, 403);
  try {
    const account = await currentAccount();
    if (!account) return json({ error: "Sign in first." }, 401);
    const body = await req.json().catch(() => ({}));
    if (!/^[0-9a-f]{16}$/.test(body?.id ?? "")) return json({ error: "Invalid device." }, 400);
    const sql = database();
    const rows = await sql`UPDATE tack_extension_tokens SET revoked_at=NOW()
      WHERE user_id=${account.userId} AND left(token_hash,16)=${body.id} AND revoked_at IS NULL RETURNING token_hash`;
    return json({ revoked: rows.length > 0 });
  } catch (error) { return authProblem(error); }
}
