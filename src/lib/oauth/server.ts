import "server-only";

import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

import type { Payload, TypedUser } from "payload";
import { z } from "zod";

import { isStaffUser } from "@/access/roles";

/**
 * OAuth 2.1 authorization server for the website connector (/mcp), following
 * the MCP authorization spec: protected resource metadata (RFC 9728),
 * authorization server metadata (RFC 8414), dynamic client registration
 * (RFC 7591), authorization code + PKCE S256 only, resource indicators
 * (RFC 8707), refresh token rotation with reuse detection, revocation
 * (RFC 7009). Tokens are opaque random strings; only their SHA-256 is stored.
 * The person approving must be signed in to the admin as staff, and every
 * token acts as that person (same permissions as their API key would have).
 */

export const SCOPE = "mcp";
export const TTL = { code: 5 * 60_000, access: 60 * 60_000, refresh: 30 * 24 * 60 * 60_000, consent: 10 * 60_000 };
const PREFIX = { code: "scl_ac_", access: "scl_at_", refresh: "scl_rt_", secret: "scl_cs_" } as const;
const MAX_CLIENTS = 200;

export class OAuthError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

export const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
const token = (kind: keyof typeof PREFIX) => PREFIX[kind] + randomBytes(32).toString("base64url");
const safeEqual = (a: string, b: string) => {
  const x = createHash("sha256").update(a).digest();
  const y = createHash("sha256").update(b).digest();
  return timingSafeEqual(x, y) && a.length === b.length;
};

export const issuerFor = (request: Request) => new URL(request.url).origin;
export const resourceFor = (issuer: string) => `${issuer}/mcp`;

export function metadata(issuer: string) {
  return {
    authorizationServer: {
      issuer,
      authorization_endpoint: `${issuer}/oauth/authorize`,
      token_endpoint: `${issuer}/oauth/token`,
      registration_endpoint: `${issuer}/oauth/register`,
      revocation_endpoint: `${issuer}/oauth/revoke`,
      response_types_supported: ["code"],
      grant_types_supported: ["authorization_code", "refresh_token"],
      code_challenge_methods_supported: ["S256"],
      token_endpoint_auth_methods_supported: ["none", "client_secret_post", "client_secret_basic"],
      revocation_endpoint_auth_methods_supported: ["none", "client_secret_post", "client_secret_basic"],
      scopes_supported: [SCOPE],
      authorization_response_iss_parameter_supported: true,
      service_documentation: `${issuer}/`,
    },
    protectedResource: {
      resource: resourceFor(issuer),
      authorization_servers: [issuer],
      scopes_supported: [SCOPE],
      bearer_methods_supported: ["header"],
      resource_name: "San Carlos Life website",
    },
  };
}

/* ---------------- redirect URIs ---------------- */

/** https anywhere, or http only on this computer (desktop apps); never fragments or credentials. */
export function checkRedirectUri(raw: unknown): string {
  if (typeof raw !== "string" || raw.length > 500) throw new OAuthError("invalid_redirect_uri", "Redirect URI is missing or too long.");
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    throw new OAuthError("invalid_redirect_uri", "Redirect URI isn't a valid URL.");
  }
  if (u.hash || raw.includes("#")) throw new OAuthError("invalid_redirect_uri", "Redirect URIs can't have a fragment.");
  if (u.username || u.password) throw new OAuthError("invalid_redirect_uri", "Redirect URIs can't carry credentials.");
  const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(u.hostname);
  if (u.protocol === "https:") return raw;
  if (u.protocol === "http:" && loopback) return raw;
  throw new OAuthError("invalid_redirect_uri", "Redirect URIs must use https (or http on localhost).");
}

/** Exact match, except loopback redirects may use any port (RFC 8252 §7.3). */
export function redirectMatches(registered: string[], asked: string): boolean {
  if (registered.includes(asked)) return true;
  let a: URL;
  try {
    a = new URL(asked);
  } catch {
    return false;
  }
  if (a.protocol !== "http:" || !["localhost", "127.0.0.1", "[::1]"].includes(a.hostname)) return false;
  return registered.some((r) => {
    const b = new URL(r);
    return b.protocol === a.protocol && b.hostname === a.hostname && b.pathname === a.pathname && b.search === a.search;
  });
}

/* ---------------- tiny per-instance rate limit ---------------- */

const hits = new Map<string, number[]>();
export function rateLimited(key: string, max: number, windowMs: number) {
  if (process.env.NODE_ENV !== "production") return false; // like the form limits: production only
  const now = Date.now();
  const list = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  list.push(now);
  hits.set(key, list);
  if (hits.size > 5000) hits.clear();
  return list.length > max;
}

/* ---------------- clients ---------------- */

const RegisterBody = z.object({
  redirect_uris: z.array(z.string()).min(1).max(10),
  client_name: z.string().trim().min(1).max(100).optional(),
  client_uri: z.string().url().max(300).optional(),
  token_endpoint_auth_method: z.enum(["none", "client_secret_post", "client_secret_basic"]).optional(),
  grant_types: z.array(z.string()).optional(),
  response_types: z.array(z.string()).optional(),
  scope: z.string().max(200).optional(),
});

type ClientDoc = { id: number | string; clientId: string; name: string; redirectUris: string[]; authMethod: "none" | "client_secret_post" | "client_secret_basic"; secretHash?: string | null };

export async function registerClient(payload: Payload, body: unknown) {
  const parsed = RegisterBody.safeParse(body);
  if (!parsed.success) throw new OAuthError("invalid_client_metadata", parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "));
  const b = parsed.data;
  const redirectUris = b.redirect_uris.map(checkRedirectUri);
  if (b.grant_types?.some((g) => !["authorization_code", "refresh_token"].includes(g))) throw new OAuthError("invalid_client_metadata", "Only authorization_code and refresh_token grants are supported.");
  if (b.response_types?.some((r) => r !== "code")) throw new OAuthError("invalid_client_metadata", "Only the code response type is supported.");
  const count = await payload.count({ collection: "oauth-clients", overrideAccess: true });
  if (count.totalDocs >= MAX_CLIENTS) throw new OAuthError("invalid_client_metadata", "Too many registered apps; ask the site admin to remove unused ones.", 403);

  // RFC 7591's default is client_secret_basic; MCP clients usually ask for "none" (public client + PKCE).
  const authMethod = b.token_endpoint_auth_method ?? "client_secret_basic";
  const clientId = `scl_client_${randomBytes(16).toString("base64url")}`;
  const secret = authMethod === "none" ? undefined : token("secret");
  await payload.create({
    collection: "oauth-clients",
    data: { clientId, name: b.client_name ?? "Unnamed app", redirectUris, authMethod, secretHash: secret ? sha256(secret) : undefined, clientUri: b.client_uri },
    overrideAccess: true,
  });
  return {
    client_id: clientId,
    ...(secret ? { client_secret: secret, client_secret_expires_at: 0 } : {}),
    client_id_issued_at: Math.floor(Date.now() / 1000),
    client_name: b.client_name ?? "Unnamed app",
    redirect_uris: redirectUris,
    token_endpoint_auth_method: authMethod,
    grant_types: ["authorization_code", "refresh_token"],
    response_types: ["code"],
    scope: SCOPE,
  };
}

export async function findClient(payload: Payload, clientId: unknown): Promise<ClientDoc | null> {
  if (typeof clientId !== "string" || !/^scl_client_[\w-]{10,40}$/.test(clientId)) return null;
  const res = await payload.find({ collection: "oauth-clients", where: { clientId: { equals: clientId } }, limit: 1, depth: 0, overrideAccess: true, showHiddenFields: true });
  return (res.docs[0] as unknown as ClientDoc) ?? null;
}

/** Token and revocation endpoints: identify the client by its registered method. */
export async function authenticateClient(payload: Payload, request: Request, form: URLSearchParams): Promise<ClientDoc> {
  let id = form.get("client_id");
  let secret = form.get("client_secret");
  const basic = request.headers.get("authorization")?.match(/^Basic\s+(.+)$/i);
  if (basic) {
    const [u, p] = Buffer.from(basic[1], "base64").toString("utf8").split(":");
    id = decodeURIComponent(u ?? "");
    secret = decodeURIComponent(p ?? "");
  }
  const client = await findClient(payload, id);
  if (!client) throw new OAuthError("invalid_client", "Unknown client.", 401);
  if (client.authMethod === "none") return client;
  if (!secret || !client.secretHash || !safeEqual(sha256(secret), client.secretHash)) throw new OAuthError("invalid_client", "Client authentication failed.", 401);
  return client;
}

/* ---------------- authorization requests ---------------- */

export type AuthRequest = { clientId: string; clientName: string; redirectUri: string; state: string; codeChallenge: string; scope: string; resource: string };

/**
 * Checks an authorization request. Problems with the client or redirect URI
 * are shown on the page (never redirected); anything else is redirected back
 * to the app as an OAuth error, per the spec.
 */
export async function checkAuthRequest(payload: Payload, issuer: string, p: URLSearchParams): Promise<{ ok: AuthRequest } | { page: string } | { redirect: string }> {
  const client = await findClient(payload, p.get("client_id"));
  if (!client) return { page: "This app isn't registered with the website. Remove the connector in your app and add it again." };
  const redirectUri = p.get("redirect_uri") ?? (client.redirectUris.length === 1 ? client.redirectUris[0] : "");
  if (!redirectUri || !redirectMatches(client.redirectUris, redirectUri)) return { page: "The app's return address doesn't match the one it registered." };
  const state = p.get("state") ?? "";
  const back = (error: string, description: string) => {
    const u = new URL(redirectUri);
    u.searchParams.set("error", error);
    u.searchParams.set("error_description", description);
    if (state) u.searchParams.set("state", state);
    u.searchParams.set("iss", issuer);
    return { redirect: u.href };
  };
  if (p.get("response_type") !== "code") return back("unsupported_response_type", "Only response_type=code is supported.");
  const challenge = p.get("code_challenge") ?? "";
  if (p.get("code_challenge_method") !== "S256" || !/^[A-Za-z0-9_-]{43}$/.test(challenge)) return back("invalid_request", "PKCE with code_challenge_method=S256 is required.");
  const scopes = (p.get("scope") ?? SCOPE).split(/\s+/).filter(Boolean);
  if (scopes.some((s) => s !== SCOPE)) return back("invalid_scope", `The only scope is "${SCOPE}".`);
  const resource = p.get("resource") ?? resourceFor(issuer);
  if (resource.replace(/\/$/, "") !== resourceFor(issuer)) return back("invalid_target", "This server only issues tokens for its /mcp connector.");
  if (state.length > 500) return back("invalid_request", "state is too long.");
  return { ok: { clientId: client.clientId, clientName: client.name, redirectUri, state, codeChallenge: challenge, scope: SCOPE, resource: resourceFor(issuer) } };
}

/* ---------------- consent form protection ---------------- */

function consentKey() {
  const secret = process.env.PAYLOAD_SECRET;
  if (!secret) throw new Error("PAYLOAD_SECRET is not set");
  return createHmac("sha256", secret).update("oauth-consent-v1").digest();
}

const consentData = (userId: string | number, r: AuthRequest, ts: number) => [userId, r.clientId, r.redirectUri, r.codeChallenge, r.state, r.scope, r.resource, ts].join("\n");

/** Ties the Allow button to this person, this request and the next 10 minutes. */
export function consentToken(userId: string | number, r: AuthRequest, now = Date.now()) {
  const mac = createHmac("sha256", consentKey()).update(consentData(userId, r, now)).digest("base64url");
  return `${now}.${mac}`;
}

export function checkConsentToken(tokenValue: string, userId: string | number, r: AuthRequest, now = Date.now()) {
  const [ts, mac] = tokenValue.split(".");
  const t = Number(ts);
  if (!t || !mac || now - t > TTL.consent || t > now + 60_000) return false;
  const expected = createHmac("sha256", consentKey()).update(consentData(userId, r, t)).digest("base64url");
  return safeEqual(mac, expected);
}

/* ---------------- codes and tokens ---------------- */

type TokenDoc = {
  id: number | string;
  kind: "code" | "access" | "refresh";
  client: number | string;
  user: number | string;
  family: string;
  scope?: string | null;
  resource?: string | null;
  redirectUri?: string | null;
  codeChallenge?: string | null;
  expiresAt: string;
  usedAt?: string | null;
  revokedAt?: string | null;
};

async function store(payload: Payload, kind: TokenDoc["kind"], data: Omit<TokenDoc, "id" | "kind" | "expiresAt"> & { ttl: number }) {
  const value = token(kind);
  const { ttl, ...rest } = data;
  await payload.create({
    collection: "oauth-tokens",
    data: { ...rest, kind, hash: sha256(value), expiresAt: new Date(Date.now() + ttl).toISOString() } as never,
    overrideAccess: true,
  });
  return value;
}

async function lookup(payload: Payload, value: string): Promise<TokenDoc | null> {
  const res = await payload.find({ collection: "oauth-tokens", where: { hash: { equals: sha256(value) } }, limit: 1, depth: 0, overrideAccess: true, showHiddenFields: true });
  return (res.docs[0] as unknown as TokenDoc) ?? null;
}

async function revokeFamily(payload: Payload, family: string) {
  await payload.update({ collection: "oauth-tokens", where: { and: [{ family: { equals: family } }, { revokedAt: { exists: false } }] }, data: { revokedAt: new Date().toISOString() }, overrideAccess: true });
}

/** Drop records that expired more than a day ago. */
async function sweep(payload: Payload) {
  await payload.delete({ collection: "oauth-tokens", where: { expiresAt: { less_than: new Date(Date.now() - 86_400_000).toISOString() } }, overrideAccess: true });
}

export async function issueCode(payload: Payload, user: TypedUser, client: { id: number | string }, r: AuthRequest) {
  return store(payload, "code", {
    client: client.id,
    user: user.id,
    family: randomBytes(12).toString("base64url"),
    scope: r.scope,
    resource: r.resource,
    redirectUri: r.redirectUri,
    codeChallenge: r.codeChallenge,
    ttl: TTL.code,
  });
}

async function issuePair(payload: Payload, base: Pick<TokenDoc, "client" | "user" | "family" | "scope" | "resource">) {
  const access = await store(payload, "access", { ...base, ttl: TTL.access });
  const refresh = await store(payload, "refresh", { ...base, ttl: TTL.refresh });
  void sweep(payload).catch(() => {});
  return { access_token: access, token_type: "Bearer", expires_in: TTL.access / 1000, refresh_token: refresh, scope: base.scope ?? SCOPE };
}

const pkceOk = (verifier: string, challenge: string) =>
  /^[A-Za-z0-9._~-]{43,128}$/.test(verifier) && safeEqual(createHash("sha256").update(verifier).digest("base64url"), challenge);

const relId = (v: unknown) => (v && typeof v === "object" ? (v as { id: number | string }).id : (v as number | string));

export async function exchange(payload: Payload, client: ClientDoc, form: URLSearchParams, issuer: string) {
  const grant = form.get("grant_type");
  const askedResource = form.get("resource");
  if (askedResource && askedResource.replace(/\/$/, "") !== resourceFor(issuer)) throw new OAuthError("invalid_target", "This server only issues tokens for its /mcp connector.");

  if (grant === "authorization_code") {
    const code = form.get("code") ?? "";
    const doc = code.startsWith(PREFIX.code) ? await lookup(payload, code) : null;
    if (!doc || doc.kind !== "code" || String(relId(doc.client)) !== String(client.id)) throw new OAuthError("invalid_grant", "The code is invalid.");
    if (doc.usedAt || doc.revokedAt) {
      // A code used twice: someone may have intercepted it. Revoke everything it produced.
      await revokeFamily(payload, doc.family);
      throw new OAuthError("invalid_grant", "The code was already used.");
    }
    await payload.update({ collection: "oauth-tokens", id: doc.id, data: { usedAt: new Date().toISOString() }, overrideAccess: true });
    if (Date.parse(doc.expiresAt) < Date.now()) throw new OAuthError("invalid_grant", "The code has expired.");
    if (form.get("redirect_uri") !== doc.redirectUri) throw new OAuthError("invalid_grant", "redirect_uri doesn't match the authorization request.");
    if (!pkceOk(form.get("code_verifier") ?? "", doc.codeChallenge ?? "")) throw new OAuthError("invalid_grant", "PKCE verification failed.");
    await ensureStaff(payload, relId(doc.user));
    return issuePair(payload, { client: client.id, user: relId(doc.user), family: doc.family, scope: doc.scope, resource: doc.resource });
  }

  if (grant === "refresh_token") {
    const value = form.get("refresh_token") ?? "";
    const doc = value.startsWith(PREFIX.refresh) ? await lookup(payload, value) : null;
    if (!doc || doc.kind !== "refresh" || String(relId(doc.client)) !== String(client.id)) throw new OAuthError("invalid_grant", "The refresh token is invalid.");
    if (doc.revokedAt) throw new OAuthError("invalid_grant", "The refresh token was revoked.");
    if (doc.usedAt) {
      // Rotated tokens are single-use; reuse means it leaked. End the whole sign-in.
      await revokeFamily(payload, doc.family);
      throw new OAuthError("invalid_grant", "The refresh token was already used.");
    }
    if (Date.parse(doc.expiresAt) < Date.now()) throw new OAuthError("invalid_grant", "The refresh token has expired.");
    await payload.update({ collection: "oauth-tokens", id: doc.id, data: { usedAt: new Date().toISOString() }, overrideAccess: true });
    await ensureStaff(payload, relId(doc.user));
    return issuePair(payload, { client: client.id, user: relId(doc.user), family: doc.family, scope: doc.scope, resource: doc.resource });
  }

  throw new OAuthError("unsupported_grant_type", "Use authorization_code or refresh_token.");
}

async function ensureStaff(payload: Payload, userId: number | string) {
  const user = await payload.findByID({ collection: "users", id: userId, depth: 0, overrideAccess: true }).catch(() => null);
  if (!user || !isStaffUser(user)) throw new OAuthError("invalid_grant", "The person who approved this app no longer has editor access.");
  return user;
}

/** RFC 7009: always 200; revoking a refresh token ends the whole sign-in. */
export async function revoke(payload: Payload, client: ClientDoc, value: string) {
  if (!/^scl_(at|rt)_/.test(value)) return;
  const doc = await lookup(payload, value);
  if (!doc || String(relId(doc.client)) !== String(client.id)) return;
  if (doc.kind === "refresh") await revokeFamily(payload, doc.family);
  else await payload.update({ collection: "oauth-tokens", id: doc.id, data: { revokedAt: new Date().toISOString() }, overrideAccess: true });
}

export const isOAuthAccessToken = (value: string) => value.startsWith(PREFIX.access);

/** For /mcp: the staff user an access token acts as, or null. */
export async function userForAccessToken(payload: Payload, value: string, issuer: string): Promise<TypedUser | null> {
  const doc = await lookup(payload, value);
  if (!doc || doc.kind !== "access" || doc.revokedAt || Date.parse(doc.expiresAt) < Date.now()) return null;
  if (doc.resource && doc.resource !== resourceFor(issuer)) return null;
  const user = await payload.findByID({ collection: "users", id: relId(doc.user), depth: 0, overrideAccess: true }).catch(() => null);
  if (!user || !isStaffUser(user)) return null;
  return { ...user, collection: "users" } as unknown as TypedUser;
}
