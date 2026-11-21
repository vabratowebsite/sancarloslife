# SanCarlosLife.com

The rebuild of sancarloslife.com: a community guide to San Carlos, CA, and the lead site for
Vabrato Real Estate. It replaces the WordPress/Divi site with one Next.js app on Vercel, a Payload
admin and a Supabase Postgres database shared with the San Carlos Civic Watch ops desk.

- Full plan: [docs/PLAN.md](docs/PLAN.md)
- Instructions for coding agents (any AI tool): [AGENTS.md](AGENTS.md)

## Run it

```bash
pnpm install
cp .env.example .env.local   # fill in values
pnpm dev                     # http://localhost:3000
```

## Deploy

Pull requests get a Vercel preview. Merging to `main` deploys production. Setup, first deploy,
Buying Buddy and the domain cutover: [docs/DEPLOY.md](docs/DEPLOY.md).

## Test

```bash
pnpm test                 # unit tests (Vitest)
pnpm test:e2e             # end-to-end + accessibility against a running site (Playwright)
pnpm migrate:verify       # every old WordPress URL still answers
```
