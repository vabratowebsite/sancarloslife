/**
 * Ops desk phase 4: brings the Operations Desk artifact's content into the site
 * as DRAFTS IN REVIEW (source claude). Nothing is published.
 *
 * Reads a local copy of the artifact in scripts/migrate/data/desk/ (gitignored):
 *   bundle.json (the desk's structured data), manifest.json (file list), and the
 *   blogs/, news/, drafts/, re/ HTML pages.
 *
 *   pnpm migrate:desk            dry run: writes data/desk/report.json and prints a summary
 *   DESK_IMPORT_APPLY=1 pnpm migrate:desk   writes, but only to a database on this computer
 *
 * Matching: by slug (events: the desk's id as slug). An existing item that the desk
 * import didn't create is never overwritten. Re-running updates earlier imports.
 * Content from the artifact is treated as data: it is cleaned, never executed.
 * Not imported (owner decisions or later phases): places (wait for the design B
 * fields), pending Civic Watch rows, newsletters, meeting transcripts, desk code.
 */
import fs from "node:fs/promises";
import path from "node:path";

import { JSDOM } from "jsdom";

import { DATA, htmlToLexical, payload, relativize, run, text } from "./lib";

const DESK = path.join(DATA, "desk");
const APPLY = process.env.DESK_IMPORT_APPLY === "1";
const NOW = new Date();

type Report = { kind: string; slug: string; title: string; action: "create" | "update" | "skip"; reason?: string; notes?: string[] };
const report: Report[] = [];

// ---------------------------------------------------------------- helpers

const readHtml = (rel: string) => fs.readFile(path.join(DESK, rel), "utf8");

/** The "=== SEO META ===" comment the desk put at the top of every page. */
function seoMeta(html: string) {
  const block = html.match(/=== SEO META[\s\S]*?=== END META ===/)?.[0] ?? "";
  const get = (label: string) => block.match(new RegExp(`^${label}[^:]*:\\s*(.+?)\\s*(?:\\[\\d+ chars\\])?\\s*$`, "m"))?.[1]?.trim();
  return {
    title: get("Post Title") ?? get("Page Title"),
    seoTitle: get("SEO Title"),
    description: get("Meta Description"),
    focus: get("Focus Keyword"),
    slug: get("URL Slug")?.split(/\s+/)[0],
    category: get("Category"),
  };
}

/**
 * Turns a desk page into clean HTML for the site's sanitized HTML block: keeps the
 * article (headings, paragraphs, lists, tables, links, footnotes), drops the
 * preview chrome, the desk's newsletter form, scripts, styles and photo
 * placeholders, and rewrites elements the sanitizer doesn't keep (FAQ details,
 * info-box rows) into ones it does.
 */
function cleanDeskHtml(html: string, opts: { dropAnswer?: boolean } = {}) {
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  const root = doc.querySelector(".scl-proj") ?? doc.body;
  const photos: string[] = [];
  const verify: string[] = [];

  root.querySelectorAll("figure.scl-img, .scl-ph, .ph, .scl-fig").forEach((f) => {
    const t = text(f.textContent).replace(/^-->\s*/, "");
    if (/photo to add|image|\.jpe?g|\.png/i.test(t)) photos.push(t.slice(0, 200));
    f.remove();
  });
  root.querySelectorAll(".scl-verify").forEach((v) => {
    verify.push(text(v.textContent).slice(0, 600));
    v.remove();
  });
  root.querySelectorAll("script, style, form, .scl-form, .draftbar, .fakenav, .scl-publisher, .scl-crumbs, .scl-hero h1, .scl-updated, noscript").forEach((n) => n.remove());
  // Newsletter sign-up blocks hold a form (already removed) and its heading; drop the leftovers.
  root.querySelectorAll("h3").forEach((h) => {
    if (/get san carlos news every week/i.test(h.textContent ?? "")) h.parentElement?.remove();
  });

  // The quick answer, without evidence labels and footnote numbers (it is shown as plain text).
  const answerEl = (root.querySelector(".scl-answer") ?? root.querySelector("p"))?.cloneNode(true) as Element | undefined;
  answerEl?.querySelectorAll(".scl-ev, sup, .scl-fn").forEach((n) => n.remove());
  const answer = text(answerEl?.textContent);
  if (opts.dropAnswer) root.querySelector(".scl-answer")?.remove();

  // Decorative bits: kicker labels, "NEW" tags, the stage bar (the page shows the status itself).
  root.querySelectorAll(".scl-label, .newtag, .scl-track").forEach((n) => n.remove());
  // Update dates become bold labels.
  root.querySelectorAll("li > time").forEach((t) => {
    const b = doc.createElement("strong");
    b.textContent = `${text(t.textContent)}: `;
    t.replaceWith(b);
  });
  // Fact chips ("Finish: early 2027") become a list.
  root.querySelectorAll(".scl-chips").forEach((chips) => {
    const ul = doc.createElement("ul");
    chips.querySelectorAll(".scl-chip").forEach((chip) => {
      const li = doc.createElement("li");
      li.append(...Array.from(chip.childNodes));
      const b = li.querySelector("b, strong");
      if (b && b.nextSibling?.nodeType === 3) b.after(doc.createTextNode(" "));
      ul.append(li);
    });
    chips.replaceWith(ul);
  });

  // FAQ: <details><summary>Q</summary>A</details> → <h3>Q</h3> A
  root.querySelectorAll("details").forEach((d) => {
    const q = d.querySelector("summary");
    const h = doc.createElement("h3");
    h.textContent = text(q?.textContent);
    q?.remove();
    const wrap = doc.createElement("div");
    wrap.append(h, ...Array.from(d.childNodes));
    d.replaceWith(wrap);
  });
  // Info-box rows: label/value pairs → "Label: value" paragraphs.
  root.querySelectorAll("div.row").forEach((r) => {
    const kids = Array.from(r.children);
    const p = doc.createElement("p");
    if (kids.length >= 2) {
      const b = doc.createElement("strong");
      b.textContent = `${text(kids[0].textContent)}: `;
      p.append(b, ...Array.from(kids[1].childNodes));
    } else p.append(...Array.from(r.childNodes));
    r.replaceWith(p);
  });
  // Containers the sanitizer drops become divs (their content stays).
  root.querySelectorAll("aside, section, nav, header, footer, article, main").forEach((el) => {
    const div = doc.createElement("div");
    div.append(...Array.from(el.childNodes));
    el.replaceWith(div);
  });
  // Comments (Rank Math notes, checklists) never reach the page.
  const walker = doc.createTreeWalker(root, 128 /* comments */);
  const comments: Node[] = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) comments.push(n);
  comments.forEach((c) => c.parentNode?.removeChild(c));

  const sources = Array.from(root.querySelectorAll("ol.scl-footnotes li")).map((li) => {
    const a = li.querySelector("a[href^='http']");
    return { label: text(li.textContent).slice(0, 300), url: a?.getAttribute("href") ?? "" };
  });

  return { html: relativize(root.innerHTML.replace(/\n{3,}/g, "\n\n").trim()), answer, photos, verify, sources, doc, root };
}

const reviewNote = (parts: (string | number | false | undefined | null)[]) => parts.filter((x): x is string => typeof x === "string" && x.length > 0).join("\n\n").slice(0, 4000);

const BLOG_CATEGORY: [RegExp, string][] = [
  [/real estate/i, "Real Estate Blogs"],
  [/restaurant/i, "Restaurant Blogs"],
  [/business|shop local|new in town/i, "Shops and Services Blogs"],
  [/^events|\/ events/i, "Events Blogs"],
  [/council|city government|city hall|election|planning|city projects/i, "City Council Blogs"],
];

async function categoryId(p: Awaited<ReturnType<typeof payload>>, deskCategory?: string) {
  const name = BLOG_CATEGORY.find(([re]) => re.test(deskCategory ?? ""))?.[1] ?? "News Blog";
  const c = (await p.find({ collection: "categories", where: { name: { equals: name } }, limit: 1, depth: 0 })).docs[0];
  return { id: (c?.id as number | undefined) ?? null, name };
}

/** An existing item with this slug that the desk import didn't create blocks the import. */
async function existing(p: Awaited<ReturnType<typeof payload>>, collection: "posts" | "desk-pages" | "city-projects" | "events" | "places", slug: string) {
  const res = await p.find({ collection, where: { slug: { equals: slug } }, limit: 1, depth: 0, draft: collection !== "events" } as never);
  const doc = res.docs[0] as { id: number | string; review?: { source?: string; note?: string } } | undefined;
  if (!doc) return { doc: null, ours: false };
  return { doc, ours: doc.review?.source === "claude" && String(doc.review?.note ?? "").includes("[desk import]") };
}

async function upsert(
  p: Awaited<ReturnType<typeof payload>>,
  kind: string,
  collection: "posts" | "desk-pages" | "city-projects" | "events",
  slug: string,
  title: string,
  data: Record<string, unknown>,
  notes: string[],
) {
  const { doc, ours } = await existing(p, collection, slug);
  if (doc && !ours) {
    report.push({ kind, slug, title, action: "skip", reason: `the address /${slug}/ is already used by an item that wasn't imported from the desk` });
    return;
  }
  report.push({ kind, slug, title, action: doc ? "update" : "create", notes });
  if (!APPLY) return;
  const draft = collection !== "events";
  if (doc) await p.update({ collection, id: doc.id, data: data as never, draft, overrideAccess: true });
  else await p.create({ collection, data: data as never, draft, overrideAccess: true });
}

// ---------------------------------------------------------------- posts (blogs + news briefs)

async function importPosts(p: Awaited<ReturnType<typeof payload>>, bundle: Record<string, string>) {
  const blogIndex = JSON.parse(bundle["pages/blogs_index.json"]).blogs as { slug: string; title: string; desc: string; focus: string; category?: string }[];
  const newsIndex = JSON.parse(bundle["pages/news_index.json"]) as { slug: string; title: string; desc: string; focus: string; category?: string }[];
  const index = new Map([...blogIndex, ...newsIndex].map((x) => [x.slug, x]));

  for (const dir of ["blogs", "news"] as const) {
    for (const file of (await fs.readdir(path.join(DESK, dir))).filter((f) => f.endsWith(".html")).sort()) {
      const html = await readHtml(`${dir}/${file}`);
      const meta = seoMeta(html);
      const slug = meta.slug ?? file.replace(/\.html$/, "");
      const idx = index.get(slug);
      const c = cleanDeskHtml(html);
      const title = meta.title ?? idx?.title ?? text(c.doc.querySelector("h1")?.textContent) ?? slug;
      const cat = await categoryId(p, meta.category ?? idx?.category);
      const notes = [`category: ${cat.name}`, c.photos.length ? `${c.photos.length} photo(s) to add` : "", c.verify.length ? "has items to verify" : ""].filter(Boolean);
      await upsert(
        p,
        dir === "blogs" ? "blog" : "news brief",
        "posts",
        slug,
        title,
        {
          title,
          slug,
          generateSlug: false,
          excerpt: (c.answer || idx?.desc || "").slice(0, 600) || undefined,
          body: htmlToLexical(c.html),
          categories: cat.id ? [cat.id] : [],
          seo: { title: meta.seoTitle ?? idx?.title, description: meta.description ?? idx?.desc, focusKeyword: meta.focus ?? idx?.focus },
          _status: "draft",
          review: {
            state: "in-review",
            source: "claude",
            note: reviewNote([
              "[desk import] From the Operations Desk artifact; not yet published.",
              c.verify.length && `Check before publishing:\n- ${c.verify.join("\n- ")}`,
              c.photos.length && `Photos the desk planned (none supplied yet):\n- ${c.photos.join("\n- ")}`,
            ]),
          },
        },
        notes,
      );
    }
  }
}

// ---------------------------------------------------------------- real estate guides → desk pages

const RE_GUIDES = ["adu-and-sb9-guide-san-carlos", "buying-a-home-in-san-carlos", "selling-a-home-in-san-carlos", "san-carlos-real-estate-market-report"];
const RE_COVERED: Record<string, string> = {
  "home-value": "covered by the Sell My House page; bring wording over with the on-page editor",
  "san-carlos-home-calculators": "covered by the mortgage calculator page; bring wording over with the on-page editor",
  kit: "desk building block (component kit), not a page",
  "neighborhood-guide-template": "desk template, not a page",
};

async function importGuides(p: Awaited<ReturnType<typeof payload>>) {
  for (const [slug, why] of Object.entries(RE_COVERED)) report.push({ kind: "real estate page", slug, title: slug, action: "skip", reason: why });
  for (const slug of RE_GUIDES) {
    const html = await readHtml(`re/${slug}.html`);
    const meta = seoMeta(html);
    const c = cleanDeskHtml(html);
    const title = meta.title ?? text(c.doc.querySelector("h1")?.textContent) ?? slug;

    // FAQ and sources become their own fields; the rest splits into sections at each H2.
    const faq: { question: string; answer: string }[] = [];
    c.root.querySelectorAll("h3").forEach((h) => {
      const holder = h.parentElement;
      if (holder && holder.children.length >= 2 && holder.children[0] === h && /\?$/.test(text(h.textContent))) {
        const answer = text(holder.textContent).slice(text(h.textContent).length).trim();
        if (answer) faq.push({ question: text(h.textContent), answer: answer.slice(0, 800) });
        holder.remove();
      }
    });
    c.root.querySelectorAll("ol.scl-footnotes").forEach((o) => o.remove());
    const cta = c.root.querySelector(".scl-cta");
    const ctaLink = cta?.querySelector("a[href]");
    const ctaData = {
      heading: text(cta?.querySelector("h2, h3")?.textContent) || "Talk to Viv & Mark",
      text: text(cta?.querySelector("p")?.textContent).slice(0, 300) || undefined,
      buttonLabel: text(ctaLink?.textContent) || "Contact us",
      buttonHref: relativize(ctaLink?.getAttribute("href") ?? "/contact-us/").replace(/^(?!\/|https:\/\/)/, "/"),
    };
    cta?.remove();

    const sections: { heading: string; html: string }[] = [];
    let current: { heading: string; html: string } | null = null;
    for (const node of Array.from(c.root.querySelectorAll("h2, p, ul, ol, table, h3, blockquote"))) {
      if (node.closest("h2, ul, ol, table, blockquote") !== node && node.tagName !== "H2" && node.parentElement?.closest("ul, ol, table, blockquote")) continue;
      if (node.tagName === "H2") {
        current = { heading: text(node.textContent), html: "" };
        if (/frequently asked|sources|^faq/i.test(current.heading)) current = null;
        else sections.push(current);
      } else if (current) current.html += node.outerHTML;
    }
    const notes = [`${sections.length} sections, ${faq.length} FAQs, ${c.sources.length} sources`, c.photos.length ? `${c.photos.length} photo(s) to add` : ""].filter(Boolean);
    await upsert(
      p,
      "real estate guide",
      "desk-pages",
      slug,
      title,
      {
        title,
        slug,
        generateSlug: false,
        template: "guide",
        eyebrow: "Real estate guide",
        summary: (c.answer || meta.description || "").slice(0, 320),
        sections: sections.filter((s) => s.html).map((s) => ({ heading: s.heading.slice(0, 120), body: htmlToLexical(relativize(s.html)) })),
        faq,
        sources: c.sources.filter((s) => s.url).map((s) => ({ label: s.label.slice(0, 200), url: s.url })),
        cta: ctaData,
        seo: { title: meta.seoTitle, description: meta.description },
        updated: NOW.toISOString(),
        _status: "draft",
        review: {
          state: "in-review",
          source: "claude",
          note: reviewNote([
            "[desk import] Real estate guide from the Operations Desk artifact.",
            c.verify.length && `Check before publishing:\n- ${c.verify.join("\n- ")}`,
            c.photos.length && `Photos the desk planned:\n- ${c.photos.join("\n- ")}`,
          ]),
        },
      },
      notes,
    );
  }
}

// ---------------------------------------------------------------- city projects

function projectStatus(stage: string) {
  const s = stage.toLowerCase();
  if (/construction documents|site selected|in design|design|plan|study|draft|environmental|review|outreach/.test(s) && !/building|under construction/.test(s)) return "planning";
  if (/open|complete|finished/.test(s)) return "completed";
  if (/under construction|building|construction|work under way/.test(s)) return "construction";
  if (/approved|bid|adopted|funded|passed|in effect|being carried out/.test(s)) return "approved";
  if (/hold|paused/.test(s)) return "on_hold";
  return "proposed";
}

async function importProjects(p: Awaited<ReturnType<typeof payload>>) {
  report.push({ kind: "city project", slug: "city-projects", title: "City Projects hub", action: "skip", reason: "the hub is the site's /city-projects/ code page; compare its wording with the desk's draft by hand" });
  for (const file of (await fs.readdir(path.join(DESK, "drafts"))).filter((f) => f.endsWith(".html") && f !== "city-projects.html").sort()) {
    const html = await readHtml(`drafts/${file}`);
    const meta = seoMeta(html);
    const slug = file.replace(/\.html$/, "");
    const dom = new JSDOM(html).window.document;
    const title = text(dom.querySelector(".scl-hero h1, h1")?.textContent) || meta.title || slug;
    const steps = Array.from(dom.querySelectorAll(".scl-track li"));
    const now = steps.find((li) => li.classList.contains("now")) ?? steps.filter((li) => li.classList.contains("done")).pop();
    const stage = text(now?.textContent) || "";
    const c = cleanDeskHtml(html, { dropAnswer: true });
    c.root.querySelectorAll("ol.scl-footnotes").forEach((o) => o.closest("div")?.remove());
    const sources = c.sources.filter((s) => /^https?:\/\//.test(s.url));
    const notes = [`stage "${stage || "?"}" → ${projectStatus(stage)}`, `${sources.length} sources`, c.photos.length ? `${c.photos.length} photo(s) to add` : ""].filter(Boolean);
    await upsert(
      p,
      "city project",
      "city-projects",
      slug,
      title,
      {
        title,
        slug,
        generateSlug: false,
        status: projectStatus(stage),
        summary: (c.answer || meta.description || "").slice(0, 700),
        latestUpdateAt: NOW.toISOString(),
        body: htmlToLexical(c.html),
        sources: sources.map((s) => ({ title: s.label.slice(0, 200), url: s.url })),
        seo: { title: meta.seoTitle, description: meta.description, focusKeyword: meta.focus },
        _status: "draft",
        review: {
          state: "in-review",
          source: "claude",
          note: reviewNote([
            "[desk import] City project page from the Operations Desk artifact. The desk built it as a child of /city-projects/; on the new site it lives at /city-projects/<slug>/.",
            c.verify.length && `Check before publishing:\n- ${c.verify.join("\n- ")}`,
            c.photos.length && `Photos the desk planned:\n- ${c.photos.join("\n- ")}`,
          ]),
        },
      },
      notes,
    );
  }
}

// ---------------------------------------------------------------- events

type DeskEvent = {
  id: string;
  kind: string;
  title: string;
  start_date: string;
  start_time?: string | null;
  end_date?: string | null;
  end_time?: string | null;
  all_day?: boolean;
  recurrence?: { freq?: string; interval?: number; byday?: string[]; until?: string | null; exceptions?: string[]; rule?: string } | null;
  venue?: { name?: string; address?: string; city?: string; state?: string; zip?: string; website?: string; phone?: string } | null;
  organizer?: { name?: string; website?: string; phone?: string; email?: string } | null;
  cost?: string;
  event_website?: string;
  description: string;
  excerpt?: string;
  image_note?: string;
  sources?: string[];
  verified?: string;
  confidence?: string;
  notes?: string;
  venue_site?: { id: number } | null;
  organizer_site?: { id: number } | null;
  tec_categories?: string[];
};

/** San Carlos wall-clock time → instant (same method as src/lib/events/recurrence.ts, which this script can't import). */
function fromLA(year: number, month: number, day: number, hour = 0, minute = 0): Date {
  const parts = (d: Date) => {
    const f = new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" }).formatToParts(d);
    const g = (t: string) => Number(f.find((x) => x.type === t)?.value);
    return Date.UTC(g("year"), g("month") - 1, g("day"), g("hour"), g("minute"), g("second"));
  };
  const target = Date.UTC(year, month - 1, day, hour, minute);
  let guess = target;
  for (let i = 0; i < 3; i++) guess += target - parts(new Date(guess));
  return new Date(guess);
}

const at = (date: string, time?: string | null) => {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = (time ?? "00:00").split(":").map(Number);
  return fromLA(y, m, d, hh || 0, mm || 0);
};

function rrule(r: NonNullable<DeskEvent["recurrence"]>) {
  if (!r.freq) return null;
  const parts = [`FREQ=${r.freq.toUpperCase()}`];
  if (r.interval && r.interval > 1) parts.push(`INTERVAL=${r.interval}`);
  if (r.byday?.length) parts.push(`BYDAY=${r.byday.join(",")}`);
  if (r.until) parts.push(`UNTIL=${r.until.replace(/-/g, "")}T235959Z`);
  return parts.join(";");
}

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 80);

async function findOrCreate(
  p: Awaited<ReturnType<typeof payload>>,
  collection: "venues" | "organizers",
  wpId: number | undefined,
  data: { name: string } & Record<string, unknown>,
) {
  if (wpId) {
    const byWp = (await p.find({ collection, where: { wpId: { equals: wpId } }, limit: 1, depth: 0 })).docs[0];
    if (byWp) return { id: byWp.id, created: false };
  }
  const byName = (await p.find({ collection, where: { name: { like: data.name } }, limit: 10, depth: 0 })).docs.find((d) => String(d.name).toLowerCase() === data.name.toLowerCase());
  if (byName) return { id: byName.id, created: false };
  if (!APPLY) return { id: null, created: true };
  const doc = await p.create({ collection, data: { ...data, slug: slugify(data.name) } as never, overrideAccess: true });
  return { id: doc.id, created: true };
}

async function importEvents(p: Awaited<ReturnType<typeof payload>>, bundle: Record<string, string>) {
  const drafts = (JSON.parse(bundle["events/events.json"]).drafts ?? []) as DeskEvent[];
  const cats = (await p.find({ collection: "event-categories", limit: 500, depth: 0, pagination: false })).docs;
  const catId = new Map(cats.map((c) => [String(c.name).toLowerCase(), c.id]));

  for (const e of drafts) {
    const slug = slugify(e.id);
    const start = at(e.start_date, e.all_day ? "00:00" : e.start_time);
    const series = e.recurrence ? rrule(e.recurrence) : null;
    // One-off events end on end_date; a series' first meeting ends the same day.
    const endDate = series ? e.start_date : (e.end_date ?? e.start_date);
    const end = e.end_time || e.all_day ? at(endDate, e.all_day ? "23:59" : e.end_time) : undefined;
    const lastDay = series
      ? e.recurrence?.until
        ? at(e.recurrence.until, "23:59")
        : null
      : (end ?? start);
    if (lastDay && lastDay < NOW) {
      report.push({ kind: "event", slug, title: e.title, action: "skip", reason: `already over (${(e.end_date ?? e.start_date)})` });
      continue;
    }
    // Already on the calendar under another address (e.g. imported from WordPress)?
    const same = (await p.find({ collection: "events", where: { and: [{ title: { equals: e.title } }, { startsAt: { greater_than_equal: new Date(start.getTime() - 86_400_000).toISOString() } }, { startsAt: { less_than_equal: new Date(start.getTime() + 86_400_000).toISOString() } }] }, limit: 1, depth: 0 })).docs[0];
    if (same && same.slug !== slug) {
      report.push({ kind: "event", slug, title: e.title, action: "skip", reason: `already on the calendar as /event/${same.slug}/` });
      continue;
    }
    const venue = e.venue?.name
      ? await findOrCreate(p, "venues", e.venue_site?.id, {
          name: e.venue.name,
          address: e.venue.address || undefined,
          city: e.venue.city || "San Carlos",
          state: e.venue.state || "CA",
          zip: e.venue.zip || undefined,
          url: e.venue.website || undefined,
          phone: e.venue.phone || undefined,
        })
      : null;
    const organizer = e.organizer?.name
      ? await findOrCreate(p, "organizers", e.organizer_site?.id, {
          name: e.organizer.name,
          url: e.organizer.website || undefined,
          email: e.organizer.email || undefined,
          phone: e.organizer.phone || undefined,
        })
      : null;
    const categories = (e.tec_categories ?? []).map((n) => catId.get(n.toLowerCase())).filter(Boolean);
    const paragraphs = e.description
      .split(/\n{2,}/)
      .map((para) => `<p>${para.replace(/[&<>]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[ch]!)}</p>`)
      .join("");
    const notes = [
      series ? `repeats: ${series}${e.recurrence?.exceptions?.length ? `, ${e.recurrence.exceptions.length} skipped dates` : ""}` : "one-off",
      venue?.created ? `new venue "${e.venue?.name}"` : "",
      organizer?.created ? `new organizer "${e.organizer?.name}"` : "",
      `confidence ${e.confidence ?? "?"}`,
    ].filter(Boolean);
    await upsert(
      p,
      "event",
      "events",
      slug,
      e.title,
      {
        title: e.title,
        slug,
        generateSlug: false,
        status: "draft",
        startsAt: start.toISOString(),
        endsAt: end?.toISOString(),
        allDay: Boolean(e.all_day),
        timezone: "America/Los_Angeles",
        rrule: series ?? undefined,
        exdates: series ? (e.recurrence?.exceptions ?? []).map((d) => ({ date: at(d, e.start_time).toISOString() })) : undefined,
        venue: venue?.id ?? undefined,
        organizer: organizer?.id ?? undefined,
        categories,
        cost: e.cost || undefined,
        url: e.event_website || undefined,
        body: htmlToLexical(paragraphs),
        seo: { description: e.excerpt?.slice(0, 160) },
        review: {
          state: "in-review",
          source: "claude",
          note: reviewNote([
            `[desk import] Event draft from the Operations Desk (checked ${e.verified ?? "?"}, confidence ${e.confidence ?? "?"}).`,
            e.recurrence?.rule && `Schedule as the desk wrote it: ${e.recurrence.rule}`,
            e.notes && `Desk notes: ${e.notes}`,
            e.image_note && `Photo: ${e.image_note}`,
            e.sources?.length && `Sources:\n- ${e.sources.join("\n- ")}`,
          ]),
        },
      },
      notes,
    );
  }
}

// ---------------------------------------------------------------- places (survey only)

async function surveyPlaces(p: Awaited<ReturnType<typeof payload>>, bundle: Record<string, string>) {
  const keys = Object.keys(bundle).filter((k) => /^rest\/data\/shops\/.+\.json$/.test(k) || k === "rest/data/soko-soko-japanese-cuisine-san-carlos.json");
  for (const k of keys) {
    const s = JSON.parse(bundle[k]) as { slug: string; name: string };
    const found = (await p.find({ collection: "places", where: { slug: { equals: s.slug } }, limit: 1, depth: 0, draft: true })).docs[0];
    report.push({
      kind: "place",
      slug: s.slug,
      title: s.name,
      action: "skip",
      reason: `waits for the design B place template (structured hours, items, good-to-know, FAQ fields); ${found ? `will update /${found.type === "restaurant" ? "restaurant" : "store"}/${s.slug}/` : "no existing place with this address yet"}`,
    });
  }
}

// ---------------------------------------------------------------- run

await run("desk-import", async () => {
  const dbUrl = process.env.DATABASE_URL ?? "";
  if (APPLY && !/@(localhost|127\.0\.0\.1)(:\d+)?\//.test(dbUrl)) {
    throw new Error("DESK_IMPORT_APPLY only writes to a database on this computer. Production imports need the owner's go-ahead and a separate run.");
  }
  const p = await payload();
  const bundle = JSON.parse(await fs.readFile(path.join(DESK, "bundle.json"), "utf8")) as Record<string, string>;

  await importPosts(p, bundle);
  await importGuides(p);
  await importProjects(p);
  await importEvents(p, bundle);
  await surveyPlaces(p, bundle);

  const pending = Object.keys(bundle).filter((k) => k.startsWith("pending/"));
  const rows = pending.reduce((n, k) => n + Object.values(JSON.parse(bundle[k]) as Record<string, unknown>).filter(Array.isArray).reduce((m, v) => m + (v as unknown[]).length, 0), 0);
  report.push({ kind: "civic watch rows", slug: "pending", title: `${rows} rows in ${pending.length} batches`, action: "skip", reason: "Civic Watch data; waits for the owner's go-ahead" });

  await fs.writeFile(path.join(DESK, "report.json"), JSON.stringify(report, null, 2));
  const by = new Map<string, Record<string, number>>();
  for (const r of report) {
    const m = by.get(r.kind) ?? {};
    m[r.action] = (m[r.action] ?? 0) + 1;
    by.set(r.kind, m);
  }
  console.log(`${APPLY ? "IMPORTED (local database)" : "DRY RUN (nothing written)"}`);
  for (const [kind, m] of by) console.log(`  ${kind.padEnd(20)} ${Object.entries(m).map(([a, n]) => `${a} ${n}`).join(", ")}`);
  for (const r of report.filter((x) => x.action === "skip" && x.kind !== "place")) console.log(`  skip ${r.kind}: ${r.slug} (${r.reason})`);
  console.log(`Full report: scripts/migrate/data/desk/report.json`);
});
