# Operations Desk inside the website

Owner's decision (2026-11-21, revised 22:11): **the middle path.** The desk's data and approval
queue move into the website's admin; Claude keeps doing the heavy research runs through the
website connector while the Claude account exists; API-based runs on the website are built as a
backup that takes over only when Claude isn't available. Goals: the desk

- opens from any device and any Claude account (or none),
- keeps running around the clock, and
- survives losing the Claude account: code in GitHub, hosting on Vercel, data in Supabase, AI
  through an API key, all in accounts Vabrato owns.

## Connections

- **Website connector (inbound, for any AI tool).** An MCP endpoint on the website (works with
  Claude, ChatGPT and other MCP clients) with desk tools: list and read drafts, pages, posts, events
  and places; create and edit drafts; submit for review; publish approved items; upload images;
  write run logs. Secured with a sign-in (OAuth) and per-user permissions. Payload's built-in REST
  API with per-user API keys stays available for scripts and automation tools.
- **AI connections (outbound, for backup runs).** Settings for Anthropic, OpenAI, Gemini,
  OpenRouter or any OpenAI-compatible API; keys encrypted server-side. Used by "Generate draft" and
  by the backup runs.
- **Failover.** Each scheduled job records a heartbeat when Claude's run finishes. If no Claude run
  has reported by the job's deadline, the website runs the API version of that job.

## What the current desk has (artifact "San Carlos Life Operations Desk")

About 300 files: the desk page, 45 blog drafts, 102 event drafts, 10 page drafts (city projects),
136 images, plus its own storage (saved text edits with history, leads). Areas:

| Area | What it does |
|---|---|
| Overview | Scheduled runs, blogs waiting for approval, this week, scan reports, approval queue |
| Civic Desk | City projects, Citizen Voice, money, follow-through, coverage |
| Blogs | Drafts with SEO title/description, sources, call to action, word count, status |
| Email newsletter | Weekly issue preview and approval |
| Images | Every image spot, its legal source (own photo, City, Unsplash, labeled AI) |
| Run schedule, Analytics, Content suggestions, System load | Operations |
| Local News | Story feed by relevance, suggest a story, blog drafts, newsletter sign-ups, sources, scan log |
| Events | This week, suggest an event, drafts for the events calendar, calendars checked, scan log |
| Restaurants & Business | Profile templates, restaurant and shop profiles, suggestions, scan log |
| Real estate | Market Pulse, Listing Watch, Lead inbox, homeowner impact, page drafts, content plan and CTA rules, compliance check, data access |
| Editor | Edit text, photo swap (library/upload, crop, alt), Save, Discard, Versions (last 10), Restore |

## Build phases

1. **Desk core in the admin.** ✅ Built 2026-11-21. Approval queue and drafts for blogs, events, restaurant profiles,
   city projects and desk-made pages, each with status (draft → review → approved → published),
   versions and the on-page editor. Approving publishes. Desk-made pages are stored in the admin
   (not code) so they go live without a deploy.
2. **AI prompts library + AI connections.** ✅ Built 2026-11-21 (blog and guide page formats; events,
   restaurant profiles, city projects and newsletters next). One prompt per format (blog, event, restaurant,
   neighborhood, newsletter, city project, page) with structure, SEO/AEO/GEO rules, brand voice and
   compliance notes, versioned. Connections to any provider (Anthropic, OpenAI, Gemini, OpenRouter,
   any OpenAI-compatible API); keys encrypted server-side. "Generate draft" in the admin.
3. **Backup scheduled runs on the website** ✅ Built 2026-11-22 (Desk jobs collection, /cron/desk/ runner, page and RSS sources; email scans not yet) (only run when Claude's run hasn't reported). Vercel Cron jobs scan sources (news sites, City pages,
   calendars, RSS) and draft with the stored prompts through the chosen AI. Run log and scan reports
   in the desk. Email-based scans need the website's own Google sign-in (Claude's Gmail connector
   won't be there).
4. **Move the existing desk content** (drafts, images, saved edits, leads, run history) into it.
5. **Website connector** (MCP, see Connections): ✅ built 2026-11-21/22 (bearer API keys, and OAuth sign-in so claude.ai and ChatGPT can add it as a custom connector). Claude's research runs switch from writing into the
   artifact to writing into the website; the artifact desk is retired once the website desk is in use.

## Backups

Supabase daily backups (Pro plan), plus a weekly export of drafts and settings to Google Drive or
the GitHub repo.

## Needs the owner

- GitHub repo `vabratowebsite/sancarloslife` (code home; not reachable yet)
- Supabase Civic Watch database reachable (it times out), Supabase Pro before launch
- An AI provider API key for phase 2–3 (each run is billed by that provider)
- Google sign-in setup if email scans move to the website

## Phase 4: moving the artifact desk's content in

Read-only survey on 2026-11-22 of the "San Carlos Life Operations Desk" artifact (version
`1795226294-9e51`, 469 files). The artifact also ships `src/bundle.json`: the desk's own
structured data and build scripts. Import from that data where it exists, not from the rendered
HTML previews (those were built for Divi code modules).

| Desk content | Count | Best source | Goes to | Notes |
|---|---|---|---|---|
| Blog drafts | 45 | `pages/blogs.py`, `pages/blogs_index.json` (slug, title, SEO, focus, words, verify list); `blogs/*.html` for the body | `posts` as drafts in review (source claude) | Body as a sanitized raw-HTML block (like migrated WordPress posts) or rebuilt into sections; the SEO META comment gives title, description, focus keyword, category. "Verify" items go to the review note. |
| News briefs | 22 (+16 in `news_index.json`) | `pages/news_index.json`, `news/*.html` | `posts` (Community News category), drafts in review | `news/feed.json` (123 found items) is desk research, not site content: it belongs in Civic Watch `public.news_items` (see pending rows). |
| Event drafts | 102 pages; 49 structured drafts + 44 source calendars | `events/events.json` (`drafts`: dates, times, recurrence, venue, organizer, cost, description, sources, confidence) | `events` (status draft), venues/organizers matched by WordPress id or name | Recurrence maps to `rrule` + `exdates`; skip past dates; `image_note` means a photo is still needed; sources and confidence go to the review note. The 44 calendars become the event job's sources. |
| City project pages | 10 (`drafts/*.html`) | `pages/index.json` (slug, title, SEO, FAQ, verify), `pages/content.py` | `city-projects` drafts (9) + the hub text for /city-projects/ | Centennial Plaza, Downtown Specific Plan, Streetscape Master Plan, Harrington Park, Measure G, Northeast Area Specific Plan, Aquatic Center, Parks Master Plan, US-101/Holly. |
| Real estate pages | 8 (`re/*.html`) | `pages/re_index.json`, `pages/re_pages.py` | ADU/SB 9 guide, buying, selling and market report as `desk-pages` (guide template); home value, calculators, kit and the neighborhood template are covered by existing code routes | For the covered ones, bring wording changes in through the on-page editor rather than importing. |
| Restaurant and shop profiles | 19 pages (Soko Soko in 3 variants + 16 shops) | `rest/data/shops/*.json`, `rest/data/soko-soko-…json` (address, geo, hours, story, items, FAQ, photos, sources, verify) | existing `places` records (matched by slug), as new draft versions in review | Owner picks the Soko Soko variant (a, b or c). |
| Photos | 251 (210 JPEG, 23 PNG, 1 WebP) + 17 `photos.json` + `pages/image_plan.json` (238 planned slots) | `img/**` with the JSON alt text and slot (logo, hero, grid) | `media` (re-encoded with sharp like `attach_photo`), linked as place cover/logo/gallery and post covers | Credit "Vabrato Real Estate Services" where the file is theirs; anything else needs the owner's confirmation of rights. |
| Newsletters | 9 issues + logo | `newsletter/*.html` | Not site content | Optional later: a newsletter archive page. |
| Meeting transcripts | 3 transcripts, 1 extract, 144-meeting index | `tx/*` | Civic Watch tables (meetings, agenda items, decisions…) | Ops desk data, not the website. |
| Pending Civic Watch rows | 145 rows in 18 batches (Nov 3–20) | `pending/supabase_*.json` | Civic Watch `public.*` tables | Written by the desk but never inserted: the database refused or timed out at the time. It is reachable now. Inserting them changes ops desk data, so it waits for the owner. |
| Desk code and runbook | `RUNBOOK.md`, `*_patch.py`, build scripts, `news/source_directory.txt` | | Reference | The runbook's jobs, schedules and source lists become `desk-jobs` entries. |
| Saved text edits, leads, run history | in the artifact's own storage, not its files | | | Needs an export from the artifact page itself (owner); leads hold personal data. |

How the import runs: `scripts/migrate/90-desk-import.ts` reads a local copy of the artifact files in
`scripts/migrate/data/desk/` (gitignored: `bundle.json`, `manifest.json` and the `blogs/`, `news/`,
`drafts/`, `re/` folders, copied from the artifact). `pnpm migrate:desk` is a dry run that writes
`data/desk/report.json`; `DESK_IMPORT_APPLY=1 pnpm migrate:desk` writes, and refuses unless
DATABASE_URL points at this computer. Everything lands as drafts in review (source claude, review
note starting with `[desk import]`), never published. Items are matched by slug and the script only
overwrites items it created itself, so it can be re-run after the artifact changes.

What the cleaner does to the desk HTML: drops photo placeholders (listed in the review note as
photos still needed), the desk's "verify" boxes (listed in the review note), scripts, styles, forms,
chrome, kicker labels, NEW tags and progress trackers; turns `<time>` into a bold date label, chip
rows into lists, `<details>` into a heading and answer, key/value rows into paragraphs; relativizes
links to sancarloslife.com. Footnote markers keep working: source lists get `id="fn-N"`.

Local result (2026-11-22, dev database only): 45 blogs and 22 news briefs as posts (categories
mapped from the SEO META, default News Blog), 4 real estate guides as desk pages (ADU/SB 9, buying,
selling, market report; sections split at each H2), 9 city projects (status mapped from the desk's
stage; the hub page is skipped), 46 events (18 recurring, rrule + exdates; 3 past events skipped;
venues and organizers matched by WordPress id or name, created if missing). Places (17 profiles) are
imported by `pnpm migrate:desk-places` (scripts/migrate/91-desk-places.ts) into the design B fields as draft versions in review. The pending Civic Watch rows are counted,
not inserted.

Production: run against Supabase only after the owner's go-ahead and after the migrations are
applied there (the script's localhost guard has to be lifted deliberately for that run).

Questions for the owner before importing:
1. ~~Which Soko Soko profile variant to keep~~: design B (2026-11-22).
2. ~~Whether to insert the 145 pending rows~~: yes; inserted 2026-11-22 (scripts/civic/pending-rows.py).
3. Whether to add a newsletter archive page.
4. Rights and credits for photos that aren't Vabrato's own.
5. Real estate pages: the four without a code route are imported as guide pages; the other four stay code routes.
