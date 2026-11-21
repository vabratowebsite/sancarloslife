import "server-only";

import { OAuthError } from "./server";

/** JSON for the machine endpoints; open CORS is safe here because none of them use cookies. */
export const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, MCP-Protocol-Version",
  "Access-Control-Max-Age": "86400",
};

export const json = (body: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store", Pragma: "no-cache", ...CORS, ...extra } });

export const preflight = () => new Response(null, { status: 204, headers: CORS });

export function oauthError(e: unknown) {
  if (e instanceof OAuthError) {
    return json({ error: e.code, error_description: e.message }, e.status, e.status === 401 ? { "WWW-Authenticate": 'Basic realm="sancarloslife"' } : {});
  }
  console.error("oauth", e);
  return json({ error: "server_error", error_description: "Something went wrong on the server." }, 500);
}

/** Token, revoke: application/x-www-form-urlencoded (JSON accepted too, for lenient clients). */
export async function formOf(request: Request): Promise<URLSearchParams> {
  const type = request.headers.get("content-type") ?? "";
  const text = (await request.text()).slice(0, 20_000);
  if (type.includes("application/json")) {
    const o = JSON.parse(text || "{}") as Record<string, unknown>;
    return new URLSearchParams(Object.entries(o).map(([k, v]) => [k, String(v)]));
  }
  return new URLSearchParams(text);
}

export const clientIp = (request: Request) => request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
