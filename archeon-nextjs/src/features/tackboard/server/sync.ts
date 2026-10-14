import "server-only";
import { createHash } from "node:crypto";
import { NextRequest } from "next/server";
import { currentAccount, database } from "@/features/auth/server";
import { readStore, type TackboardData } from "@/features/tackboard/model";

const tokenHash = (token: string) => createHash("sha256").update(token).digest("hex");

/** Browser companion tokens grant TackBoard sync only. Never use for general Archeon auth. */
export async function tackIdentity(req: NextRequest) {
  const header = req.headers.get("authorization");
  if (header) {
    const match = /^Bearer (tb_[A-Za-z0-9_-]{40,100})$/.exec(header);
    if (!match) return null;
    const sql = database();
    const result = await sql`SELECT user_id FROM tack_extension_tokens
      WHERE token_hash=${tokenHash(match[1])} AND revoked_at IS NULL AND expires_at>NOW()`;
    if (!result.length) return null;
    // Avoid a DB write for every read; activity is not used as a credential check.
    return { userId: String(result[0].user_id), companion: true };
  }
  const user = await currentAccount();
  return user ? { userId: user.userId, companion: false } : null;
}

export function parseTackDocument(input: unknown): TackboardData | null {
  if (!input || typeof input !== "object") return null;
  let raw: string;
  try { raw = JSON.stringify(input); } catch { return null; }
  return readStore(raw);
}
export { tokenHash };
