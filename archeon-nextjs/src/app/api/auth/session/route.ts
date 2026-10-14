import { NextRequest } from "next/server";
import { authProblem, clearCookie, currentAccount, json, revokeSession, validOrigin } from "@/features/auth/server";
export const runtime = "nodejs";
export async function GET() {
  try { const account = await currentAccount(); return json({ signedIn: !!account, email: account?.email || null, userId: account?.userId || null }); }
  catch (err) { return authProblem(err); }
}
export async function DELETE(req: NextRequest) {
  if (!validOrigin(req)) return json({ error: "Invalid request origin." }, 403);
  try { await revokeSession(); const res = json({ signedIn: false }); clearCookie(res); return res; }
  catch (err) { return authProblem(err); }
}
