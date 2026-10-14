import { NextRequest } from "next/server";
import { currentAccount } from "@/features/auth/server";
import { calculateInvoice, invoiceSchema, isInvoicePaid } from "@/features/invoice/models";
import { allowedOrigin, badId, database, fail, forbidden, loadInvoice, ok, saveInvoice, unauthorized, unexpected } from "@/features/invoice/server";
export const runtime = "nodejs";
type Params = { params: Promise<{ id: string }> };
export async function PUT(req: NextRequest, { params }: Params) {
  if (!allowedOrigin(req)) return forbidden();
  try {
    const account = await currentAccount();
    if (!account) return unauthorized();
    const { id } = await params;
    if (badId(id)) return fail("Invalid invoice ID.");
    const parsed = invoiceSchema.safeParse(await req.json());
    if (!parsed.success || parsed.data.id !== id) return fail("Invoice contains invalid fields.");
    const existing = await loadInvoice(id, account.workspaceId);
    if (!existing) return fail("Invoice not found.", 404);
    if (parsed.data.invoiceNo !== existing.invoiceNo) return fail("Invoice number cannot be changed.");
    if (parsed.data.paidAmount > calculateInvoice(parsed.data).total) return fail("Amount received exceeds the total.");
    // Only the server may set payment completion timestamps. Legacy paid records
    // without a timestamp stay undated rather than inventing a historical payment date.
    const paidAt = !isInvoicePaid(parsed.data) ? "" : isInvoicePaid(existing)
      ? (existing.paidAt || "") : new Date().toISOString();
    const saved = await saveInvoice({ ...parsed.data, status: existing.status, sentAt: existing.sentAt, paidAt }, account.workspaceId);
    return ok(saved);
  } catch (err) { return unexpected(err); }
}
export async function DELETE(req: NextRequest, { params }: Params) {
  if (!allowedOrigin(req)) return forbidden();
  try {
    const account = await currentAccount();
    if (!account) return unauthorized();
    const { id } = await params;
    if (badId(id)) return fail("Invalid invoice ID.");
    const sql = database();
    const rows = await sql`DELETE FROM invoice_workspace_records
      WHERE id=${id} AND workspace_id=${account.workspaceId} RETURNING id`;
    if (!rows.length) return fail("Invoice not found.", 404);
    return ok({ deleted: true });
  } catch (err) { return unexpected(err); }
}
