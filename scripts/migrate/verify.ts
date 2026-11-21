/**
 * Milestone 10 check: every URL in the old sitemap (plus every redirect source)
 * must answer 200 on the new site, directly or after exactly one redirect.
 *
 *   BASE_URL=http://localhost:3000 pnpm migrate:verify
 *   BASE_URL=https://<preview>.vercel.app pnpm migrate:verify
 *
 * Writes scripts/migrate/data/verify-report.json and exits 1 on any failure.
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { isGone } from "./gone";

const BASE = (process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const DATA = path.resolve(import.meta.dirname, "data");
const CONCURRENCY = Number(process.env.CONCURRENCY || 6);

type Result = { url: string; path: string; status: number; hops: number; final?: string; ok: boolean };

async function check(pathname: string): Promise<Omit<Result, "url">> {
  let current = `${BASE}${pathname}`;
  for (let hops = 0; hops < 4; hops++) {
    const res = await fetch(current, { redirect: "manual", headers: { "User-Agent": "SanCarlosLife-verify/1.0" } });
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      if (!loc) return { path: pathname, status: res.status, hops, ok: false };
      current = new URL(loc, current).toString();
      continue;
    }
    // A trailing-slash 308 doesn't count as a hop (old URLs all end in /).
    const realHops = hops;
    return { path: pathname, status: res.status, hops: realHops, final: current.replace(BASE, ""), ok: (res.status === 200 && realHops <= 1) || (res.status === 410 && isGone(pathname)) };
  }
  return { path: pathname, status: 0, hops: 4, ok: false };
}

async function main() {
  const sitemap: { url: string }[] = JSON.parse(await readFile(path.join(DATA, "sitemap.json"), "utf8"));
  const paths = [...new Set(sitemap.map((s) => new URL(s.url).pathname))];
  const results: Result[] = [];
  let i = 0;
  async function worker() {
    while (i < paths.length) {
      const p = paths[i++];
      try {
        results.push({ url: `${BASE}${p}`, ...(await check(p)) });
      } catch (e) {
        results.push({ url: `${BASE}${p}`, path: p, status: 0, hops: 0, ok: false, final: String(e) });
      }
      if (results.length % 50 === 0) process.stdout.write(`\r${results.length}/${paths.length}`);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  const failures = results.filter((r) => !r.ok);
  const byStatus: Record<string, number> = {};
  for (const r of results) byStatus[`${r.status}${r.hops ? ` after ${r.hops} hop` : ""}`] = (byStatus[`${r.status}${r.hops ? ` after ${r.hops} hop` : ""}`] ?? 0) + 1;
  await writeFile(path.join(DATA, "verify-report.json"), JSON.stringify({ base: BASE, at: new Date().toISOString(), total: results.length, byStatus, failures }, null, 1));
  console.log(`\n${results.length} URLs checked against ${BASE}`);
  console.table(byStatus);
  const sample = failures.slice(0, 25);
  for (const f of sample) console.log(`  ${f.status} ${f.path}${f.final && f.final !== f.path ? ` → ${f.final}` : ""}`);
  if (failures.length > sample.length) console.log(`  ... and ${failures.length - sample.length} more (verify-report.json)`);
  process.exit(failures.length ? 1 : 0);
}

main();
