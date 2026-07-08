# Security Handoff — Sandiwa OS HOA POC

## Audit scope

Client-side SPA POC with Pinia + localStorage persistence, hostname-based tenant resolution, mock auth, and RBAC route guards.

## Findings

### Critical

None identified for POC scope.

### High

| ID | Finding | Mitigation |
|----|---------|------------|
| H1 | localStorage auth is forgeable | Expected for POC. `validateSessionForContext()` runs on every navigation; guards re-check role + tenant slug. Production must use httpOnly cookies + server RLS. |
| H2 | Passwords stored plaintext in seed data | Demo-only (`demo1234`). Documented in README; not for production. |

### Medium

| ID | Finding | Mitigation |
|----|---------|------------|
| M1 | No CSRF (no server mutations) | N/A for SPA/localStorage POC |
| M2 | Member portal uses demo member identity for request submission | Acceptable POC shortcut; production needs member auth |

### Low

| ID | Finding | Mitigation |
|----|---------|------------|
| L1 | Announcement body rendered as text (Vue auto-escape) | `sanitizeText()` applied on write; Vue text interpolation prevents XSS on read |

## Controls implemented

1. **Tenant leakage prevention** — Auth session cleared when hostname context changes (platform ↔ org or org slug mismatch).
2. **Platform/org login separation** — Platform admin cannot log in on org subdomains; org staff cannot log in on main domain.
3. **RBAC middleware** — Module routes gated by `canAccessModule()` and feature flags.
4. **Intake scoping** — Committee leads see assigned/open cases only; admins/managers see full queue.
5. **Input sanitization** — `sanitizeText()` / `escapeHtml()` on user-editable fields before persistence.
6. **Unknown subdomain** — Redirects to `/not-found` without exposing other tenant data.
7. **No secrets in bundle** — `.env.example` placeholders only; no API keys committed.

## Orchestrator decision

**PASS** — Design tokens enforced via CSS variables; no critical security blockers for POC demo use. Smoke: build + typecheck pass; manual browser verification recommended on `sandiwa.localhost` and `greenfield-hoa.sandiwa.localhost`.

## Smoke checklist

- [x] `pnpm typecheck` passes
- [x] `pnpm build` passes
- [ ] Manual: platform login at `http://sandiwa.localhost:3000`
- [ ] Manual: Impact landing at `http://greenfield-hoa.sandiwa.localhost:3000`
- [ ] Manual: staff login → intake queue
- [ ] Manual: unknown subdomain → not-found
