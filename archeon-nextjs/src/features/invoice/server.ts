import { NextRequest, NextResponse } from "next/server";
import { database, validOrigin } from "@/features/auth/server";
import { Company, DEFAULT_COMPANY, Invoice, Client } from "./models";

export { database };
export const allowedOrigin = (request: NextRequest) => validOrigin(request);
export const ok = (data: unknown, status = 200) => NextResponse.json({ success: true, data, error: false }, { status, headers: { "Cache-Control": "no-store" } });
export const fail = (message: string, status = 400) => NextResponse.json({ success: false, data: null, error: { message } }, { status, headers: { "Cache-Control": "no-store" } });
export const unauthorized = () => fail("Please sign in to continue.", 401);
export const forbidden = () => fail("Request origin could not be verified.", 403);
export const badId = (id: string) => !/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(id);
export function unexpected(error: unknown) {
  console.error("Archeon Invoice server error", error);
  return fail("Something went wrong. Please try again later.", 500);
}

export async function loadCompany(workspaceId: string, ownerEmail: string): Promise<Company> {
  const sql = database();
  const rows = await sql`SELECT data FROM invoice_workspace_settings WHERE workspace_id=${workspaceId}`;
  return { ...DEFAULT_COMPANY, email: ownerEmail, ...(rows[0]?.data as Partial<Company> || {}) };
}
export async function saveCompany(workspaceId: string, settings: Company) {
  const sql = database();
  await sql`INSERT INTO invoice_workspace_settings(workspace_id,data)
    VALUES(${workspaceId},${JSON.stringify(settings)}::jsonb)
    ON CONFLICT(workspace_id) DO UPDATE SET data=EXCLUDED.data,updated_at=NOW()`;
}
export async function loadInvoices(workspaceId: string): Promise<Invoice[]> {
  const sql = database();
  const rows = await sql`SELECT data FROM invoice_workspace_records WHERE workspace_id=${workspaceId} ORDER BY updated_at DESC LIMIT 1000`;
  return rows.map(r => r.data as Invoice);
}
export async function loadClients(workspaceId: string): Promise<Client[]> {
  const sql = database();
  const rows = await sql`SELECT data FROM invoice_workspace_clients WHERE workspace_id=${workspaceId} ORDER BY created_at DESC LIMIT 1000`;
  return rows.map(r => r.data as Client);
}
export async function loadInvoice(id: string, workspaceId: string): Promise<Invoice | null> {
  const sql = database();
  const rows = await sql`SELECT data FROM invoice_workspace_records WHERE id=${id} AND workspace_id=${workspaceId}`;
  return rows[0]?.data as Invoice || null;
}
export async function saveInvoice(invoice: Invoice, workspaceId: string, fresh = false): Promise<Invoice> {
  const sql = database();
  if (fresh) {
    // Counter belongs to the workspace; separate creators can both issue INV-2026-0001.
    const seq = await sql`INSERT INTO invoice_workspace_counters(workspace_id,next_no) VALUES(${workspaceId},1)
      ON CONFLICT(workspace_id) DO UPDATE SET next_no=invoice_workspace_counters.next_no+1 RETURNING next_no`;
    const number = Number(seq[0].next_no);
    invoice = { ...invoice, invoiceNo: `INV-${new Date().getFullYear()}-${String(number).padStart(4, "0")}`, status: "draft", sentAt: "" };
    await sql`INSERT INTO invoice_workspace_records(id,workspace_id,invoice_no,data)
      VALUES(${invoice.id},${workspaceId},${invoice.invoiceNo},${JSON.stringify(invoice)}::jsonb)`;
  } else {
    const result = await sql`UPDATE invoice_workspace_records
      SET data=${JSON.stringify(invoice)}::jsonb,updated_at=NOW()
      WHERE id=${invoice.id} AND invoice_no=${invoice.invoiceNo} AND workspace_id=${workspaceId}
      RETURNING id`;
    if (!result.length) throw new Error("Invoice was not found or invoice number changed.");
  }
  return invoice;
}
