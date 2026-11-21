import { existsSync } from "node:fs";
import path from "node:path";

import { describe, expect, it, vi } from "vitest";

import { IDX_SLOTS } from "@/content/idx";

async function load(env: string) {
  vi.resetModules();
  vi.stubEnv("NODE_ENV", env);
  const mod = await import("../../security-headers.mjs");
  vi.unstubAllEnvs();
  return mod;
}

const directive = (csp: string, name: string) => csp.split("; ").find((d) => d.startsWith(`${name} `)) ?? "";

describe("content security policy", () => {
  it("allows eval only on Buying Buddy pages in production", async () => {
    const { contentSecurityPolicy } = await load("production");
    expect(directive(contentSecurityPolicy(), "script-src")).not.toContain("'unsafe-eval'");
    expect(directive(contentSecurityPolicy({ idx: true }), "script-src")).toContain("'unsafe-eval'");
  });

  it("lets the Buying Buddy runtime, data API, maps and workers load", async () => {
    const csp = (await load("production")).contentSecurityPolicy();
    expect(directive(csp, "script-src")).toContain("https://d2w6u17ngtanmy.cloudfront.net");
    expect(directive(csp, "script-src")).toContain("https://www.mbb2.com");
    expect(directive(csp, "connect-src")).toContain("https://basemap.mbb2.com");
    expect(directive(csp, "worker-src")).toContain("blob:");
    expect(directive(csp, "form-action")).toContain("https://www.mbb2.com");
  });

  it("lists IDX routes that exist", async () => {
    const { IDX_PATHS } = await load("production");
    const routes = IDX_PATHS.filter((p: string) => !["alder-manor", "beverly-terrace", "clearfield-park", "cordes", "el-sereno", "howard-park"].includes(p.slice(1)));
    for (const p of routes) {
      expect(existsSync(path.join("src/app/(site)", p, "page.tsx")), p).toBe(true);
    }
  });
});

describe("IDX slots", () => {
  it("map every slot to a Buying Buddy widget type", () => {
    for (const slot of Object.values(IDX_SLOTS)) expect(slot.type).toMatch(/^[A-Z][A-Za-z]+$/);
  });
});
