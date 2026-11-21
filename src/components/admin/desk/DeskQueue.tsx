import { DefaultTemplate } from "@payloadcms/next/templates";
import { Gutter } from "@payloadcms/ui";
import Link from "next/link";
import type { AdminViewServerProps } from "payload";

import { isAdminUser } from "@/access/roles";

import { approveItem, generateAction, rejectItem, runJobNow } from "./actions";

const KINDS = [
  { collection: "posts", label: "Blog post", title: "title", drafts: true, path: (d: Doc) => `/${d.slug}/` },
  { collection: "desk-pages", label: "Page", title: "title", drafts: true, path: (d: Doc) => `/${d.slug}/` },
  { collection: "events", label: "Event", title: "title", drafts: false, path: (d: Doc) => `/event/${d.slug}/` },
  { collection: "places", label: "Restaurant or shop", title: "name", drafts: true, path: () => "" },
  { collection: "city-projects", label: "City project", title: "title", drafts: true, path: (d: Doc) => `/city-projects/${d.slug}/` },
] as const;

type Doc = Record<string, unknown> & {
  id: number | string;
  slug?: string;
  updatedAt: string;
  review?: { state?: string; source?: string; note?: string; submittedAt?: string; check?: { ok?: boolean; problems?: string[] } };
};

const SOURCE: Record<string, string> = { editor: "Editor", claude: "Claude research run", "website-ai": "Website AI", public: "Public submission" };
const when = (iso?: string) => (iso ? new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "");

/** /admin/desk: everything waiting for approval, across every kind of item. */
export async function DeskQueue({ initPageResult, params, searchParams }: AdminViewServerProps) {
  const { req, permissions, visibleEntities, locale } = initPageResult;
  const { payload, user } = req;
  const groups = await Promise.all(
    KINDS.map(async (k) => {
      const res = await payload.find({
        collection: k.collection,
        where: { "review.state": { equals: "in-review" } } as never,
        draft: k.drafts,
        sort: "-updatedAt",
        limit: 100,
        depth: 0,
        overrideAccess: false,
        user,
      });
      return { ...k, docs: res.docs as unknown as Doc[] };
    }),
  );
  const total = groups.reduce((n, g) => n + g.docs.length, 0);
  const prompts = await payload.find({ collection: "ai-prompts", where: { active: { equals: true } }, sort: "name", limit: 50, depth: 0, user, overrideAccess: false });
  // Names only: connections (and their keys) are admin-only.
  const connections = await payload.find({ collection: "ai-connections", where: { enabled: { equals: true } }, sort: "-isDefault", limit: 20, depth: 0, overrideAccess: true });
  const sp = (await searchParams) ?? {};
  const one = (v: unknown) => (Array.isArray(v) ? String(v[0]) : v ? String(v) : "");
  const runs = await payload.find({ collection: "desk-runs", sort: "-startedAt", limit: 8, depth: 0, user, overrideAccess: false });
  const jobs = await payload.find({ collection: "desk-jobs", sort: "name", limit: 50, depth: 0, user, overrideAccess: false });
  const lastRuns = await Promise.all(
    jobs.docs.map(async (j) => (await payload.find({ collection: "desk-runs", where: { job: { equals: j.name } }, sort: "-startedAt", limit: 1, depth: 0, user, overrideAccess: false })).docs[0]),
  );
  const admin = isAdminUser(user);

  const box: React.CSSProperties = { border: "1px solid var(--theme-elevation-150)", borderRadius: 8, padding: 16, marginBottom: 12 };
  return (
    <DefaultTemplate
      i18n={req.i18n}
      locale={locale}
      params={params}
      payload={payload}
      permissions={permissions}
      searchParams={searchParams}
      user={user ?? undefined}
      visibleEntities={visibleEntities}
    >
      <Gutter>
        <h1 style={{ marginTop: 24 }}>Operations Desk: approval queue</h1>
        <p style={{ maxWidth: 720 }}>
          Drafts from Claude&rsquo;s research runs, the website&rsquo;s backup AI and editors. Each one is checked against its format first;
          approving publishes it on the site. Send back adds your note and keeps it a draft.
        </p>
        {one(sp.gen) === "ok" && (
          <p style={{ ...box, borderColor: "var(--theme-success-500)" }} role="status">
            Drafted &ldquo;{one(sp.title)}&rdquo;. It&rsquo;s in the queue below
            {one(sp.problems) !== "0" ? `, with ${one(sp.problems)} things to fix before it can be approved.` : " and passes the format check."}
          </p>
        )}
        {one(sp.gen) === "error" && (
          <p style={{ ...box, borderColor: "var(--theme-error-500)" }} role="alert">
            Couldn&rsquo;t generate the draft: {one(sp.message)}
          </p>
        )}

        <details style={box}>
          <summary style={{ cursor: "pointer", fontWeight: 600 }}>Generate a draft with AI</summary>
          {prompts.docs.length && connections.docs.length ? (
            <form action={generateAction} style={{ display: "grid", gap: 10, marginTop: 12, maxWidth: 720 }}>
              <label>
                Prompt
                <select name="prompt" required style={{ display: "block", width: "100%", padding: 8 }}>
                  {prompts.docs.map((p) => (
                    <option key={p.id} value={String(p.id)}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                AI connection
                <select name="connection" style={{ display: "block", width: "100%", padding: 8 }}>
                  {connections.docs.map((c) => (
                    <option key={c.id} value={String(c.id)}>
                      {c.name}
                      {c.isDefault ? " (default)" : ""}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Notes and sources for the AI
                <textarea
                  name="notes"
                  required
                  minLength={20}
                  rows={6}
                  placeholder="What to write about, key facts, and links to the sources it should use"
                  style={{ display: "block", width: "100%", padding: 8 }}
                />
              </label>
              <p style={{ margin: 0, opacity: 0.8 }}>The draft goes to this queue for your approval. Each run is billed by the AI provider.</p>
              <button type="submit" className="btn btn--style-primary btn--size-small" style={{ margin: 0, justifySelf: "start" }}>
                Generate draft
              </button>
            </form>
          ) : (
            <p style={{ marginTop: 12 }}>
              {prompts.docs.length ? "" : "Add a prompt under Operations Desk → AI prompts. "}
              {connections.docs.length ? "" : "An admin needs to add an AI connection under Operations Desk → AI connections."}
            </p>
          )}
        </details>

        <p>
          <b>{total}</b> waiting for approval.
        </p>
        {groups.map((g) =>
          g.docs.length ? (
            <section key={g.collection} style={{ marginTop: 24 }}>
              <h2>
                {g.label}s ({g.docs.length})
              </h2>
              {g.docs.map((d) => {
                const check = d.review?.check;
                const title = String(d[g.title] ?? "(untitled)");
                return (
                  <article key={String(d.id)} style={box}>
                    <h3 style={{ margin: 0 }}>{title}</h3>
                    <p style={{ margin: "4px 0", opacity: 0.8 }}>
                      {SOURCE[d.review?.source ?? ""] ?? "Unknown source"} · sent {when(d.review?.submittedAt)} · edited {when(d.updatedAt)}
                    </p>
                    {check?.ok ? (
                      <p style={{ color: "var(--theme-success-500)", margin: "8px 0" }}>✓ Passes the format check</p>
                    ) : (
                      <div style={{ margin: "8px 0" }}>
                        <b>Fix before approving:</b>
                        <ul style={{ margin: "4px 0 0 18px" }}>
                          {(check?.problems ?? ["Not checked yet: open it and save once."]).map((p) => (
                            <li key={p}>{p}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {d.review?.note && <p style={{ margin: "4px 0" }}>Note: {d.review.note}</p>}
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginTop: 8 }}>
                      <Link href={`/admin/collections/${g.collection}/${d.id}`}>Open and edit</Link>
                      <form action={approveItem}>
                        <input type="hidden" name="collection" value={g.collection} />
                        <input type="hidden" name="id" value={String(d.id)} />
                        <button type="submit" disabled={!check?.ok} className="btn btn--style-primary btn--size-small" style={{ margin: 0, opacity: check?.ok ? 1 : 0.4 }}>
                          Approve and publish
                        </button>
                      </form>
                      <form action={rejectItem} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <input type="hidden" name="collection" value={g.collection} />
                        <input type="hidden" name="id" value={String(d.id)} />
                        <label>
                          <span className="sr-only" style={{ position: "absolute", left: -9999 }}>
                            Note for {title}
                          </span>
                          <input name="note" placeholder="What to change" style={{ padding: "6px 8px", minWidth: 220 }} />
                        </label>
                        <button type="submit" className="btn btn--style-secondary btn--size-small" style={{ margin: 0 }}>
                          Send back
                        </button>
                      </form>
                      {g.path(d) && g.collection !== "places" && d.review?.state === "approved" && <a href={g.path(d)}>View on site</a>}
                    </div>
                  </article>
                );
              })}
            </section>
          ) : null,
        )}
        {total === 0 && <p style={box as React.CSSProperties}>Nothing is waiting. New drafts from the research runs show up here.</p>}

        <h2 style={{ marginTop: 32 }}>Scheduled jobs</h2>
        <p style={{ maxWidth: 720 }}>
          Claude runs these and logs each run. If a run is missing once its grace period has passed, the website runs the job with the backup AI
          (checked {process.env.CRON_SECRET ? "by the daily cron" : "never: CRON_SECRET isn't set"}). Manage jobs under Operations Desk → Desk jobs.
        </p>
        {jobs.docs.length ? (
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 12 }}>
            <thead>
              <tr>
                <th align="left">Job</th>
                <th align="left">Schedule</th>
                <th align="left">Last run</th>
                <th align="left">Backup</th>
                {admin && <th align="left" />}
              </tr>
            </thead>
            <tbody>
              {jobs.docs.map((j, i) => {
                const last = lastRuns[i];
                const day = j.cadence === "weekly" ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][Number(j.weekday ?? 1)] : j.cadence === "weekdays" ? "Weekdays" : "Daily";
                return (
                  <tr key={j.id}>
                    <td>{j.name}</td>
                    <td>
                      {day} {String(j.hour).padStart(2, "0")}:00, wait {j.graceHours}h
                    </td>
                    <td>{last ? `${when(last.startedAt)} · ${last.runner === "claude" ? "Claude" : last.runner === "website-ai" ? "Website AI" : "Editor"} · ${last.status}` : "never"}</td>
                    <td>{j.backup ? "on" : "off"}</td>
                    {admin && (
                      <td>
                        <form action={runJobNow}>
                          <input type="hidden" name="job" value={String(j.id)} />
                          <button type="submit" className="btn btn--style-secondary btn--size-small" style={{ margin: 0 }}>
                            Run backup now
                          </button>
                        </form>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p>No jobs yet.</p>
        )}

        <h2 style={{ marginTop: 32 }}>Recent runs</h2>
        {runs.docs.length ? (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th align="left">Job</th>
                <th align="left">Ran by</th>
                <th align="left">Result</th>
                <th align="left">When</th>
                <th align="left">Summary</th>
              </tr>
            </thead>
            <tbody>
              {runs.docs.map((r) => (
                <tr key={r.id}>
                  <td>{r.job}</td>
                  <td>{r.runner === "claude" ? "Claude" : r.runner === "website-ai" ? "Website AI" : "Editor"}</td>
                  <td>{r.status}</td>
                  <td>{when(r.startedAt)}</td>
                  <td>{r.summary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No runs recorded yet.</p>
        )}
      </Gutter>
    </DefaultTemplate>
  );
}
