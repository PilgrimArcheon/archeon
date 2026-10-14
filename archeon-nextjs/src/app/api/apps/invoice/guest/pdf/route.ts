import { NextRequest } from "next/server";
import { z } from "zod";
import { calculateInvoice, companySchema, invoiceSchema } from "@/features/invoice/models";
import { createInvoicePDF } from "@/features/invoice/pdf";
import { allowedOrigin, fail, forbidden, unexpected } from "@/features/invoice/server";

export const runtime = "nodejs";
export const maxDuration = 15;
const pdfPayload = z.object({ invoice: invoiceSchema, company: companySchema });

// Anonymous PDF generation is deliberately stateless: never write guest data to Neon.
// Protection against sustained abuse must also be configured at the Vercel edge / WAF.
export async function POST(req: NextRequest) {
  if (!allowedOrigin(req)) return forbidden();
  if (!req.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return fail("Expected a JSON invoice.", 415);
  const len = Number(req.headers.get("content-length") || 0);
  if (len > 64000) return fail("Invoice is too large.", 413);
  try {
    const raw = await req.text();
    if (raw.length > 64000) return fail("Invoice is too large.", 413);
    const parsed = pdfPayload.safeParse(JSON.parse(raw));
    if (!parsed.success) return fail("Check your sender, client, and line item details.");
    if (parsed.data.invoice.paidAmount > calculateInvoice(parsed.data.invoice).total) {
      return fail("Amount received cannot exceed the invoice total.");
    }
    const pdf = await createInvoicePDF(parsed.data.invoice, parsed.data.company);
    return new Response(Uint8Array.from(pdf), {
      status: 200,
      headers: { "Content-Type": "application/pdf", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", "Content-Disposition": "inline; filename=invoice-preview.pdf" },
    });
  } catch (e) { return e instanceof SyntaxError ? fail("Invalid invoice data.") : unexpected(e); }
}
