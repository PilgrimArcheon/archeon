import { NextRequest } from "next/server";
import { currentAccount } from "@/features/auth/server";
import { calculateInvoice, type Invoice } from "@/features/invoice/models";
import { allowedOrigin, badId, database, fail, forbidden, loadInvoice, ok, unauthorized, unexpected } from "@/features/invoice/server";

export const runtime = "nodejs";
type Params = { params: Promise<{ id: string }> };
type Action = "mark_sent" | "mark_unsent" | "record_payment" | "mark_paid";

/** Manual bookkeeping only. This endpoint never sends an email or charges a customer. */
export async function POST(req: NextRequest, { params }: Params) {
  if (!allowedOrigin(req)) return forbidden();
  try {
    const account = await currentAccount();
    if (!account) return unauthorized();
    const { id } = await params;
    if (badId(id)) return fail("Invalid invoice ID.");
    const body: unknown = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return fail("Invalid action.");
    const { action, amount } = body as { action?: Action; amount?: unknown };
    if (!["mark_sent", "mark_unsent", "record_payment", "mark_paid"].includes(action ?? ""))
      return fail("Unknown tracking action.");

    const original = await loadInvoice(id, account.workspaceId);
    if (!original) return fail("Invoice not found.", 404);
    const updated: Invoice = { ...original };
    const total = calculateInvoice(original).total;
    const received = original.paidAmount;
    const round = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

    if (action === "mark_sent") {
      if (original.status === "sent") return ok(original);
      updated.status = "sent";
      updated.sentAt = new Date().toISOString();
    } else if (action === "mark_unsent") {
      if (original.status !== "sent") return ok(original);
      updated.status = "draft";
      updated.sentAt = "";
    } else if (action === "mark_paid") {
      if (total <= 0) return fail("An invoice needs a positive total to be marked paid.");
      if (round(received) >= round(total)) return ok(original);
      updated.paidAmount = round(total);
    } else if (action === "record_payment") {
      if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0 || amount > 10_000_000_000 || Math.abs(Math.round(amount * 100) - amount * 100) > 0.0000001)
        return fail("Enter a valid payment amount with at most two decimal places.");
      if (round(received + amount) > round(total)) return fail("This payment would exceed the outstanding invoice balance.");
      updated.paidAmount = round(received + amount);
    }

    // Timestamp the transition to fully paid, including the final partial payment.
    // Never overwrite the original completion date on repeated updates.
    const fullyPaid = total > 0 && round(updated.paidAmount) >= round(total);
    updated.paidAt = fullyPaid ? (original.paidAt || new Date().toISOString()) : "";

    const sql = database();
    // Optimistic concurrency: avoid silently dropping edits or double-counting a
    // payment when two requests update the same invoice at once.
    const rows = await sql`UPDATE invoice_workspace_records
       SET data=${JSON.stringify(updated)}::jsonb, updated_at=NOW()
       WHERE id=${id} AND workspace_id=${account.workspaceId}
         AND data=${JSON.stringify(original)}::jsonb
       RETURNING data`;
    if (!rows.length) return fail("This invoice changed. Refresh and try again.", 409);
    return ok(rows[0].data as Invoice);
  } catch (err) { return unexpected(err); }
}
