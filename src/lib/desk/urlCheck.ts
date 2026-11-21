/**
 * Source address rules for the backup runner. No Node imports: the admin runs
 * this as field validation in the browser, and the server re-checks every hop
 * and the address actually connected to (fetchSource.ts).
 */

const V4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

export function ipVersion(s: string): 0 | 4 | 6 {
  const m = s.match(V4);
  if (m) return m.slice(1).every((n) => +n <= 255) ? 4 : 0;
  return s.includes(":") && /^[0-9a-f:.]+$/i.test(s) ? 6 : 0;
}

/** True for loopback, private, link-local, CGNAT, multicast, documentation and other non-public addresses. */
export function isPrivateAddress(ip: string): boolean {
  const v = ipVersion(ip);
  if (v === 4) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 192 && b === 0) ||
      (a === 198 && (b === 18 || b === 19)) ||
      a >= 224
    );
  }
  if (v === 6) {
    const s = ip.toLowerCase();
    const mapped = s.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isPrivateAddress(mapped[1]);
    if (s.startsWith("::ffff:")) return true; // hex-form mapped addresses
    return s === "::" || s === "::1" || /^f[cd]/.test(s) || /^fe[89ab]/.test(s) || s.startsWith("ff") || s.startsWith("64:ff9b:") || s.startsWith("2001:db8");
  }
  return true;
}

export function checkUrl(raw: string): URL {
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    throw new Error("Not a valid address");
  }
  if (u.protocol !== "https:") throw new Error("Only https:// sources are allowed");
  if (u.port && u.port !== "443") throw new Error("Only the standard https port is allowed");
  if (u.username || u.password) throw new Error("Addresses with sign-in details aren't allowed");
  const host = u.hostname.replace(/^\[|\]$/g, "");
  if (ipVersion(host) && isPrivateAddress(host)) throw new Error("Private addresses aren't allowed");
  if (!host.includes(".") || /(^localhost$|\.local$|\.internal$|\.localhost$|\.home\.arpa$)/i.test(host)) throw new Error("Private addresses aren't allowed");
  return u;
}
