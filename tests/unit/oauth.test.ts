import { beforeAll, describe, expect, it } from "vitest";

import { checkConsentToken, checkRedirectUri, consentToken, redirectMatches, type AuthRequest } from "@/lib/oauth/server";

beforeAll(() => {
  process.env.PAYLOAD_SECRET ||= "unit-test-secret-unit-test-secret-1234";
});

describe("redirect URIs", () => {
  it("accepts https anywhere and http only on this computer", () => {
    for (const ok of ["https://claude.ai/api/mcp/auth_callback", "https://chatgpt.com/connector_platform_oauth_redirect", "http://localhost:6274/oauth/callback", "http://127.0.0.1:33418/cb"]) {
      expect(checkRedirectUri(ok)).toBe(ok);
    }
    for (const bad of ["http://evil.example/cb", "javascript:alert(1)", "https://x.example/cb#f", "https://u:p@x.example/cb", "cursor://callback", "", "nope"]) {
      expect(() => checkRedirectUri(bad), bad).toThrow();
    }
  });

  it("matches exactly, except loopback ports", () => {
    expect(redirectMatches(["https://claude.ai/api/mcp/auth_callback"], "https://claude.ai/api/mcp/auth_callback")).toBe(true);
    expect(redirectMatches(["https://claude.ai/api/mcp/auth_callback"], "https://claude.ai/api/mcp/auth_callback/x")).toBe(false);
    expect(redirectMatches(["https://claude.ai/cb"], "https://claude.ai.evil.example/cb")).toBe(false);
    expect(redirectMatches(["http://127.0.0.1:1000/cb"], "http://127.0.0.1:5555/cb")).toBe(true);
    expect(redirectMatches(["http://127.0.0.1:1000/cb"], "http://127.0.0.1:5555/other")).toBe(false);
    expect(redirectMatches(["https://a.example:443/cb"], "https://a.example:8443/cb")).toBe(false);
  });
});

describe("consent token", () => {
  const r: AuthRequest = { clientId: "scl_client_abcdefghijkl", clientName: "App", redirectUri: "https://claude.ai/cb", state: "s", codeChallenge: "a".repeat(43), scope: "mcp", resource: "https://sancarloslife.com/mcp" };

  it("is bound to the person, the request and ten minutes", () => {
    const t = consentToken(7, r, 1_000_000);
    expect(checkConsentToken(t, 7, r, 1_000_000 + 60_000)).toBe(true);
    expect(checkConsentToken(t, 8, r, 1_000_000)).toBe(false);
    expect(checkConsentToken(t, 7, { ...r, redirectUri: "https://evil.example/cb" }, 1_000_000)).toBe(false);
    expect(checkConsentToken(t, 7, { ...r, codeChallenge: "b".repeat(43) }, 1_000_000)).toBe(false);
    expect(checkConsentToken(t, 7, r, 1_000_000 + 11 * 60_000)).toBe(false);
    expect(checkConsentToken("garbage", 7, r)).toBe(false);
  });
});
