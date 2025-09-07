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

- Edit `prisma/schema.prisma` datasource to use Postgres:

```
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

- Set in `.env.local`:

```
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DBNAME?schema=public
```

- Apply migrations:

```
npx prisma migrate deploy
```

## Scripts

- `pnpm dev` — run Next dev
- `pnpm build` — build
- `pnpm prisma:migrate` — migrate in dev
- `pnpm prisma:seed` — seed database
- `pnpm test` — run unit tests (sr logic, tree utils, one API route)

## Repo Layout

- `prisma/schema.prisma` — data model
- `src/app` — App Router pages and API routes
- `src/components` — UI components
- `src/lib` — db client, SR and metrics logic, validations
- `src/tests` — vitest unit tests

## Acceptance Criteria Mapping

- Nested folders: left navigation tree with inline rename and delete
- Metrics: Strength, Completion Today, and Streak tiles on dashboard
- Notes: create, schedule to SR, review Good/Again
- Flashcards: create, show answer, Good/Again reschedules
- Tasks: create with due date, mark done today (affects Completion Today)
- Streak: Count today button snapshots metrics and bumps streak when >= 60% once per day
- Persistence: Prisma + SQLite by default; reloading persists
- Tests: SR logic, subtree aggregation, one API route

## Notes

- For production, add auth (NEXTAUTH_SECRET stub included) and wire to user accounts if needed.
- UI is minimal Tailwind for clarity; extend as desired.
