# Sandiwa OS — HOA Edition

Multi-tenant homeowners association (HOA) operations platform for the Philippines. This POC runs as a Nuxt 4 SPA with client-side tenant resolution, Pinia state, and localStorage persistence.

## Product scope

**HOA-only fork** — default terminology, seed data, and demos target subdivisions and condominiums. See [Sandiwa-OS.txt](Sandiwa-OS.txt) for the full product specification.

## Local development

### Prerequisites

- Node.js 20+
- pnpm 9+

### Install and run

```bash
pnpm install
pnpm dev
```

### Hostnames

Modern browsers resolve `*.localhost` to `127.0.0.1`. Use these URLs:

| URL | Context |
|-----|---------|
| http://sandiwa.localhost:3000 | Platform admin (org directory, feature toggles) |
| http://greenfield-hoa.sandiwa.localhost:3000 | Demo HOA — Impact member portal |
| http://sunrise-condo.sandiwa.localhost:3000 | Second demo HOA — different plugin mix |

Tenant URLs are built from `NUXT_PUBLIC_PLATFORM_DOMAIN` (default `sandiwa.localhost`) and `NUXT_PUBLIC_TENANT_ROUTING` (default `auto`).

| `NUXT_PUBLIC_TENANT_ROUTING` | Behavior |
|------------------------------|----------|
| `auto` (default) | Subdomain locally / on custom domains; path on `*.vercel.app` |
| `subdomain` | Always `{slug}.{platformDomain}` |
| `path` | Always `{platformDomain}/o/{slug}` |

### Vercel deployment

Vercel does **not** allow subdomains on `*.vercel.app` (e.g. `greenfield-hoa.sandiwa-os.vercel.app` cannot be added in Domains). The app auto-detects this and uses **path-based tenant URLs** instead:

| URL | Context |
|-----|---------|
| https://sandiwa-os.vercel.app | Platform admin |
| https://sandiwa-os.vercel.app/o/greenfield-hoa | Demo HOA tenant |
| https://sandiwa-os.vercel.app/o/sunrise-condo | Second demo HOA |

Optional env vars (auto-detected on `.vercel.app` if omitted):

```bash
NUXT_PUBLIC_PLATFORM_DOMAIN=sandiwa-os.vercel.app
NUXT_PUBLIC_TENANT_ROUTING=auto
```

When you add a **custom domain** later (e.g. `sandiwa.os`), set `NUXT_PUBLIC_PLATFORM_DOMAIN=sandiwa.os` and add per-tenant subdomains via DNS — the app will switch back to subdomain routing automatically.

### Demo accounts

**Platform admin** (main domain only):

- Email: `admin@sandiwa.local`
- Password: `demo1234`

**Greenfield HOA staff** (`greenfield-hoa.sandiwa.localhost`):

| Email | Password | Role |
|-------|----------|------|
| `admin@greenfield-hoa.local` | `demo1234` | HOA Administrator |
| `manager@greenfield-hoa.local` | `demo1234` | Manager |
| `chair@greenfield-hoa.local` | `demo1234` | Committee Chair |

### Reset seed data

```bash
pnpm seed:reset
```

Clears localStorage-backed demo data on next page load (or use the dev reset control in the platform UI).

## Architecture

- **Impact** — high-contrast member portal (public, org subdomain)
- **Operations Console** — dark SaaS dashboard (authenticated HOA staff)
- **Platform** — org onboarding and feature toggles (main domain only)

Tenant resolution is client-side via hostname. Auth and data are mock/localStorage for the POC; production target is Supabase with RLS.

## Agent workflow

Multi-agent development uses Cursor subagents documented in [agent_personas.md](agent_personas.md). Kick off features with [prompt_to_start.txt](prompt_to_start.txt).

Design and security handoffs: [docs/design-handoff.md](docs/design-handoff.md), [docs/security-handoff.md](docs/security-handoff.md).

## Smoke test checklist

1. `pnpm dev` starts without errors
2. `sandiwa.localhost:3000` → platform login and org list
3. `greenfield-hoa.sandiwa.localhost:3000` → Impact landing
4. Staff login → Operations Console with intake module (when enabled)
5. Unknown subdomain → not-found, no tenant data leak
