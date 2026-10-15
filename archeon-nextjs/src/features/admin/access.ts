import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { currentAccount, COOKIE_NAME, type Account } from "@/features/auth/server";
import { createHash } from "node:crypto";
export const ADMIN_COOKIE = "archeon_admin_access";
const ISSUER = "archeon-admin";
const AGE = 20 * 60;
function secret() {
  const value = process.env.ARCHEON_ADMIN_SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("Admin access not configured");
  return new TextEncoder().encode(value);
}
export function allowedAdmin(account: Account | null): boolean {
  const ids = (process.env.ARCHEON_ADMIN_USER_IDS || "").split(",").map(i => i.trim().toLowerCase()).filter(Boolean);
  return !!account && ids.length > 0 && ids.includes(account.userId.toLowerCase());
}
function currentSessionFingerprint(value: string | undefined) { return value ? createHash("sha256").update(value).digest("hex") : ""; }
export async function createAdminGrant(account: Account) {
  const session = (await cookies()).get(COOKIE_NAME)?.value;
  if (!session) throw new Error("Session missing");
  return new SignJWT({ scope: "admin", sid: currentSessionFingerprint(session) }).setProtectedHeader({ alg: "HS256" })
    .setIssuer(ISSUER).setSubject(account.userId).setIssuedAt().setExpirationTime(`${AGE}s`).sign(secret());
}
export async function adminAccount(): Promise<Account | null> {
  const account = await currentAccount();
  if (!allowedAdmin(account)) return null;
  const jar = await cookies();
  const grant = jar.get(ADMIN_COOKIE)?.value;
  const session = jar.get(COOKIE_NAME)?.value;
  if (!grant || !session) return null;
  try {
    const decoded = await jwtVerify(grant, secret(), { issuer: ISSUER, algorithms: ["HS256"] });
    return decoded.payload.sub === account!.userId && decoded.payload.scope === "admin" && decoded.payload.sid === currentSessionFingerprint(session) ? account : null;
  } catch { return null; }
}
