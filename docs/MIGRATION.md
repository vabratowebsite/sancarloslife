# WordPress → Payload migration

All scripts are in `scripts/migrate/`. They only read from the live site (public REST API and
public pages) and write to the database in `DATABASE_URL`. Each import upserts by WordPress id or
slug, so the whole chain can be rerun for the cutover delta.

```bash
pnpm migrate:all        # export → SEO scrape → posts → events → places → misc → redirects
pnpm migrate:verify     # BASE_URL=<site> — every old sitemap URL must reach a 200 in ≤ 1 redirect
```

| Step | Script | Result (local run, 2026-11-21) |
|---|---|---|
| Export | 00-export-wp.ts | 244 posts, 55 pages, 6,978 media records, 808 events, 144 venues, 130 organizers, 53 restaurants, 16 stores, 100 event categories, 1,248 sitemap URLs |
| SEO head | 05-scrape-seo.ts | Rank Math title, description, robots and JSON-LD for 1,177 live URLs (71 already redirect) |
| Posts | 20-posts.ts | 16 categories, 244 posts (all published), Divi markup removed, images copied, internal links made relative |
| Events | 30-events.ts | 100 categories, 144 venues, 130 organizers, 808 events (past ones archived, URLs /event/<slug>/ unchanged) |
| Places | 40-places.ts | 69 places (restaurants keep /restaurant/<slug>/, stores /store/<slug>/), hours, links, galleries, map points |
| Misc | 50-misc.ts | 48 history timeline stories, 6 testimonials, 6 neighborhoods (highlights + FAQ), 36 pages, Videos page (15 restaurant videos + playlist) |
| Parks | 55-parks.ts | 12 parks from the parks page (name, description, acres, directions). The live page repeats other parks' addresses for Frank D. Harrington, Highlands and Vista Park; those addresses are left empty for an editor to fill in |
| Redirects | 60-redirects.ts | 139 rules: 36 from Rank Math, 100 for moved/dropped content, 3 already redirecting live |

## What the export can't see without a WordPress login

- **Drafts and private posts**: set `WP_APP_USER` and `WP_APP_PASSWORD` (an application password) and rerun the export.
- **Rank Math redirects**: read once through WPVibe (read-only SQL) and saved in `rankmath-redirects.json`.
- **Envira gallery and Gravity Forms entries**: not in the public API. The gallery page is rebuilt in milestone 15; form entries are not migrated (the new forms store their own submissions).

## Decisions

- Only media that migrated content uses is copied (1,150 files so far), not the whole 6,978-item library.
- Rank Math descriptions over 300 characters are automatic excerpts; they are trimmed to about 155 characters. Hand-written ones (≤ 300) are kept exactly.
- Timeline and testimonial URLs already redirect to the home page on the live site; they now redirect to the history page and the Viv & Mark page.
- iHomefinder listings, WP Google Maps, Gravity Forms and MailOptin blocks are removed from migrated HTML; the new site rebuilds those features.
