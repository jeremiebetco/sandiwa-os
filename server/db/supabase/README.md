# Supabase setup (SQL Editor)

**Schema and seed are manual only.** Do not run `pnpm db:migrate` / `pnpm db:seed` in CI or Vercel.

Run these **in order** in Supabase → **SQL Editor** → **New query**:

1. `01_schema.sql` — creates tables
2. `02_rls.sql` — edit `CHANGE_ME` to a password you choose, then run
3. `03_seed.sql` — demo data (login password: `demo1234`)

## Vercel

Set `DATABASE_URL` to your Supabase **transaction pooler** URL (port 6543), with:

- user: `sandiwa_app.YOUR_PROJECT_REF`
- password: same value you used instead of `CHANGE_ME` in `02_rls.sql`

Also set `SESSION_SECRET` and `NUXT_PUBLIC_PLATFORM_DOMAIN`.

Vercel build/deploy must **not** run database scripts — only the Nuxt build.

Regenerate these SQL files after schema changes (local): `pnpm db:export-supabase`
