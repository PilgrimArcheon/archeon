import { NextRequest } from "next/server";
import { currentAccount } from "@/features/auth/server";
import { calculateInvoice, invoiceSchema, isInvoicePaid } from "@/features/invoice/models";
import { allowedOrigin, fail, forbidden, ok, saveInvoice, unauthorized, unexpected } from "@/features/invoice/server";
export const runtime = "nodejs";
export async function POST(req: NextRequest) {
  if (!allowedOrigin(req)) return forbidden();
  try {
    const account = await currentAccount();
    if (!account) return unauthorized();
    const parsed = invoiceSchema.safeParse(await req.json());
    if (!parsed.success) return fail("Invoice contains invalid or missing fields.");
    const invoice = parsed.data;
    if (invoice.invoiceNo) return fail("Invoice numbers are assigned automatically.");
    if (invoice.paidAmount > calculateInvoice(invoice).total) return fail("Amount received cannot exceed the invoice total.");
    const saved = await saveInvoice({ ...invoice, paidAt: isInvoicePaid(invoice) ? new Date().toISOString() : "" }, account.workspaceId, true);
    return ok(saved, 201);
  } catch (err) { return unexpected(err); }
}
