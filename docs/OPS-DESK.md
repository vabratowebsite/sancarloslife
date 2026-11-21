# Operations Desk inside the website

Owner's decision (2026-11-21): the San Carlos Life Operations Desk moves out of Claude and into the
website's admin, so it

- opens from any device and any Claude account (or none),
- keeps running around the clock, and
- survives losing the Claude account: code in GitHub, hosting on Vercel, data in Supabase, AI
  through an API key, all in accounts Vabrato owns.

Claude stays useful but optional: through the website connector it can read and edit drafts and
publish approved items, like any other editor.

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

1. **Desk core in the admin.** Approval queue and drafts for blogs, events, restaurant profiles,
   city projects and desk-made pages, each with status (draft → review → approved → published),
   versions and the on-page editor. Approving publishes. Desk-made pages are stored in the admin
   (not code) so they go live without a deploy.
2. **AI prompts library + AI connections.** One prompt per format (blog, event, restaurant,
   neighborhood, newsletter, city project, page) with structure, SEO/AEO/GEO rules, brand voice and
   compliance notes, versioned. Connections to any provider (Anthropic, OpenAI, Gemini, OpenRouter,
   any OpenAI-compatible API); keys encrypted server-side. "Generate draft" in the admin.
3. **Scheduled runs on the website.** Vercel Cron jobs scan sources (news sites, City pages,
   calendars, RSS) and draft with the stored prompts through the chosen AI. Run log and scan reports
   in the desk. Email-based scans need the website's own Google sign-in (Claude's Gmail connector
   won't be there).
4. **Move the existing desk content** (drafts, images, saved edits, leads, run history) into it.
5. **Website connector for Claude** (MCP): list, read, edit, create drafts, publish approved items.
   Then retire the Claude scheduled tasks that the website runs replace.

## Backups

Supabase daily backups (Pro plan), plus a weekly export of drafts and settings to Google Drive or
the GitHub repo.

## Needs the owner

- GitHub repo `vabratowebsite/sancarloslife` (code home; not reachable yet)
- Supabase Civic Watch database reachable (it times out), Supabase Pro before launch
- An AI provider API key for phase 2–3 (each run is billed by that provider)
- Google sign-in setup if email scans move to the website
