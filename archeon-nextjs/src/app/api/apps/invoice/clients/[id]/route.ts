import { NextRequest } from "next/server";
import { currentAccount } from "@/features/auth/server";
import { clientSchema } from "@/features/invoice/models";
import { allowedOrigin, badId, database, fail, forbidden, ok, unauthorized, unexpected } from "@/features/invoice/server";
export const runtime = "nodejs";
type Params = { params: Promise<{ id: string }> };
export async function PUT(req: NextRequest, { params }: Params) {
  if (!allowedOrigin(req)) return forbidden();
  try {
    const account = await currentAccount();
    if (!account) return unauthorized();
    const { id } = await params;
    if (badId(id)) return fail("Invalid client ID.");
    const parsed = clientSchema.safeParse(await req.json());
    if (!parsed.success || parsed.data.id !== id) return fail("Invalid client details.");
    const sql = database();
    const rows = await sql`UPDATE invoice_workspace_clients SET data=${JSON.stringify(parsed.data)}::jsonb,updated_at=NOW()
      WHERE id=${id} AND workspace_id=${account.workspaceId} RETURNING id`;
    if (!rows.length) return fail("Client not found.", 404);
    return ok(parsed.data);
  } catch (err) { return unexpected(err); }
}
export async function DELETE(req: NextRequest, { params }: Params) {
  if (!allowedOrigin(req)) return forbidden();
  try {
    const account = await currentAccount();
    if (!account) return unauthorized();
    const { id } = await params;
    if (badId(id)) return fail("Invalid client ID.");
    const sql = database();
    const rows = await sql`DELETE FROM invoice_workspace_clients WHERE id=${id} AND workspace_id=${account.workspaceId} RETURNING id`;
    if (!rows.length) return fail("Client not found.", 404);
    return ok({ deleted: true });
  } catch (err) { return unexpected(err); }
}
