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
5. **Website connector** (MCP, see Connections): ✅ first part built 2026-11-21 (bearer API keys; OAuth sign-in for claude.ai/ChatGPT next). Claude's research runs switch from writing into the
   artifact to writing into the website; the artifact desk is retired once the website desk is in use.

## Backups

Supabase daily backups (Pro plan), plus a weekly export of drafts and settings to Google Drive or
the GitHub repo.

## Needs the owner

- GitHub repo `vabratowebsite/sancarloslife` (code home; not reachable yet)
- Supabase Civic Watch database reachable (it times out), Supabase Pro before launch
- An AI provider API key for phase 2–3 (each run is billed by that provider)
- Google sign-in setup if email scans move to the website
