import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { currentAccount } from "@/features/auth/server";
import { badId } from "@/features/invoice/server";
import { exchangeCode, googleAccountEmail, saveGmailConnection, openGmailFlow, GmailError } from "@/features/invoice/gmail";
export const runtime = "nodejs";
const FLOW_COOKIE = "archeon_gmail_oauth_flow";
export async function GET(req: NextRequest) {
  const flowValue = req.cookies.get(FLOW_COOKIE)?.value;
  // Every exit clears the short-lived OAuth cookies; failed connections never persist tokens.
  const flow = flowValue ? openGmailFlow(flowValue) : null;
  const invoiceId = flow?.invoiceId && !badId(flow.invoiceId) ? flow.invoiceId : "";
  const finish = (status: string) => {
    const res = NextResponse.redirect(new URL(invoiceId ? `/app/invoice/email/${invoiceId}?document=${flow?.documentType === "receipt" ? "receipt" : "invoice"}&gmail=${status}` : "/app/invoice", req.url));
    res.cookies.set(FLOW_COOKIE, "", { path: "/api/apps/invoice/gmail", maxAge: 0 });
    return res;
  };
  const state = req.nextUrl.searchParams.get("state") || "";
  const code = req.nextUrl.searchParams.get("code") || "";
  if (!flow || !state || !code || !flow.state || !flow.verifier || !invoiceId || req.nextUrl.searchParams.has("error")) return finish("cancelled");
  const left = Buffer.from(state);
  const right = Buffer.from(flow.state);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return finish("invalid-state");
  const account = await currentAccount().catch(() => null);
  if (!account || flow.userId !== account.userId) return finish("session");
  let stage: "token" | "identity" | "database" = "token";
  try {
    const tokens = await exchangeCode(code, flow.verifier);
    stage = "identity";
    const email = await googleAccountEmail(tokens.accessToken);
    stage = "database";
    await saveGmailConnection(account.workspaceId, email, tokens.refreshToken);
    return finish("connected");
  } catch (error) {
    // Structured, safe diagnostics; never print OAuth codes, credentials, or refresh tokens.
    const dbCode = error && typeof error === "object" && "code" in error ? String(error.code) : undefined;
    console.error("Archeon Gmail connection failed", {
      stage,
      kind: error instanceof Error ? error.name : "unknown",
      reason: error instanceof GmailError ? error.reason : undefined,
      dbCode,
      message: error instanceof GmailError ? error.message : undefined,
    });
    if (error instanceof GmailError) {
      if (error.reason === "permission") return finish("permission");
      if (error.reason === "refresh-token") return finish("refresh-token");
      if (error.reason === "identity") return finish("identity");
      return finish("google-error");
    }
    if (stage === "database" && (dbCode === "42P01" || dbCode === "42703")) return finish("database-schema");
    return finish("failed");
  }
}
