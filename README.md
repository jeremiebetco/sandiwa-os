# Sandiwa OS — HOA Edition

Multi-tenant homeowners association (HOA) operations platform for the Philippines. Nuxt 4 SPA with a Nitro API, **Postgres 16 + Drizzle ORM**, httpOnly session cookies, and row-level security for tenant isolation.

> **Public demo only.** Sample orgs and accounts (`demo1234`) are shared. Do **not** enter real member, payment, or board data on a public deploy. See [SECURITY.md](SECURITY.md) before any production use.

## Prerequisites

- Node.js **24.18.0** (see `.nvmrc` — run `nvm use`)
- pnpm 11.9.0
- Docker (for local Postgres on port **5433**)

## Quick start

```bash
pnpm install
pnpm db:setup    # docker compose up + migrate + seed
pnpm dev
```

`pnpm db:setup` starts Postgres at `localhost:5433` (database `sandiwa_os`). The app connects as **`sandiwa_app`** (RLS enforced). Migrate/seed use **`sandiwa`** via `DATABASE_URL_ADMIN` (superuser — required because the Docker bootstrap role bypasses RLS).

### Useful database scripts

| Script | Purpose |
|--------|---------|
| `pnpm db:up` | Start Postgres container |
| `pnpm db:migrate` | Apply Drizzle migrations + RLS policies |
| `pnpm db:seed` | Reset demo data (hashed passwords) |
| `pnpm db:reset` | Wipe public + drizzle schemas (does not seed) |
| `pnpm db:fresh` | Wipe, migrate, and seed in one command |
| `pnpm db:studio` | Drizzle Studio |
| `pnpm db:export-supabase` | Regenerate SQL files under `server/db/supabase/` |

## Hostnames

| URL | Context |
|-----|---------|
| http://sandiwa.localhost:3000 | Platform admin |
| http://greenfield-hoa.sandiwa.localhost:3000 | Greenfield Village HOA |
| http://sunrise-condo.sandiwa.localhost:3000 | Sunrise Condominium HOA |

Tenant routing: `NUXT_PUBLIC_TENANT_ROUTING` = `auto` | `subdomain` | `path`. On `*.vercel.app`, path mode `/o/{slug}` is used automatically.

## Product surfaces

| Surface | Paths | Who |
|---------|--------|-----|
| Impact | `/`, `/announcements`, `/alerts`, `/portal/*` | Public landing + member portal |
| Console | `/console`, `/console/modules/*` | Org staff |
| Platform | `/platform/*` | Platform admin on the main domain |

Impact includes EN/TL and Listen (announcements, alerts, member statement). Console and Platform do not.

## Demo accounts

Password for all accounts: `demo1234` (login forms do **not** prefill the password).

**Platform** (`sandiwa.localhost`): `admin@sandiwa.local`

**Greenfield staff** (role id in parentheses):

| Email | Role |
|-------|------|
| `admin@greenfield-hoa.local` | `org_admin` |
| `manager@greenfield-hoa.local` | `manager` |
| `chair@greenfield-hoa.local` | `committee_lead` |
| `staff@greenfield-hoa.local` | `staff` |

**Greenfield members** (Member tab or `?member=1`):

| Email | Unit |
|-------|------|
| `member@greenfield-hoa.local` | Block 3 Lot 12 |
| `member2@greenfield-hoa.local` | Block 5 Lot 08 |

**Sunrise:** `admin@sunrise-condo.local` (`org_admin`), `member@sunrise-condo.local`

## Modules

Each plugin is gated by `org.features[plugin]`, the org’s plan, and the role matrix in `app/core/rbac/permissions.ts`.

| Plugin | What it does |
|--------|----------------|
| `announcements` | Public + console announcements |
| `intake` | Member requests; staff queue |
| `payments` | Dues, payment submit, verify, clearances, aging |
| `ledger` | Accounts, vouchers, entries |
| `polls` | One vote per unit |
| `broadcasts` | Portal alerts |
| `staff_management` | Org users (`org_admin` only) |
| `landing_editor` | Landing copy and brand pack |

### Seed orgs (`pnpm db:setup`)

| Org | Plan | Off |
|-----|------|-----|
| `greenfield-hoa` | premium | `ledger` |
| `sunrise-condo` | standard | `broadcasts` (seed also sets `ledger` on) |

### Plan caps (Features UI)

What the platform Features screen allows, from `PLAN_PLUGIN_LIMITS`:

| Plan | Plugins |
|------|---------|
| basic | announcements, intake |
| standard | announcements, intake, payments, polls, staff_management, landing_editor |
| premium | all plugins |

Seed Sunrise is `standard` with `ledger: true`, which is outside that plan list. `pnpm db:setup` still produces that mix. Saving Features in the UI applies the plan list above.

### Org roles

| Role | Console modules | Notes |
|------|-----------------|-------|
| `org_admin` | all enabled plugins | Only role that can manage staff |
| `manager` | all except `staff_management` | Approves vouchers; can close polls and send broadcasts |
| `committee_lead` | `intake`, `polls` | Intake: assigned cases; can create polls, cannot close |
| `staff` | `intake`, `payments`, `announcements` | Can verify payments and review clearances |
| `member` | portal only | Can submit a payment (`payment.post`) |

## Architecture

```
Browser SPA  →  Nitro /api  →  Drizzle  →  Postgres (RLS)
                 cookies + CSRF checks
                 withOrgContext() SET LOCAL app.current_org_id
```

- Auth: scrypt password hashes, `sessions` table, httpOnly `SameSite=Lax` cookie (HMAC’d with `SESSION_SECRET`)
- Tenant binding: session `organizationSlug` must match the requested tenant (critical for path-based routing)
- Demo reset API is **off** in production; local UI reset needs `ALLOW_DEMO_RESET=true`
- Assets: brand images under `public/assets/`
- Reserved, unused env keys: `NUXT_AI_API_KEY`, `NUXT_PAYMONGO_SECRET_KEY`, `NUXT_SMS_API_KEY` (intake auto-triage, card capture, SMS — not built)

## Hosted Postgres (Supabase)

Run the SQL files in **[server/db/supabase/](server/db/supabase/)** (in order). See that folder’s README for the pooler URL, `CHANGE_ME` password, and Vercel vars:

```
DATABASE_URL=...          # sandiwa_app via transaction pooler (port 6543)
SESSION_SECRET=...
NUXT_PUBLIC_PLATFORM_DOMAIN=your-app.vercel.app
```

After schema changes: `pnpm db:export-supabase`.

## Docs

- Product: [Sandiwa-OS.txt](Sandiwa-OS.txt)
- Security: [SECURITY.md](SECURITY.md)
- UI conventions: [docs/ui.md](docs/ui.md)
- Hosted database: [server/db/supabase/README.md](server/db/supabase/README.md)

## Smoke checklist

1. `pnpm db:setup && pnpm dev`
2. Platform login → org list → Features
3. Greenfield Impact landing → EN/TL toggle → Announcements → Listen
4. Member login → portal → statement → submit payment
5. Staff login → intake / payments (staff cannot open ledger, polls, or broadcasts)
6. Unknown subdomain → not-found
7. Logged-in Greenfield staff must get 403 calling Sunrise APIs
