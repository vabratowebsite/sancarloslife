#!/usr/bin/env node
/**
 * Copies the website content from a local database into a deployed site through its
 * one-time setup route (src/app/cron/setup/route.ts). For a new demo or production
 * database that can't be reached from this computer.
 *
 *   SETUP_URL=https://<deployment>/cron/setup SETUP_SECRET=... \
 *   [VERCEL_BYPASS=<protection bypass secret>] [SOURCE_DB=postgres://.../scl] \
 *   node scripts/setup/push-content.mjs [--migrate] [--dry-run]
 *
 * What is NOT copied: user accounts and sessions, admin preferences and locks, form
 * submissions (personal data), OAuth apps and tokens, AI connections (keys), saved page
 * edits, desk run logs and jobs, and items made by the automated tests (source website-ai,
 * "Test venue"). Columns pointing at users are emptied. The source database is never
 * changed: everything is read from a temporary copy that is dropped at the end.
 */
import { execFileSync } from "node:child_process";
import { gzipSync } from "node:zlib";

import pg from "pg";

const SETUP_URL = process.env.SETUP_URL;
const SECRET = process.env.SETUP_SECRET;
const SOURCE = process.env.SOURCE_DB ?? "postgres://postgres@localhost:54322/scl?host=/tmp";
const DRY = process.argv.includes("--dry-run");
const MIGRATE = process.argv.includes("--migrate");
const CHUNK_BYTES = 2_500_000; // gzipped body per request (Vercel limit 4.5 MB)

if (!DRY && (!SETUP_URL || !SECRET)) {
  console.error("Set SETUP_URL and SETUP_SECRET (or use --dry-run).");
  process.exit(1);
}

const EXCLUDE = [
  "users", "payload_preferences", "payload_locked_documents", "payload_migrations",
  "form_submissions", "oauth_clients", "oauth_tokens", "ai_connections",
  "page_edits", "desk_runs", "desk_jobs",
];
const excluded = (t) => EXCLUDE.some((x) => t === x || t.startsWith(`${x}_`) || t === `_${x}_v` || t.startsWith(`_${x}_v_`));

const src = new URL(SOURCE);
const host = src.searchParams.get("host") ?? src.hostname;
const port = src.port || "5432";
const user = decodeURIComponent(src.username || "postgres");
const sourceDb = src.pathname.slice(1);
const copyDb = `${sourceDb}_push_${Date.now()}`;
const pgArgs = ["-h", host, "-p", port, "-U", user];

async function post(body) {
  const data = gzipSync(Buffer.from(JSON.stringify(body)));
  const headers = { "Content-Type": "application/json", "Content-Encoding": "gzip", Authorization: `Bearer ${SECRET}` };
  if (process.env.VERCEL_BYPASS) headers["x-vercel-protection-bypass"] = process.env.VERCEL_BYPASS;
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(SETUP_URL, { method: "POST", headers, body: data });
    const text = await res.text();
    let out;
    try { out = JSON.parse(text); } catch { out = { error: text.slice(0, 300) }; }
    if (res.ok) return out;
    if (attempt >= 3 || res.status < 500) throw new Error(`${body.action}${body.table ? ` ${body.table}` : ""}: HTTP ${res.status} ${out.error ?? ""}`);
    await new Promise((r) => setTimeout(r, 2000 * attempt));
  }
}

// 1. Temporary copy of the web schema, cleaned there.
execFileSync("createdb", [...pgArgs, copyDb]);
const client = new pg.Client({ host, port: Number(port), user, database: copyDb });
try {
  execFileSync("bash", ["-c", `pg_dump ${pgArgs.join(" ")} -n web ${sourceDb} | psql -q ${pgArgs.join(" ")} -d ${copyDb} -v ON_ERROR_STOP=1 > /dev/null`]);
  await client.connect();
  const q = (text, params) => client.query(text, params);

  // Items made by the automated tests.
  for (const t of ["posts", "events", "places", "desk_pages", "city_projects"]) {
    await q(`delete from web."_${t}_v" where parent_id in (select id from web."${t}" where review_source = 'website-ai')`);
    await q(`delete from web."${t}" where review_source = 'website-ai'`);
  }
  await q(`delete from web.venues where name ilike 'test venue%'`);

  const tables = (await q(`select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'web' and c.relkind = 'r' order by 1`)).rows.map((r) => r.relname);
  const include = tables.filter((t) => !excluded(t));

  // Empty every column that points at a table we don't copy (mostly users).
  const refs = (await q(`select c.conrelid::regclass::text as tbl, a.attname as col, c.confrelid::regclass::text as target
    from pg_constraint c join pg_attribute a on a.attrelid = c.conrelid and a.attnum = any(c.conkey)
    where c.contype = 'f' and c.connamespace = 'web'::regnamespace`)).rows;
  for (const r of refs) {
    const tbl = r.tbl.replace(/^web\./, "").replace(/"/g, "");
    const target = r.target.replace(/^web\./, "").replace(/"/g, "");
    if (include.includes(tbl) && excluded(target)) await q(`update web."${tbl}" set "${r.col}" = null where "${r.col}" is not null`);
  }

  // 2. Send it.
  if (MIGRATE && !DRY) console.log("migrate:", await post({ action: "migrate" }));
  if (!DRY) console.log("prepare:", await post({ action: "prepare" }));
  let total = 0;
  for (const t of include) {
    const { rows } = await q(`select coalesce(json_agg(x order by x.id), '[]'::json) as rows from web."${t}" x`).catch(async () =>
      q(`select coalesce(json_agg(x), '[]'::json) as rows from web."${t}" x`));
    const all = rows[0].rows;
    if (!all.length) continue;
    // Split into chunks that stay under the body limit once gzipped.
    let batch = [];
    let size = 0;
    const flush = async () => {
      if (!batch.length) return;
      if (!DRY) await post({ action: "load", table: t, rows: batch });
      total += batch.length;
      batch = [];
      size = 0;
    };
    for (const row of all) {
      const len = JSON.stringify(row).length / 4; // rough gzip ratio for this content
      if (size + len > CHUNK_BYTES && batch.length) await flush();
      batch.push(row);
      size += len;
    }
    await flush();
    console.log(`${t}: ${all.length}`);
  }
  if (!DRY) console.log("finish:", await post({ action: "finish" }));
  console.log(`${DRY ? "would send" : "sent"} ${total} rows from ${include.length} tables; skipped ${tables.length - include.length} tables`);
} finally {
  await client.end().catch(() => {});
  execFileSync("dropdb", [...pgArgs, copyDb]);
}
