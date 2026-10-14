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
    return json({ data: result[0]?.content ?? null, revision: Number(result[0]?.revision ?? 0), accountId: user.userId });
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
    // Revision 0 creates the document; positive revisions update the existing row.
    // IMPORTANT: an INSERT ... SELECT with `WHERE baseRevision=0` cannot reach
    // ON CONFLICT for later saves, since SELECT produces NO row when baseRevision>0.
    // Each branch is a single atomic compare-and-swap statement.
    const encoded = JSON.stringify(validated);
    const expected = baseRevision as number;
    const result = expected === 0
      ? await sql`INSERT INTO tack_sync_documents (user_id, content, revision)
          VALUES (${user.userId}, ${encoded}::jsonb, 1)
          ON CONFLICT (user_id) DO NOTHING
          RETURNING revision`
      : await sql`UPDATE tack_sync_documents
          SET content=${encoded}::jsonb,
              revision=revision+1,
              updated_at=NOW()
          WHERE user_id=${user.userId} AND revision=${expected}
          RETURNING revision`;
    if (!result.length) {
      const latest = await sql`SELECT revision,content FROM tack_sync_documents WHERE user_id=${user.userId}`;
      return json({ error: "Cloud board changed on another device.", revision: Number(latest[0]?.revision ?? 0), data: latest[0]?.content ?? null, accountId: user.userId }, 409);
    }
    return json({ revision: Number(result[0].revision), saved: true, accountId: user.userId });
  } catch (error) { return authProblem(error); }
}
