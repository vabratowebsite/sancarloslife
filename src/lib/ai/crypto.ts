import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

/**
 * Encrypts AI provider keys at rest with AES-256-GCM, keyed from
 * PAYLOAD_SECRET. Stored form: enc:v1:<iv>:<tag>:<ciphertext> (base64url).
 * Changing PAYLOAD_SECRET makes saved keys unreadable; re-enter them then.
 */
const PREFIX = "enc:v1:";

const key = () => {
  const secret = process.env.PAYLOAD_SECRET;
  if (!secret) throw new Error("PAYLOAD_SECRET is not set");
  return createHash("sha256").update(`ai-keys:${secret}`).digest();
};

export const isEncrypted = (v: unknown): boolean => typeof v === "string" && v.startsWith(PREFIX);

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return `${PREFIX}${iv.toString("base64url")}:${cipher.getAuthTag().toString("base64url")}:${ct.toString("base64url")}`;
}

export function decryptSecret(stored: string): string {
  if (!isEncrypted(stored)) throw new Error("Not an encrypted value");
  const [iv, tag, ct] = stored.slice(PREFIX.length).split(":");
  const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(ct, "base64url")), decipher.final()]).toString("utf8");
}
