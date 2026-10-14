import { currentAccount } from "@/features/auth/server";
import { isInvoicePaid, receiptReference } from "@/features/invoice/models";
import { createReceiptPDF } from "@/features/invoice/receipt";
import { badId, fail, loadCompany, loadInvoice, unauthorized, unexpected } from "@/features/invoice/server";

export const runtime = "nodejs";
type Params = { params: Promise<{ id: string }> };

/** Saved, fully paid invoices only. Never expose another workspace's receipts. */
export async function GET(_: Request, { params }: Params) {
  try {
    const account = await currentAccount();
    if (!account) return unauthorized();
    const { id } = await params;
    if (badId(id)) return fail("Invalid invoice ID.");
    const invoice = await loadInvoice(id, account.workspaceId);
    if (!invoice) return fail("Invoice not found.", 404);
    if (!isInvoicePaid(invoice)) return fail("Record the final payment before downloading a receipt.", 409);
    const pdf = await createReceiptPDF(invoice, await loadCompany(account.workspaceId, account.email));
    return new Response(Uint8Array.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "X-Content-Type-Options": "nosniff",
        "Content-Disposition": `attachment; filename="${receiptReference(invoice).replace(/[^a-zA-Z0-9_-]/g, "-")}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) { return unexpected(error); }
}
