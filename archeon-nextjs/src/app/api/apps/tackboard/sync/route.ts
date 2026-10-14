import { NextRequest } from "next/server";
import { database, json, validOrigin, authProblem } from "@/features/auth/server";
import { parseTackDocument, tackIdentity } from "@/features/tackboard/server/sync";

export const runtime = "nodejs";
export async function GET(req: NextRequest) {
  try {
    const user = await tackIdentity(req);
    if (!user) return json({ error: "Sign in to sync TackBoard." }, 401);
    const sql = database();
    const result = await sql`SELECT content, revision FROM tack_sync_documents WHERE user_id=${user.userId}`;
    return json({ data: result[0]?.content ?? null, revision: Number(result[0]?.revision ?? 0) });
  } catch (error) { return authProblem(error); }
}
export async function PUT(req: NextRequest) {
  try {
    const user = await tackIdentity(req);
    if (!user) return json({ error: "Sign in to sync TackBoard." }, 401);
    if (!user.companion && !validOrigin(req)) return json({ error: "Invalid request origin." }, 403);
    if (Number(req.headers.get("content-length") || 0) > 1_600_000) return json({ error: "Board too large." }, 413);
    const raw = await req.text();
    if (raw.length > 1_600_000) return json({ error: "Board too large." }, 413);
    let body: { baseRevision?: unknown; data?: unknown };
    try { body = JSON.parse(raw); } catch { return json({ error: "Invalid JSON." }, 400); }
    const baseRevision = body.baseRevision;
    if (!Number.isSafeInteger(baseRevision) || (baseRevision as number) < 0) return json({ error: "Invalid revision." }, 400);
    const validated = parseTackDocument(body.data);
    if (!validated) return json({ error: "Invalid TackBoard data." }, 400);
    const sql = database();
    // A single atomic CAS protects against silent overwrites by another browser or extension.
    // First writer creates revision 1; later writers must provide the exact current revision.
    const result = await sql`INSERT INTO tack_sync_documents(user_id, content, revision)
      SELECT ${user.userId}, ${JSON.stringify(validated)}::jsonb, 1 WHERE ${baseRevision as number}=0
      ON CONFLICT(user_id) DO UPDATE SET
        content=EXCLUDED.content, revision=tack_sync_documents.revision+1, updated_at=NOW()
      WHERE tack_sync_documents.revision=${baseRevision as number}
      RETURNING revision`;
    if (!result.length) {
      const latest = await sql`SELECT revision,content FROM tack_sync_documents WHERE user_id=${user.userId}`;
      return json({ error: "Cloud board changed on another device.", revision: Number(latest[0]?.revision ?? 0), data: latest[0]?.content ?? null }, 409);
    }
    return json({ revision: Number(result[0].revision), saved: true });
  } catch (error) { return authProblem(error); }
}
