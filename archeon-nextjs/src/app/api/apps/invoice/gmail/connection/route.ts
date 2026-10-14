import { currentAccount } from "@/features/auth/server";
import { unauthorized, unexpected, ok } from "@/features/invoice/server";
import { gmailConnection, gmailSettings, GmailError } from "@/features/invoice/gmail";
export const runtime = "nodejs";
export async function GET() {
  try {
    const account = await currentAccount();
    if (!account) return unauthorized();
    let configured = true;
    try { gmailSettings(); } catch (error) { if (error instanceof GmailError) configured = false; else throw error; }
    if (!configured) return ok({ configured: false, connected: false, email: null });
    const connected = await gmailConnection(account.workspaceId);
    return ok({ configured: true, connected: !!connected, email: connected?.email || null });
  } catch (e) { return unexpected(e); }
}
