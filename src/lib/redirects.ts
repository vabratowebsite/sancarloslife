import { Pool } from "pg";

export type RedirectRule = { to: string | null; code: 301 | 302 | 410 };

const TTL_MS = 5 * 60 * 1000;

let pool: Pool | undefined;
let cache: { at: number; rules: Map<string, RedirectRule> } | undefined;
let loading: Promise<Map<string, RedirectRule>> | undefined;

/**
 * All redirects from the Redirects collection, kept in memory for five minutes.
 * Read with plain SQL so the proxy doesn't load Payload on every request.
 */
export async function getRedirects(): Promise<Map<string, RedirectRule>> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.rules;
  loading ??= (async () => {
    try {
      pool ??= new Pool({ connectionString: process.env.DATABASE_URL, max: 2, idleTimeoutMillis: 30_000 });
      const { rows } = await pool.query<{ from_path: string; to_path: string | null; status_code: string }>(
        `select from_path, to_path, status_code from web.redirects`,
      );
      const rules = new Map<string, RedirectRule>();
      for (const r of rows) rules.set(r.from_path.toLowerCase(), { to: r.to_path, code: Number(r.status_code) as 301 | 302 | 410 });
      cache = { at: Date.now(), rules };
      return rules;
    } catch (error) {
      // Never take the site down over redirects: serve pages, retry next time.
      console.error("redirects unavailable", error);
      return cache?.rules ?? new Map();
    } finally {
      loading = undefined;
    }
  })();
  return loading;
}

export function findRedirect(rules: Map<string, RedirectRule>, pathname: string): RedirectRule | undefined {
  const withSlash = pathname.endsWith("/") ? pathname : `${pathname}/`;
  return rules.get(withSlash.toLowerCase());
}
