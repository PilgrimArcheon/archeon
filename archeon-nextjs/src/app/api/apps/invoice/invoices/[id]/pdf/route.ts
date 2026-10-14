import { currentAccount } from "@/features/auth/server";
import { badId, fail, loadCompany, loadInvoice, unauthorized, unexpected } from "@/features/invoice/server";
import { createInvoicePDF } from "@/features/invoice/pdf";
export const runtime = "nodejs";
type Params = { params: Promise<{ id: string }> };
export async function GET(_: Request, { params }: Params) {
  try {
    const account = await currentAccount();
    if (!account) return unauthorized();
    const { id } = await params;
    if (badId(id)) return fail("Invalid invoice ID.");
    const invoice = await loadInvoice(id, account.workspaceId);
    if (!invoice) return fail("Invoice not found.", 404);
    const pdf = await createInvoicePDF(invoice, await loadCompany(account.workspaceId, account.email));
    return new Response(Uint8Array.from(pdf), {
      headers: {
        "Content-Type": "application/pdf", "X-Content-Type-Options": "nosniff",
        "Content-Disposition": `attachment; filename="${invoice.invoiceNo}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) { return unexpected(err); }
}
