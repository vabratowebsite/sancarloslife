import { createHash, timingSafeEqual } from "node:crypto";
import { gunzipSync } from "node:zlib";

import { sql } from "@payloadcms/db-postgres";

import { getPayloadClient } from "@/lib/payload";
import { migrations } from "@/migrations";

/**
 * One-time setup of a new deployment's database (demo or production), for when the
 * database can't be reached from a laptop. Off unless SETUP_SECRET is set (32+ chars);
 * remove the variable when setup is done.
 *
 * POST with `Authorization: Bearer <SETUP_SECRET>` and a JSON body (optionally gzipped,
 * `Content-Encoding: gzip`):
 *   { action: "status" }                     tables and row counts in the web schema
 *   { action: "migrate" }                    runs Payload migrations (src/migrations)
 *   { action: "prepare" }                    empties content tables (never accounts, sign-ins, keys,
 *                                            form submissions or payload_migrations) and
 *                                            sets foreign keys aside so rows load in any order
 *   { action: "load", table, rows }          inserts rows (column names as in the table)
 *   { action: "finish" }                     restores foreign keys (validating every row) and
 *                                            moves id sequences past the loaded ids
 *
 * Only the `web` schema is touched, table names are checked against the catalog, and rows go
 * in as one JSON parameter through jsonb_populate_recordset, so no SQL comes from the request.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const digest = (s: string) => createHash("sha256").update(s).digest();
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

function authorized(request: Request) {
  const secret = process.env.SETUP_SECRET;
  if (!secret || secret.length < 32) return false;
  const got = request.headers.get("authorization") ?? "";
  return timingSafeEqual(digest(got), digest(`Bearer ${secret}`));
}

type Db = { execute: (q: ReturnType<typeof sql>) => Promise<{ rows: Record<string, unknown>[] }> };
const KEEP = "payload_migrations";
// Never loaded through this route: accounts, sign-ins, tokens, keys and personal data.
const SENSITIVE = ["users", "payload_preferences", "payload_locked_documents", "oauth_clients", "oauth_tokens", "ai_connections", "form_submissions"];
const sensitive = (t: string) => SENSITIVE.some((x) => t === x || t.startsWith(`${x}_`));
const FK_TABLE = "__setup_fks";

async function webTables(db: Db) {
  const res = await db.execute(
    sql`select c.relname as name from pg_class c join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'web' and c.relkind = 'r' order by 1`,
  );
  return res.rows.map((r) => String(r.name));
}

export async function POST(request: Request) {
  if (!process.env.SETUP_SECRET) return json({ error: "Setup is off (SETUP_SECRET isn't set)." }, 503);
  if (!authorized(request)) return json({ error: "Unauthorized" }, 401);

  let body: { action?: string; table?: string; rows?: unknown[] };
  try {
    const raw = Buffer.from(await request.arrayBuffer());
    const text = (request.headers.get("content-encoding") ?? "").includes("gzip") ? gunzipSync(raw).toString("utf8") : raw.toString("utf8");
    body = JSON.parse(text);
  } catch {
    return json({ error: "Body must be JSON (optionally gzipped)." }, 400);
  }

  const payload = await getPayloadClient();
  const db = payload.db.drizzle as unknown as Db;

  try {
    switch (body.action) {
      case "status": {
        const tables = await webTables(db);
        const counts: Record<string, number> = {};
        for (const t of tables) {
          const r = await db.execute(sql`select count(*)::int as n from ${sql.identifier("web")}.${sql.identifier(t)}`);
          counts[t] = Number(r.rows[0]?.n ?? 0);
        }
        return json({ ok: true, tables: tables.length, counts });
      }

      case "migrate": {
        await payload.db.migrate({ migrations: migrations as never });
        return json({ ok: true, tables: (await webTables(db)).length });
      }

      case "prepare": {
        // Accounts, sign-ins and keys are never emptied, so a re-run keeps the admin's login.
        const tables = (await webTables(db)).filter((t) => t !== KEEP && t !== FK_TABLE && !sensitive(t));
        await db.execute(sql`create table if not exists web.${sql.identifier(FK_TABLE)} (tbl text, name text, def text)`);
        // Keep the definitions from the first prepare if a load is being retried.
        await db.execute(sql`insert into web.${sql.identifier(FK_TABLE)} (tbl, name, def)
          select c.conrelid::regclass::text, c.conname, pg_get_constraintdef(c.oid)
          from pg_constraint c where c.contype = 'f' and c.connamespace = 'web'::regnamespace`);
        const fks = await db.execute(sql`select c.conrelid::regclass::text as tbl, c.conname as name
          from pg_constraint c where c.contype = 'f' and c.connamespace = 'web'::regnamespace`);
        for (const fk of fks.rows) {
          await db.execute(sql`alter table ${sql.raw(String(fk.tbl))} drop constraint ${sql.identifier(String(fk.name))}`);
        }
        if (tables.length) {
          await db.execute(sql`truncate ${sql.join(tables.map((t) => sql`${sql.identifier("web")}.${sql.identifier(t)}`), sql`, `)} restart identity`);
        }
        return json({ ok: true, emptied: tables.length, foreignKeysSetAside: fks.rows.length });
      }

      case "load": {
        const table = String(body.table ?? "");
        if (!Array.isArray(body.rows)) return json({ error: "rows must be an array" }, 400);
        const tables = await webTables(db);
        if (!tables.includes(table) || table === KEEP || table === FK_TABLE) return json({ error: `Unknown table ${table}` }, 400);
        if (sensitive(table)) return json({ error: `${table} can't be loaded here` }, 403);
        const t = sql`${sql.identifier("web")}.${sql.identifier(table)}`;
        await db.execute(sql`insert into ${t} select * from jsonb_populate_recordset(null::${t}, ${JSON.stringify(body.rows)}::jsonb)`);
        return json({ ok: true, table, inserted: body.rows.length });
      }

      case "finish": {
        const saved = await db.execute(sql`select distinct tbl, name, def from web.${sql.identifier(FK_TABLE)}`);
        const failed: string[] = [];
        for (const fk of saved.rows) {
          const exists = await db.execute(sql`select 1 from pg_constraint where conname = ${String(fk.name)} and connamespace = 'web'::regnamespace`);
          if (exists.rows.length) continue;
          try {
            await db.execute(sql`alter table ${sql.raw(String(fk.tbl))} add constraint ${sql.identifier(String(fk.name))} ${sql.raw(String(fk.def))}`);
          } catch (e) {
            failed.push(`${fk.tbl}.${fk.name}: ${(e as Error).message}`);
          }
        }
        // Sequences owned by web columns move past the highest loaded id.
        const seqs = await db.execute(sql`select s.relname as seq, t.relname as tbl, a.attname as col
          from pg_class s join pg_depend d on d.objid = s.oid and d.deptype in ('a','i')
          join pg_class t on t.oid = d.refobjid join pg_attribute a on a.attrelid = t.oid and a.attnum = d.refobjsubid
          join pg_namespace n on n.oid = s.relnamespace where s.relkind = 'S' and n.nspname = 'web'`);
        for (const s of seqs.rows) {
          await db.execute(sql`select setval(${`web."${String(s.seq)}"`}::regclass,
            coalesce((select max(${sql.identifier(String(s.col))}) from ${sql.identifier("web")}.${sql.identifier(String(s.tbl))}), 0) + 1, false)`);
        }
        if (!failed.length) await db.execute(sql`drop table if exists web.${sql.identifier(FK_TABLE)}`);
        return json({ ok: failed.length === 0, foreignKeysRestored: saved.rows.length - failed.length, failed, sequences: seqs.rows.length }, failed.length ? 409 : 200);
      }

      default:
        return json({ error: "Unknown action" }, 400);
    }
  } catch (e) {
    const message = (e as Error).message.split("\nparams:")[0].slice(0, 500);
    console.error("[setup]", body.action, message);
    return json({ error: message }, 500);
  }
}
