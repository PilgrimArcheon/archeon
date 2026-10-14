// Compatibility route for the Invoice Studio client. Auth is shared by every Archeon app.
import { currentAccount } from "@/features/auth/server";
import { ok } from "@/features/invoice/server";
export const runtime = "nodejs";
export async function GET() {
  try {
    const account = await currentAccount();
    return ok({ signedIn: !!account, email: account?.email || null });
  } catch (err) {
    console.error("Invoice account status is unavailable", err);
    return ok({ signedIn: false, email: null, accountsUnavailable: true });
  }
}
