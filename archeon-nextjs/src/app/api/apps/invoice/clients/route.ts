import { NextRequest } from "next/server";
import { currentAccount } from "@/features/auth/server";
import { clientSchema } from "@/features/invoice/models";
import { allowedOrigin, database, fail, forbidden, ok, unauthorized, unexpected } from "@/features/invoice/server";
export const runtime = "nodejs";
export async function POST(req: NextRequest) {
  if (!allowedOrigin(req)) return forbidden();
  try {
    const account = await currentAccount();
    if (!account) return unauthorized();
    const parsed = clientSchema.safeParse(await req.json());
    if (!parsed.success) return fail("Client must have a name and valid email.");
    const sql = database();
    await sql`INSERT INTO invoice_workspace_clients(id,workspace_id,data)
      VALUES(${parsed.data.id},${account.workspaceId},${JSON.stringify(parsed.data)}::jsonb)`;
    return ok(parsed.data, 201);
  } catch (err) { return unexpected(err); }
}
