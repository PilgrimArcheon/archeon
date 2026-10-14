import { NextRequest } from "next/server";
import { currentAccount, validOrigin } from "@/features/auth/server";
import { calculateInvoice, invoiceReference, isInvoicePaid, receiptReference } from "@/features/invoice/models";
import { createInvoicePDF } from "@/features/invoice/pdf";
import { createReceiptPDF } from "@/features/invoice/receipt";
import { badId, database, fail, forbidden, loadCompany, loadInvoice, ok, unauthorized, unexpected } from "@/features/invoice/server";
import { GmailError, gmailSend } from "@/features/invoice/gmail";
export const runtime = "nodejs";
type Params = { params: Promise<{ id: string }> };
/** Sends only the signed-in workspace's saved invoice, from its connected Gmail account. */
export async function POST(req: NextRequest, { params }: Params) {
  if (!validOrigin(req)) return forbidden();
  let reservedLogId: number | null = null;
  try {
    const account = await currentAccount();
    if (!account) return unauthorized();
    const { id } = await params;
    if (badId(id)) return fail("Invalid invoice ID.");
    const invoice = await loadInvoice(id, account.workspaceId);
    if (!invoice) return fail("Invoice not found.", 404);
    if (!invoice.client.email) return fail("Add and save a client email address before sending.");
    const body: unknown = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return fail("Provide an email subject and message.");
    const { subject, message, documentType } = body as { subject?: unknown; message?: unknown; documentType?: unknown };
    if (documentType !== undefined && documentType !== "invoice" && documentType !== "receipt") return fail("Invalid document type.");
    const isReceipt = documentType === "receipt";
    if (isReceipt && !isInvoicePaid(invoice)) return fail("A payment receipt is available only after the final payment is recorded.", 409);
    if (typeof subject !== "string" || typeof message !== "string") return fail("Provide an email subject and message.");
    if (!subject.trim() || subject.length > 240 || /[\r\n]/.test(subject) || !message.trim() || message.length > 6000)
      return fail("Use a subject up to 240 characters and a message up to 6,000 characters.");
    const company = await loadCompany(account.workspaceId, account.email);
    const pdf = isReceipt ? await createReceiptPDF(invoice, company) : await createInvoicePDF(invoice, company);
    if (pdf.byteLength > 8_000_000) return fail("This PDF is too large to email.", 413);
    const sql = database();
    // Atomic daily quota per workspace, even across concurrent Vercel functions.
    const limitRows = await sql`INSERT INTO invoice_workspace_email_quota(workspace_id,day,attempts)
      VALUES(${account.workspaceId},CURRENT_DATE,1)
      ON CONFLICT(workspace_id,day) DO UPDATE SET attempts=invoice_workspace_email_quota.attempts+1
      RETURNING attempts`;
    if (Number(limitRows[0].attempts) > 25) return fail("Daily limit reached (25 PDF emails per workspace). Try tomorrow.", 429);
    // One reservation per document type per minute. The existing unique index
    // uses (workspace_id,invoice_id,send_window); receipts use the half-minute
    // marker, invoices use the minute marker. No schema migration required.
    const reservation = await sql`INSERT INTO invoice_workspace_email_log(workspace_id,invoice_id,recipient,delivery_status,detail,send_window)
      VALUES(${account.workspaceId},${invoice.id},${invoice.client.email},'reserved',${isReceipt ? 'gmail-receipt' : 'gmail-invoice'},
        DATE_TRUNC('minute',NOW()) + CASE WHEN ${isReceipt} THEN INTERVAL '30 seconds' ELSE INTERVAL '0 seconds' END)
      ON CONFLICT DO NOTHING RETURNING id`;
    if (!reservation.length) return fail("This document was just sent or is being sent. Check Gmail Sent before retrying.", 409);
    reservedLogId = Number(reservation[0].id);
    const messageId = await gmailSend(account.workspaceId, {
      from: "", // replaced using the connected Gmail identity in gmailSend
      to: invoice.client.email, subject, message, pdf: Uint8Array.from(pdf),
      filename: `${(isReceipt ? receiptReference(invoice) : invoiceReference(invoice)).replace(/[^a-zA-Z0-9_-]/g, "-")}.pdf`,
    });
    // Log provider acceptance before updating status: send may have succeeded even if DB update subsequently fails.
    await sql`UPDATE invoice_workspace_email_log SET delivery_status='accepted',detail=${`gmail:${messageId}`} WHERE id=${reservedLogId} AND workspace_id=${account.workspaceId}`;
    // An emailed receipt acknowledges payment; it is not a new invoice send.
    if (!isReceipt) {
      const timestamp = new Date().toISOString();
      await sql`UPDATE invoice_workspace_records SET
        data=jsonb_set(jsonb_set(data,'{status}','"sent"'::jsonb),'{sentAt}',to_jsonb(${timestamp}::text)),
        sent_at=NOW(),updated_at=NOW() WHERE id=${id} AND workspace_id=${account.workspaceId}`;
    }
    return ok({ sent: true, documentType: isReceipt ? "receipt" : "invoice", gmailMessageId: messageId, total: calculateInvoice(invoice).total });
  } catch (error) {
    // Don't mark the message failed after Gmail accepted it (DB update can fail).
    if (reservedLogId && error instanceof GmailError) {
      try {
        const sql = database();
        await sql`UPDATE invoice_workspace_email_log SET delivery_status='failed',detail='gmail_error' WHERE id=${reservedLogId} AND delivery_status='reserved'`;
      } catch { /* leave reservation for investigation */ }
    }
    if (error instanceof GmailError) return fail(error.message, error.status);
    return unexpected(error);
  }
}
