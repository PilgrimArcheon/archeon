/** Gmail send-only OAuth integration. All access tokens and refresh tokens stay server-side. */
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { database } from "@/features/auth/server";

export const GMAIL_SEND_SCOPE = "https://www.googleapis.com/auth/gmail.send";
const GOOGLE_AUTHORIZE = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN = "https://oauth2.googleapis.com/token";

export class GmailError extends Error {
  constructor(message: string, public status = 400, public reason = "gmail-error") { super(message); this.name = "GmailError"; }
}

export function gmailSettings() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const root = process.env.ARCHEON_PUBLIC_URL?.replace(/\/$/, "");
  const encryption = process.env.ARCHEON_GMAIL_ENCRYPTION_KEY;
  if (!clientId || !clientSecret || !root || !encryption) throw new GmailError("Gmail connection is not yet configured by Archeon.", 503);
  let appUrl: URL;
  try { appUrl = new URL(root); } catch { throw new GmailError("Gmail connection URL is invalid.", 503); }
  if (appUrl.pathname !== "/" || (appUrl.protocol !== "https:" && !(appUrl.protocol === "http:" && appUrl.hostname === "localhost")))
    throw new GmailError("Gmail connection URL must be the site origin.", 503);
  if (!/^[a-f0-9]{64}$/i.test(encryption)) throw new GmailError("Gmail encryption key must be 64 hexadecimal characters.", 503);
  return { clientId, clientSecret, redirectUri: `${appUrl.origin}/api/apps/invoice/gmail/callback`, encryptionKey: Buffer.from(encryption, "hex") };
}

/** Opaque, authenticated OAuth state cookie bound to the originating app account. */
export type GmailFlow = { state: string; verifier: string; userId: string; invoiceId: string; issuedAt: number; documentType?: "receipt" | "invoice" };
export function sealGmailFlow(flow: GmailFlow) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", gmailSettings().encryptionKey, iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(flow), "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), encrypted].map(buf=>buf.toString("base64url")).join(".");
}
export function openGmailFlow(value: string): GmailFlow | null {
  try {
    const [iv,tag,payload] = value.split(".");
    if (!iv || !tag || !payload) return null;
    const decipher = createDecipheriv("aes-256-gcm", gmailSettings().encryptionKey, Buffer.from(iv,"base64url"));
    decipher.setAuthTag(Buffer.from(tag,"base64url"));
    const result = JSON.parse(Buffer.concat([decipher.update(Buffer.from(payload,"base64url")),decipher.final()]).toString("utf8")) as GmailFlow;
    if (!result.issuedAt || Date.now() - result.issuedAt > 600_000 || result.issuedAt > Date.now() + 60_000) return null;
    if (typeof result.state !== "string" || typeof result.verifier !== "string" || typeof result.userId !== "string" || typeof result.invoiceId !== "string") return null;
    return result;
  } catch { return null; }
}

export function makeCodeVerifier() { return randomBytes(32).toString("base64url"); }
export function makeState() { return randomBytes(32).toString("base64url"); }
export function googleConsentUrl(state: string, verifier: string) {
  const cfg = gmailSettings();
  const params = new URLSearchParams({
    client_id: cfg.clientId, redirect_uri: cfg.redirectUri, response_type: "code",
    scope: `openid email ${GMAIL_SEND_SCOPE}`,
    access_type: "offline", prompt: "consent select_account", state,
    code_challenge_method: "S256", code_challenge: createHash("sha256").update(verifier).digest("base64url"),
  });
  return `${GOOGLE_AUTHORIZE}?${params}`;
}

export async function exchangeCode(code: string, verifier: string) {
  const cfg = gmailSettings();
  const res = await fetch(GOOGLE_TOKEN, {
    method: "POST", cache: "no-store", signal: AbortSignal.timeout(15000),
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ code, code_verifier: verifier, client_id: cfg.clientId, client_secret: cfg.clientSecret,
      redirect_uri: cfg.redirectUri, grant_type: "authorization_code" }),
  });
  const data = await res.json() as { access_token?: string; refresh_token?: string; scope?: string; error?: string };
  if (!res.ok || !data.access_token) {
    // Never log the authorization code, access token or Google client secret.
    throw new GmailError("Google could not finish authorization. Try connecting again.", 502, "token-exchange");
  }
  // Google permits users to grant identity scopes but decline Gmail sending separately.
  const grantedScopes = (data.scope || "").split(/\s+/).filter(Boolean);
  if (!grantedScopes.includes(GMAIL_SEND_SCOPE)) {
    throw new GmailError("Google granted basic account access but not permission to send email. Reconnect and approve 'Send email on your behalf'.", 403, "permission");
  }
  if (!data.refresh_token) {
    throw new GmailError("Google did not provide an offline refresh token. Reconnect Gmail and approve access again.", 400, "refresh-token");
  }
  return { accessToken: data.access_token, refreshToken: data.refresh_token };
}

export async function googleAccountEmail(accessToken: string) {
  const res = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store", signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new GmailError("Could not verify the connected Google account.", 502, "identity");
  const data = await res.json() as { email?: string; email_verified?: boolean };
  if (!data.email || !data.email_verified || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
    throw new GmailError("Connect a Google account with a verified email address.", 400, "identity");
  return data.email.toLowerCase();
}

export function encryptRefreshToken(token: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", gmailSettings().encryptionKey, iv);
  const ciphertext = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), ciphertext].map(v => v.toString("base64url")).join(".");
}
export function decryptRefreshToken(payload: string) {
  const [iv, tag, content] = payload.split(".");
  if (!iv || !tag || !content) throw new GmailError("Saved Gmail credentials are invalid. Disconnect and reconnect.", 401);
  try {
    const decipher = createDecipheriv("aes-256-gcm", gmailSettings().encryptionKey, Buffer.from(iv, "base64url"));
    decipher.setAuthTag(Buffer.from(tag, "base64url"));
    return Buffer.concat([decipher.update(Buffer.from(content, "base64url")), decipher.final()]).toString("utf8");
  } catch { throw new GmailError("Could not decrypt Gmail credentials. Reconnect your account.", 401); }
}

export async function saveGmailConnection(workspaceId: string, email: string, refreshToken: string) {
  const sql = database();
  const encrypted = encryptRefreshToken(refreshToken);
  await sql`INSERT INTO invoice_workspace_gmail_connections(workspace_id,email,refresh_token_encrypted)
    VALUES(${workspaceId},${email},${encrypted})
    ON CONFLICT(workspace_id) DO UPDATE SET email=EXCLUDED.email,refresh_token_encrypted=EXCLUDED.refresh_token_encrypted,updated_at=NOW()`;
}
export async function gmailConnection(workspaceId: string) {
  const sql = database();
  const rows = await sql`SELECT email,refresh_token_encrypted FROM invoice_workspace_gmail_connections WHERE workspace_id=${workspaceId}`;
  return rows.length ? { email: String(rows[0].email), encrypted: String(rows[0].refresh_token_encrypted) } : null;
}
export async function unlinkGmail(workspaceId: string) {
  const sql = database();
  const rows = await sql`DELETE FROM invoice_workspace_gmail_connections WHERE workspace_id=${workspaceId} RETURNING refresh_token_encrypted`;
  return rows[0]?.refresh_token_encrypted ? String(rows[0].refresh_token_encrypted) : null;
}
export async function revokeRefreshToken(encrypted: string) {
  try {
    const token = decryptRefreshToken(encrypted);
    await fetch("https://oauth2.googleapis.com/revoke", {
      method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ token }), cache: "no-store", signal: AbortSignal.timeout(8000),
    });
  } catch (e) { console.error("Gmail token revocation could not be confirmed", e instanceof Error ? e.name : "unknown"); }
}

async function gmailAccessToken(encrypted: string) {
  const cfg = gmailSettings();
  const response = await fetch(GOOGLE_TOKEN, {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, cache: "no-store", signal: AbortSignal.timeout(15000),
    body: new URLSearchParams({ client_id: cfg.clientId, client_secret: cfg.clientSecret,
      refresh_token: decryptRefreshToken(encrypted), grant_type: "refresh_token" }),
  });
  const token = await response.json() as { access_token?: string; error?: string };
  if (!response.ok || !token.access_token) {
    if (token.error === "invalid_grant") throw new GmailError("Gmail access expired. Disconnect and reconnect your Gmail account.", 401);
    throw new GmailError("Gmail is temporarily unavailable. Try again later.", 502);
  }
  return token.access_token;
}

const headerEmail = (email: string) => {
  if (!/^[^\s@<>\r\n]+@[^\s@<>\r\n]+\.[^\s@<>\r\n]+$/.test(email) || email.length > 254)
    throw new GmailError("Please add a valid recipient email address.");
  return email;
};
export function buildMimeMail({ from, to, subject, message, filename, pdf }: {
  from: string; to: string; subject: string; message: string; filename: string; pdf: Uint8Array;
}) {
  if (!subject.trim() || subject.length > 240 || /[\r\n]/.test(subject)) throw new GmailError("Provide a valid subject (maximum 240 characters).");
  if (!message.trim() || message.length > 6000) throw new GmailError("Provide an email message (maximum 6,000 characters).");
  const safeFile = filename.replace(/[^\w.-]/g, "-").slice(0, 70) || "invoice.pdf";
  const boundary = `archeon_${randomBytes(16).toString("hex")}`;
  const safeSubject = `=?UTF-8?B?${Buffer.from(subject.trim(), "utf8").toString("base64")}?=`;
  const bodyEncoded = Buffer.from(message.replace(/\r?\n/g, "\r\n"), "utf8").toString("base64").replace(/.{76}/g, "$&\r\n");
  const attachment = Buffer.from(pdf).toString("base64").replace(/.{76}/g, "$&\r\n");
  const mime = [
    `From: <${headerEmail(from)}>`, `To: <${headerEmail(to)}>`, `Subject: ${safeSubject}`,
    "MIME-Version: 1.0", `Content-Type: multipart/mixed; boundary="${boundary}"`, "",
    `--${boundary}`, "Content-Type: text/plain; charset=UTF-8", "Content-Transfer-Encoding: base64", "", bodyEncoded,
    `--${boundary}`, `Content-Type: application/pdf; name="${safeFile}"`, "Content-Transfer-Encoding: base64",
    `Content-Disposition: attachment; filename="${safeFile}"`, "", attachment,
    `--${boundary}--`, "",
  ].join("\r\n");
  return Buffer.from(mime, "utf8").toString("base64url");
}
export async function gmailSend(workspaceId: string, input: Parameters<typeof buildMimeMail>[0]) {
  const connection = await gmailConnection(workspaceId);
  if (!connection) throw new GmailError("Connect a Gmail account before sending.", 409);
  const accessToken = await gmailAccessToken(connection.encrypted);
  const raw = buildMimeMail({ ...input, from: connection.email });
  let response: Response;
  try {
    response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST", cache: "no-store", signal: AbortSignal.timeout(20000),
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ raw }),
    });
  } catch {
    throw new GmailError("Gmail did not confirm whether the message was sent. Check Gmail Sent before trying again.", 502);
  }
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) throw new GmailError("Gmail denied sending. Reconnect Gmail or check Google account permissions.", 403);
    if (response.status === 429) throw new GmailError("Gmail sending limit reached. Please try again later.", 429);
    throw new GmailError("Gmail could not send this invoice. Please try again later.", 502);
  }
  const result = await response.json() as { id?: string };
  if (!result.id) throw new GmailError("Gmail did not confirm delivery. Check Gmail Sent before retrying.", 502);
  return result.id;
}
