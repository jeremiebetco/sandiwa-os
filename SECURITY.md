# Security Policy — Sandiwa OS (HOA)

## Threat model (public demo)

This repository and any public Vercel deploy are a **pilot / portfolio demo**:

- Demo accounts and password `demo1234` are intentional and documented.
- Data may be reset; treat everything as disposable sample content.
- **Do not store real homeowner PII, bank details, or production dues data** in the public demo.

The stack targets production-shaped controls (httpOnly sessions, CSRF, RLS, server RBAC) so a private deploy with strong secrets can move toward real HOA use.

## What is protected

| Control | Implementation |
|---------|----------------|
| Auth | scrypt password hashes; `sessions` table; httpOnly `SameSite=Lax` cookie (HMAC-SHA256 with `SESSION_SECRET`); prior sessions for the user are deleted on login |
| CSRF | Origin allowlist (`server/utils/csrf.ts`); `same-site` alone is **not** trusted on shared suffixes (`*.vercel.app`) |
| Tenant isolation | `requireOrgSession` slug match + Postgres RLS (`SET LOCAL app.current_org_id`) |
| App DB role | App connects as `sandiwa_app` (FORCE RLS, `NOBYPASSRLS`). Migrate/seed use `DATABASE_URL_ADMIN`. Platform directory mutations set `app.is_platform_admin`. Active org lookup uses `app.public_read`. |
| Module access | `requireModuleAccess` checks the role matrix **and** `org.features[plugin]` |
| Secrets | `DATABASE_URL` / `SESSION_SECRET` server-only; no secrets in the client bundle |
| Input | Zod on `POST /api/auth/login`, `POST /api/tenants/:slug/users`, `POST /api/tenants/:slug/intake`; `sanitizeText` on writes |
| Headers | CSP, `frame-ancestors 'none'`, nosniff, Referrer-Policy (Nitro + Vercel) |
| Demo reset | Disabled in production / Vercel; local UI reset only with `ALLOW_DEMO_RESET=true` |

## Known gaps

- Login rate limit is in-memory (per instance). Use Redis/Upstash before running multiple serverless instances.
- Zod is not applied on the remaining write endpoints yet.

## Reporting a vulnerability

Email the maintainer via the GitHub profile on this repository, or open a **private** security advisory if enabled. Please include:

1. Affected URL or API route
2. Steps to reproduce
3. Impact (auth bypass, cross-tenant read/write, etc.)

Please do **not** open a public issue for exploitable flaws until a fix is available.

## Production checklist (before real HOA data)

1. Set a unique `SESSION_SECRET` (≥ 32 random chars; never `change-me…`)
2. Set `DATABASE_URL` to the RLS-enforced `sandiwa_app` role (no localhost fallback)
3. Change or remove all demo users / passwords after seed
4. Keep `ALLOW_DEMO_RESET` unset in production
5. Prefer a custom domain (not shared `*.vercel.app`) for cookie/CSRF clarity
6. Add Redis/Upstash rate limiting if you run multiple serverless instances
7. Extend Zod validation to remaining write endpoints as you harden
