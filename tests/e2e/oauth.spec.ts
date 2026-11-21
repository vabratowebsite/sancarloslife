import { createHash, randomBytes } from "node:crypto";

import { expect, request as pwRequest, test, type APIRequestContext } from "@playwright/test";

/**
 * OAuth sign-in for the website connector, the way claude.ai and ChatGPT use
 * it: discovery → registration → editor approves → code + PKCE → tokens → /mcp.
 * Discovery and refusals always run; the full flow needs an editor account:
 *   E2E_EDITOR_EMAIL=… E2E_EDITOR_PASSWORD=… pnpm test:e2e
 */
const email = process.env.E2E_EDITOR_EMAIL;
const password = process.env.E2E_EDITOR_PASSWORD;
const REDIRECT = "http://localhost:9999/callback";
const rpc = (method: string, params?: object) => ({ jsonrpc: "2.0", id: 1, method, ...(params ? { params } : {}) });

test.beforeEach(() => {
  test.skip(test.info().project.name !== "desktop", "Runs once");
});

test("advertises the sign-in and points unauthenticated calls at it", async ({ request, baseURL }) => {
  const prm = await (await request.get("/.well-known/oauth-protected-resource/mcp")).json();
  expect(prm.resource).toBe(`${baseURL}/mcp`);
  expect(prm.authorization_servers).toEqual([baseURL]);
  const asm = await (await request.get("/.well-known/oauth-authorization-server")).json();
  expect(asm.code_challenge_methods_supported).toEqual(["S256"]);
  expect(asm.registration_endpoint).toBe(`${baseURL}/oauth/register`);

  const res = await request.post("/mcp", { data: rpc("initialize") });
  expect(res.status()).toBe(401);
  expect(res.headers()["www-authenticate"]).toContain(`resource_metadata="${baseURL}/.well-known/oauth-protected-resource/mcp"`);
  const bad = await request.post("/mcp", { data: rpc("initialize"), headers: { Authorization: "Bearer scl_at_notarealtoken0000000000" } });
  expect(bad.headers()["www-authenticate"]).toContain('error="invalid_token"');
});

test("refuses unsafe registrations and bad authorization requests", async ({ request }) => {
  for (const uri of ["http://evil.example/cb", "javascript:alert(1)", "https://x.example/cb#frag"]) {
    const r = await request.post("/oauth/register", { data: { redirect_uris: [uri], token_endpoint_auth_method: "none" } });
    expect(r.status(), uri).toBe(400);
  }
  const reg = await (await request.post("/oauth/register", { data: { client_name: "e2e refusals", redirect_uris: [REDIRECT], token_endpoint_auth_method: "none" } })).json();
  // Unknown redirect: shown on the page, never redirected.
  const wrong = await request.get(`/oauth/authorize?response_type=code&client_id=${reg.client_id}&redirect_uri=${encodeURIComponent("https://evil.example/cb")}&code_challenge=${"a".repeat(43)}&code_challenge_method=S256`, { maxRedirects: 0 });
  expect(wrong.status()).toBe(400);
  // No PKCE: sent back to the app as an error.
  const nopkce = await request.get(`/oauth/authorize?response_type=code&client_id=${reg.client_id}&redirect_uri=${encodeURIComponent(REDIRECT)}&state=s1`, { maxRedirects: 0 });
  expect(nopkce.status()).toBe(303);
  const loc = new URL(nopkce.headers().location);
  expect(loc.searchParams.get("error")).toBe("invalid_request");
  expect(loc.searchParams.get("state")).toBe("s1");
});

async function signedIn(baseURL: string): Promise<APIRequestContext> {
  // Look like a browser arriving from the app's site (Payload only trusts the sign-in cookie on real browser navigations).
  const ctx = await pwRequest.newContext({ baseURL, extraHTTPHeaders: { "Sec-Fetch-Site": "cross-site", "Sec-Fetch-Mode": "navigate", "Sec-Fetch-Dest": "document" } });
  const res = await ctx.post("/api/users/login", { data: { email, password }, headers: { Origin: baseURL } });
  expect(res.ok()).toBe(true);
  return ctx;
}

test("an editor approves an app; its tokens work, rotate and can be revoked", async ({ request, baseURL }) => {
  test.skip(!email || !password, "Set E2E_EDITOR_EMAIL and E2E_EDITOR_PASSWORD to run");
  const reg = await (await request.post("/oauth/register", { data: { client_name: "E2E Connector", redirect_uris: [REDIRECT], token_endpoint_auth_method: "none" } })).json();
  expect(reg.client_id).toMatch(/^scl_client_/);
  expect(reg.client_secret).toBeUndefined();

  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  const q = new URLSearchParams({ response_type: "code", client_id: reg.client_id, redirect_uri: REDIRECT, code_challenge: challenge, code_challenge_method: "S256", state: "xyz", scope: "mcp", resource: `${baseURL}/mcp` });

  // Not signed in: off to the admin sign-in, coming back here afterwards.
  const anon = await request.get(`/oauth/authorize?${q}`, { maxRedirects: 0 });
  expect(anon.status()).toBe(303);
  expect(anon.headers().location).toContain("/admin/login?redirect=");

  const editor = await signedIn(baseURL!);
  const consent = await editor.get(`/oauth/authorize?${q}`);
  expect(consent.status()).toBe(200);
  expect(consent.headers()["content-security-policy"]).toContain("form-action 'self' http://localhost:9999");
  const html = await consent.text();
  expect(html).toContain("E2E Connector");
  const hidden = Object.fromEntries([...html.matchAll(/<input type="hidden" name="([^"]+)" value="([^"]*)">/g)].map((m) => [m[1], m[2].replace(/&amp;/g, "&")]));
  expect(hidden.consent).toBeTruthy();

  // A decision posted from another site is refused.
  const forged = await editor.post("/oauth/authorize", { form: { ...hidden, decision: "allow" }, headers: { Origin: "https://evil.example" }, maxRedirects: 0 });
  expect(forged.status()).toBe(403);

  const allow = await editor.post("/oauth/authorize", { form: { ...hidden, decision: "allow" }, headers: { Origin: baseURL!, "Sec-Fetch-Site": "same-origin" }, maxRedirects: 0 });
  expect(allow.status()).toBe(303);
  const back = new URL(allow.headers().location);
  expect(back.origin + back.pathname).toBe(REDIRECT);
  expect(back.searchParams.get("state")).toBe("xyz");
  expect(back.searchParams.get("iss")).toBe(baseURL);
  const code = back.searchParams.get("code")!;

  const tokenReq = (form: Record<string, string>) => request.post("/oauth/token", { form });
  // Wrong verifier fails (and spends the code).
  const wrongPkce = await tokenReq({ grant_type: "authorization_code", code, redirect_uri: REDIRECT, client_id: reg.client_id, code_verifier: randomBytes(32).toString("base64url") });
  expect((await wrongPkce.json()).error).toBe("invalid_grant");

  // Fresh code for the real exchange.
  const consent2 = await (await editor.get(`/oauth/authorize?${q}`)).text();
  const hidden2 = Object.fromEntries([...consent2.matchAll(/<input type="hidden" name="([^"]+)" value="([^"]*)">/g)].map((m) => [m[1], m[2].replace(/&amp;/g, "&")]));
  const allow2 = await editor.post("/oauth/authorize", { form: { ...hidden2, decision: "allow" }, headers: { Origin: baseURL!, "Sec-Fetch-Site": "same-origin" }, maxRedirects: 0 });
  const code2 = new URL(allow2.headers().location).searchParams.get("code")!;
  const tokens = await (await tokenReq({ grant_type: "authorization_code", code: code2, redirect_uri: REDIRECT, client_id: reg.client_id, code_verifier: verifier })).json();
  expect(tokens.token_type).toBe("Bearer");
  expect(tokens.access_token).toMatch(/^scl_at_/);
  expect(tokens.refresh_token).toMatch(/^scl_rt_/);

  const mcp = (tok: string, body = rpc("tools/list")) => request.post("/mcp", { data: body, headers: { Authorization: `Bearer ${tok}`, Accept: "application/json, text/event-stream" } });
  const list = await mcp(tokens.access_token);
  expect(list.status()).toBe(200);
  expect((await list.json()).result.tools.map((t: { name: string }) => t.name)).toContain("submit_draft");

  // Refresh rotates both tokens; the old refresh token is single-use.
  const refreshed = await (await tokenReq({ grant_type: "refresh_token", refresh_token: tokens.refresh_token, client_id: reg.client_id })).json();
  expect(refreshed.access_token).not.toBe(tokens.access_token);
  expect((await mcp(refreshed.access_token)).status()).toBe(200);
  const replay = await (await tokenReq({ grant_type: "refresh_token", refresh_token: tokens.refresh_token, client_id: reg.client_id })).json();
  expect(replay.error).toBe("invalid_grant");
  // Replaying a spent refresh token ends the whole sign-in.
  expect((await mcp(refreshed.access_token)).status()).toBe(401);

  // A new sign-in, then revocation through the endpoint.
  const consent3 = await (await editor.get(`/oauth/authorize?${q}`)).text();
  const hidden3 = Object.fromEntries([...consent3.matchAll(/<input type="hidden" name="([^"]+)" value="([^"]*)">/g)].map((m) => [m[1], m[2].replace(/&amp;/g, "&")]));
  const code3 = new URL((await editor.post("/oauth/authorize", { form: { ...hidden3, decision: "allow" }, headers: { Origin: baseURL!, "Sec-Fetch-Site": "same-origin" }, maxRedirects: 0 })).headers().location).searchParams.get("code")!;
  const t3 = await (await tokenReq({ grant_type: "authorization_code", code: code3, redirect_uri: REDIRECT, client_id: reg.client_id, code_verifier: verifier })).json();
  // Using a code twice revokes what it issued.
  const again = await (await tokenReq({ grant_type: "authorization_code", code: code3, redirect_uri: REDIRECT, client_id: reg.client_id, code_verifier: verifier })).json();
  expect(again.error).toBe("invalid_grant");
  expect((await mcp(t3.access_token)).status()).toBe(401);

  const consent4 = await (await editor.get(`/oauth/authorize?${q}`)).text();
  const hidden4 = Object.fromEntries([...consent4.matchAll(/<input type="hidden" name="([^"]+)" value="([^"]*)">/g)].map((m) => [m[1], m[2].replace(/&amp;/g, "&")]));
  const code4 = new URL((await editor.post("/oauth/authorize", { form: { ...hidden4, decision: "allow" }, headers: { Origin: baseURL!, "Sec-Fetch-Site": "same-origin" }, maxRedirects: 0 })).headers().location).searchParams.get("code")!;
  const t4 = await (await tokenReq({ grant_type: "authorization_code", code: code4, redirect_uri: REDIRECT, client_id: reg.client_id, code_verifier: verifier })).json();
  expect((await mcp(t4.access_token)).status()).toBe(200);
  expect((await request.post("/oauth/revoke", { form: { token: t4.refresh_token, client_id: reg.client_id } })).status()).toBe(200);
  expect((await mcp(t4.access_token)).status()).toBe(401);

  // Deny sends the app an access_denied error.
  const consent5 = await (await editor.get(`/oauth/authorize?${q}`)).text();
  const hidden5 = Object.fromEntries([...consent5.matchAll(/<input type="hidden" name="([^"]+)" value="([^"]*)">/g)].map((m) => [m[1], m[2].replace(/&amp;/g, "&")]));
  const deny = await editor.post("/oauth/authorize", { form: { ...hidden5, decision: "deny" }, headers: { Origin: baseURL!, "Sec-Fetch-Site": "same-origin" }, maxRedirects: 0 });
  expect(new URL(deny.headers().location).searchParams.get("error")).toBe("access_denied");
  await editor.dispose();
});

test("confidential clients must send their secret", async ({ request }) => {
  const reg = await (await request.post("/oauth/register", { data: { client_name: "e2e confidential", redirect_uris: ["https://app.example/cb"] } })).json();
  expect(reg.token_endpoint_auth_method).toBe("client_secret_basic");
  expect(reg.client_secret).toMatch(/^scl_cs_/);
  const noSecret = await request.post("/oauth/token", { form: { grant_type: "refresh_token", refresh_token: "scl_rt_x", client_id: reg.client_id } });
  expect(noSecret.status()).toBe(401);
  const basic = Buffer.from(`${reg.client_id}:${reg.client_secret}`).toString("base64");
  const withSecret = await request.post("/oauth/token", { form: { grant_type: "refresh_token", refresh_token: "scl_rt_x" }, headers: { Authorization: `Basic ${basic}` } });
  expect((await withSecret.json()).error).toBe("invalid_grant");
});
