# PrepOS

Full‑stack Next.js 14 + Prisma app for nested prep workspaces with topics, notes, flashcards, tasks, and spaced repetition.

## Stack

- Next.js 14 App Router, React, TypeScript
- Prisma ORM
- SQLite (local) and Postgres (production)
- Zod for request validation
- Tailwind CSS
- React Query for client-side fetching
- Vitest for unit tests

## Quickstart

1) Install deps

```
pnpm install
```

2) Configure env

```
cp .env.example .env.local
cp .env.example .env   # Prisma reads .env
# For local SQLite keep defaults:
# DATABASE_URL=file:./dev.db
```

3) Run Prisma migrate + seed

```
npx prisma migrate dev
pnpm prisma:seed
```

4) Start dev server

```
pnpm dev
```

App runs at http://localhost:3000

Note on env files
- Prisma CLI reads variables from `.env` specifically. Next.js reads from `.env.local`.
- Keep both files in dev so Prisma (migrate/seed) and Next.js share the same DB URL.

## Switch to Postgres

This repo is now configured for Postgres by default (schema provider = `postgresql`).

Cloud deploy (Vercel + Neon):

1) Create a Neon Postgres and copy the pooled connection string (contains `-pooler` and `sslmode=require`).

2) Apply migrations to Neon from your machine:

```
export DATABASE_URL='postgresql://USER:PASSWORD@ep-xxxx-pooler.REGION.aws.neon.tech/neondb?sslmode=require'
npx prisma migrate deploy
pnpm prisma:seed   # optional demo data
```

3) Deploy to Vercel:
 - Import the GitHub repo
 - In Vercel Project → Settings → Environment Variables: add `DATABASE_URL` with the Neon pooled URL
 - Deploy

Local dev against Neon (recommended):
 - Set `DATABASE_URL` in `.env.local` to the same Neon pooled URL
 - `pnpm dev`

If you prefer SQLite locally, you must change `provider` back to `sqlite` in `prisma/schema.prisma` and update `DATABASE_URL`, but this diverges from production and is not recommended.

## Scripts

- `pnpm dev` — run Next dev
- `pnpm build` — build
- `pnpm prisma:migrate` — migrate in dev
- `pnpm prisma:seed` — seed database
- `pnpm test` — run unit tests (sr logic, tree utils, one API route)

