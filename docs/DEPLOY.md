# Deploying sancarloslife.com

How to take this repo from a laptop to Vercel, and how to switch the domain from WordPress at
cutover. Steps marked **(owner)** need an account login, a payment or a decision from Vabrato;
everything else can be done by a developer or a coding agent.

The plan this follows is docs/PLAN.md section 10. Where this file differs, this file is newer:
the database is the **San Carlos Civic Watch** Supabase project (shared with the ops desk), not a
new project.

## 1. What runs where

| Piece | Where | Notes |
|---|---|---|
| Website + admin (`/admin`) | Vercel project (new, in team VabratoRealEstate) | Next.js 16, Node 22, pnpm 9 |
| Database | Supabase project "San Carlos Civic Watch" (ref `nhgpjfekrlxtgjjoglzh`) | Website tables live only in the `web` schema; the ops desk's tables are never touched |
| Media files | Cloudflare R2 bucket `sancarloslife-web` (S3 API) | Set the `S3_*` variables; without them uploads go to local disk. Never use the older `sancarloslife` bucket (the WordPress site's) |
| Email | Resend | Form notifications and guide emails |
| Newsletter | MailerLite | Sign-ups only; we don't store addresses |
| Bot check | Cloudflare Turnstile | Forms refuse submissions in production without the secret key |
| Listings | Buying Buddy (package installed; needs the activation key) | See section 6 |
| Ops desk backup runner | Vercel Cron → `/cron/desk` (vercel.json) | Daily at 20:17 UTC on Hobby (Hobby allows one run a day); change to hourly (`17 * * * *`) once the team is on Pro |

## 2. One-time setup

1. **GitHub (owner).** Create the private repo `vabratowebsite/sancarloslife` (empty, no README).
   Then push every branch from the working copy:
   `git remote add origin git@github.com:vabratowebsite/sancarloslife.git && git push -u origin --all`.
   Protect `main` (pull requests only).
2. **Supabase (owner).** In the Civic Watch project:
   - Copy the **pooled** connection string (Transaction pooler, port 6543) for `DATABASE_URL`.
   - Create the Storage bucket `media` with public read, then an S3 access key
     (Project Settings → Storage → S3 connection) for the `S3_*` variables.
   - Upgrade to **Pro ($25/mo)** before launch. Free projects pause when idle (this project was
     paused during the build), and a paused database takes the whole site down.
3. **Vercel (owner for billing).** New project from the GitHub repo, framework Next.js, root `/`,
   install `pnpm install`, build `pnpm build`. Add the environment variables from `.env.example`
   separately for Production and Preview (section 3). Commercial sites need the **Pro plan
   ($20/mo per member)**.
4. **Resend.** Verify `sancarloslife.com` as a sending domain (SPF and DKIM records at the DNS
   host), create an API key.
5. **Turnstile.** One widget for `sancarloslife.com` and `*.vercel.app`; copy the site key and
   secret.
6. **MailerLite.** API token and the group ids for Newsletter, Events, Real estate and Guides.
7. **GA4 (optional).** Measurement id for `NEXT_PUBLIC_GA_ID`. Analytics only loads after a
   visitor accepts the cookie banner.

## 3. Environment variables

All names are in `.env.example`. Production vs Preview:

| Variable | Production | Preview |
|---|---|---|
| `DATABASE_URL` | Civic Watch pooled URL | Same database (see the warning below) |
| `PAYLOAD_SECRET` | 32+ random characters (`openssl rand -hex 32`) | A different random value |
| `NEXT_PUBLIC_SITE_URL` | `https://sancarloslife.com` | The preview URL, or leave the production value |
| `ALLOW_INDEXING` | `true` **only at cutover** | Never |
| `PAYLOAD_DB_PUSH` | Never set | Never set |
| `S3_*` | `S3_BUCKET=sancarloslife-web`, `S3_ENDPOINT=https://<account id>.r2.cloudflarestorage.com`, `S3_REGION=auto`, keys from an R2 API token limited to this bucket (Object Read & Write) | Same bucket |
| `RESEND_API_KEY`, `FORMS_NOTIFY_TO`, `EMAIL_FROM` | Real values | Same, or leave the key empty so previews only log |
| `TURNSTILE_SECRET_KEY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Real keys | Real keys (the widget covers `*.vercel.app`) |
| `MAILERLITE_*` | Real values | Leave empty |
| `NEXT_PUBLIC_GA_ID` | Optional | Leave empty |
| `CRON_SECRET` | 16+ random characters (`openssl rand -hex 24`); Vercel Cron sends it automatically | Leave empty (the runner is off without it) |
| `NEXT_PUBLIC_BUYINGBUDDY_KEY` | Buying Buddy activation key | Same key (authorize the preview domain in Buying Buddy) |

Warning: previews and production share one database, so content edited in a preview admin is live
content. That's fine for this site's size; a separate preview database is a paid Supabase feature.

## 4. First deploy

From a laptop with the production `DATABASE_URL` in `.env.local` (never commit it):

```bash
pnpm install
pnpm payload migrate            # creates the web schema and tables; asks nothing, changes only "web"
pnpm migrate:all                # imports posts, events, places, page SEO records, media, redirects from WordPress
```

Schema changes against the production database are asked about first (AGENTS.md rule), so
migrations are run by hand like this, not in the Vercel build. There is one migration,
`src/migrations/*_initial.ts` (the earlier ones were squashed before anything was deployed).
`migrate:all` reads from the live
WordPress site and the WP REST API (set `WP_APP_USER` and `WP_APP_PASSWORD`); with the `S3_*`
variables set, media is uploaded to the Supabase bucket as it imports.

Then:

1. Open `https://<project>.vercel.app/admin`, create the first user (it becomes the admin), then
   invite editors from Users.
2. Fill in Settings (phone, email, social links) if anything changed. Page text ships with the
   code; to change words or photos on a page, use **Edit site pages** on the admin dashboard
   (or **Edit this page** on the site).
3. Check the preview against the launch checklist (section 7).

## 4b. When the database can't be reached from your computer (how the demo was set up)

1. In Supabase (SQL editor, as `postgres`): create a login role that owns only the website schema:
   `create role scl_web login password '<random>'; grant scl_web to postgres;`
   `create schema if not exists web authorization scl_web; alter role scl_web set search_path = web;`
   `DATABASE_URL` is then the transaction pooler URL with user `scl_web.<project ref>`.
2. In Vercel, set `DATABASE_URL`, `PAYLOAD_SECRET`, `NEXT_PUBLIC_SITE_URL`, and a temporary
   `SETUP_SECRET` (32+ random characters). For the first build only, set the build command to
   `pnpm payload migrate && pnpm build` (static pages read the database while building).
3. Push the content from a computer that has it locally:
   `SETUP_URL=https://<deployment>/cron/setup SETUP_SECRET=… VERCEL_BYPASS=<protection bypass> node scripts/setup/push-content.mjs`
   It copies everything except accounts, sessions, form submissions, OAuth apps and tokens, AI
   keys, saved page edits, desk run logs and jobs, and items made by the automated tests.
4. Remove `SETUP_SECRET` and the custom build command, then redeploy so static pages rebuild
   with the content. Open `/admin` and create the first user (it becomes the admin).

## 5. Every change after that

1. Work on a `feature/*` branch, open a pull request. Vercel builds a preview.
2. Run the checks against the preview:
   `pnpm test` and `BASE_URL=https://<preview>.vercel.app pnpm test:e2e`.
3. If the branch adds a migration (`src/migrations/`), run `pnpm payload migrate` against
   production after approval, before merging.
4. Merge to `main`; Vercel deploys production.

## 6. Turning on Buying Buddy listings (owner first)

Nothing here costs money until step 1.

1. **(owner)** Sign up for the Buying Buddy Agent plan ($49/mo), file the MLSListings IDX request
   (broker signature from Vabrato), and authorize `sancarloslife.com` and the Vercel preview domain.
2. ✅ `@buyingbuddy/react` installed; widgets, disclaimer and CSP are wired (2026-11-22).
3. In Buying Buddy's Widget Wizard, build the San Carlos results, open-house and map widgets and paste
   each `data-filter` value into `src/content/idx.ts`; paste each neighborhood's filter into
   Neighborhoods → "Buying Buddy filter" in the admin.
4. Set `NEXT_PUBLIC_BUYINGBUDDY_KEY` (Widgets → Plugin Installation and Setup) in Vercel and
   redeploy (it's read at build time). Without it every slot shows the contact fallback.
   Then open a listings page and check the browser console for "Invalid account" (domain not
   authorized) or Content Security Policy errors.
5. Once Buying Buddy confirms how outside forms send leads, set `BUYINGBUDDY_LEAD_EMAIL`.
6. Import iHomefinder leads into the Buying Buddy CRM; cancel iHomefinder only after cutover.

## 6b. Connecting Claude or ChatGPT to the website

The website is an MCP connector at `https://sancarloslife.com/mcp` (use the preview URL to test).
In claude.ai or ChatGPT, add a custom connector with that URL. The app registers itself, opens the
website's sign-in, and an editor or admin approves it once. Connected apps and their sign-ins are
listed in the admin under Operations Desk; delete a Connected app to sign it out. Claude Code and
scripts can instead send a staff user's API key as `Authorization: Bearer <key>`.

## 7. Launch checklist

All of these pass before the DNS switch:

- [ ] `BASE_URL=https://<production-vercel-url> pnpm migrate:verify` reports every old URL as 200
      (or one redirect hop); the only allowed 410 is `/locations.kml`.
- [ ] `pnpm test:e2e` passes against the production Vercel URL.
- [ ] Every form arrives by email (Resend log) and stores a row in Form submissions.
- [ ] Turnstile, Resend and MailerLite keys set in Production.
- [ ] Supabase Pro and Vercel Pro active.
- [ ] Buying Buddy live on listings pages with the MLSListings disclaimer (or a decision to launch
      without listings).
- [ ] Privacy, Terms and Cookie Policy pages reviewed; accessibility statement added.
- [ ] Tested on a real iPhone, Android phone, iPad and desktop Chrome and Safari.
- [ ] Open data issues from the build resolved (park addresses, see AGENTS.md).

## 8. Cutover (owner approves each step)

1. Freeze WordPress edits; announce 48 hours ahead.
2. Re-run the content imports for anything published since the last import, then
   `pnpm migrate:verify` against production.
3. **(owner)** At the DNS host, point the apex and `www` at Vercel (add both domains in Vercel →
   Domains and follow its records). Keep the email (MX, SPF, DKIM) records as they are.
4. In Vercel Production set `ALLOW_INDEXING=true` and redeploy.
5. Check HTTPS, `www` → apex, `/robots.txt` (allows crawling, lists the sitemap) and
   `/sitemap.xml`.
6. Resubmit the sitemap in Google Search Console and Bing Webmaster Tools; confirm GA4 hits after
   accepting the cookie banner.
7. Keep WordPress reachable at `old.sancarloslife.com` with noindex for 60 days, then
   **(owner)** cancel hosting and plugin renewals.
8. For 60 days, review 404s in Vercel logs and add redirects in the admin (Redirects collection,
   admins only).

## 9. If something breaks

- **Site down, database errors:** check the Supabase project isn't paused (free plan) and that
  `DATABASE_URL` is the pooled URL.
- **Page editor says "sign-in has expired" on Save:** the site must be opened on `NEXT_PUBLIC_SITE_URL`
  or its Vercel URL; saves from any other address are refused (CSRF protection). `NEXT_PUBLIC_SITE_URL`
  is fixed at build time, so redeploy after changing it.
- **Admin login fails on a preview:** the preview URL must be in Payload's allowed origins; it is
  added automatically from `VERCEL_URL` and `VERCEL_BRANCH_URL`.
- **New third-party embed blank:** its host is missing from `CSP_SOURCES` in
  `security-headers.mjs`.
- **Content edited but page unchanged:** pages revalidate on save; a script run outside Next can't
  trigger that, so wait for the time-based refresh (10 minutes to 1 hour) or redeploy.
- **Roll back:** in Vercel → Deployments, promote the previous production deployment. Database
  migrations in this repo only add tables and columns, so an older deployment still runs.
