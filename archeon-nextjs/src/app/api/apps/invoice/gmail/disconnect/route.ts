import { NextRequest } from "next/server";
import { currentAccount, validOrigin } from "@/features/auth/server";
import { forbidden, ok, unauthorized, unexpected } from "@/features/invoice/server";
import { revokeRefreshToken, unlinkGmail } from "@/features/invoice/gmail";
export const runtime = "nodejs";
export async function POST(req: NextRequest) {
  if (!validOrigin(req)) return forbidden();
  try {
    const account = await currentAccount();
    if (!account) return unauthorized();
    const token = await unlinkGmail(account.workspaceId);
    if (token) await revokeRefreshToken(token);
    return ok({ disconnected: true });
  } catch (e) { return unexpected(e); }
}
