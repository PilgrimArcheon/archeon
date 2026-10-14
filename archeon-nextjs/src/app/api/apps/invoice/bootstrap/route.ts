import { currentAccount } from "@/features/auth/server";
import { loadClients, loadCompany, loadInvoices, ok, unauthorized, unexpected } from "@/features/invoice/server";
export const runtime = "nodejs";
export async function GET() {
  try {
    const account = await currentAccount();
    if (!account) return unauthorized();
    const [company, clients, invoices] = await Promise.all([
      loadCompany(account.workspaceId, account.email), loadClients(account.workspaceId), loadInvoices(account.workspaceId),
    ]);
    return ok({ company, clients, invoices, accountEmail: account.email });
  } catch (err) { return unexpected(err); }
}
