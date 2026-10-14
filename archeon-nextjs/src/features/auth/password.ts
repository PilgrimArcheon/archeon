import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";

const SALT_SIZE = 16;
const KEY_SIZE = 64;
const COST = 32768;
const MAXMEM = 64 * 1024 * 1024;
const VERSION = "scrypt-v1";

export function validPassword(value: unknown): value is string {
  // Keep the rule independent of personal information and allow passphrases.
  return typeof value === "string" && value.length >= 12 && value.length <= 128 &&
    Buffer.byteLength(value, "utf8") <= 512;
}

async function derive(password: string, salt: Buffer): Promise<Buffer> {
  // The callback API accepts the scrypt cost parameters; promisify's overload
  // does not expose that options argument correctly in every @types/node version.
  return new Promise<Buffer>((resolve, reject) => {
    scryptCallback(password, salt, KEY_SIZE, { N: COST, r: 8, p: 1, maxmem: MAXMEM }, (error, key) => {
      if (error) reject(error);
      else resolve(key);
    });
  });
}

export async function hashPassword(password: string): Promise<string> {
  if (!validPassword(password)) throw new Error("Password must be 12–128 characters.");
  const salt = randomBytes(SALT_SIZE);
  return [VERSION, salt.toString("base64url"), (await derive(password, salt)).toString("base64url")].join("$");
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  if (typeof password !== "string" || password.length > 128 || Buffer.byteLength(password, "utf8") > 512) return false;
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== VERSION) return false;
  try {
    const salt = Buffer.from(parts[1], "base64url");
    const expected = Buffer.from(parts[2], "base64url");
    if (salt.length !== SALT_SIZE || expected.length !== KEY_SIZE) return false;
    const derived = await derive(password, salt);
    return timingSafeEqual(derived, expected);
  } catch { return false; }
}

/** Nonexistent email logins still incur the same expensive derivation. */
export async function dummyPasswordCheck(password: string) {
  const dummySalt = Buffer.from("6c77dc34fe583a1181ae56c7db8e951d", "hex");
  await derive(password, dummySalt);
}
