import { NextRequest, NextResponse } from "next/server";
import { currentAccount } from "@/features/auth/server";
import { badId, loadInvoice } from "@/features/invoice/server";
import { GmailError, gmailSettings, googleConsentUrl, makeCodeVerifier, makeState, sealGmailFlow } from "@/features/invoice/gmail";
export const runtime = "nodejs";
const FLOW_COOKIE = "archeon_gmail_oauth_flow";
const cookieOpts = { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/api/apps/invoice/gmail", maxAge: 600 };
export async function GET(req: NextRequest) {
  const account = await currentAccount().catch(() => null);
  if (!account) return NextResponse.redirect(new URL("/app/invoice", req.url));
  const invoiceId = req.nextUrl.searchParams.get("invoiceId") || "";
  const documentType = req.nextUrl.searchParams.get("document") === "receipt" ? "receipt" : "invoice";
  if (badId(invoiceId) || !(await loadInvoice(invoiceId, account.workspaceId))) return NextResponse.json({ error: "Choose a saved invoice to send." }, { status: 404 });
  try {
    gmailSettings();
    const state = makeState();
    const verifier = makeCodeVerifier();
    const redirect = NextResponse.redirect(googleConsentUrl(state, verifier));
    redirect.cookies.set(FLOW_COOKIE, sealGmailFlow({ state, verifier, userId: account.userId, invoiceId, issuedAt: Date.now(), documentType }), cookieOpts);
    return redirect;
  } catch (error) {
    const reason = error instanceof GmailError ? "setup" : "unavailable";
    return NextResponse.redirect(new URL(`/app/invoice/email/${invoiceId}?document=${documentType}&gmail=${reason}`, req.url));
  }
}
