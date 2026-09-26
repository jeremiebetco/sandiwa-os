/**
 * Masked deploy-env checklist. Prints shapes only — never secret values.
 * Usage: pnpm check:deploy-env
 * Optional: copy Vercel env into a temp file and set DOTENV_CONFIG_PATH=…
 */
import { config } from 'dotenv'
import { resolve } from 'node:path'

config({ path: process.env.DOTENV_CONFIG_PATH || resolve(process.cwd(), '.env') })

type Check = { ok: boolean; detail: string }

function parseDbUrl(url: string | undefined, label: string): Check {
  if (!url?.trim()) {
    return { ok: false, detail: `${label}: MISSING` }
  }
  try {
    const u = new URL(url)
    const user = decodeURIComponent(u.username || '')
    const host = u.hostname || ''
    const port = u.port || '(default)'
    const isSupabase = host.includes('supabase')
    const isAppRole = user === 'sandiwa_app' || user.startsWith('sandiwa_app.')
    const isPrivileged =
      user === 'postgres' ||
      user.startsWith('postgres.') ||
      user === 'sandiwa' ||
      user.includes('service_role')

    if (label === 'DATABASE_URL') {
      if (isPrivileged) {
        return {
          ok: false,
          detail: `${label}: CRITICAL — looks privileged (${user.split('.')[0]}@${host}:${port}). Use sandiwa_app + pooler :6543`
        }
      }
      if (!isAppRole) {
        return {
          ok: false,
          detail: `${label}: WARN — user is not sandiwa_app (${user.split('.')[0]}@${host}:${port})`
        }
      }
      const poolerOk = !isSupabase || port === '6543'
      return {
        ok: poolerOk,
        detail: `${label}: OK app role | host=${isSupabase ? 'supabase' : 'other'} | port=${port}${poolerOk ? '' : ' (prefer transaction pooler 6543)'}`
      }
    }

    // ADMIN URL — privileged expected for migrate/seed only; must NOT be on Vercel runtime
    return {
      ok: true,
      detail: `${label}: present | user=${user.split('.')[0]}@${host}:${port} (migrate/seed only — leave unset on Vercel)`
    }
  } catch {
    return { ok: false, detail: `${label}: unparseable URL` }
  }
}

function checkSessionSecret(secret: string | undefined): Check {
  if (!secret?.trim()) return { ok: false, detail: 'SESSION_SECRET: MISSING' }
  const s = secret.trim()
  const weak = ['change-me', 'ci-session', 'dev-only', 'local-dev'].some(p =>
    s.toLowerCase().startsWith(p)
  )
  if (s.length < 32) return { ok: false, detail: `SESSION_SECRET: too short (len=${s.length}, need ≥32)` }
  if (weak) return { ok: false, detail: 'SESSION_SECRET: matches weak/example prefix' }
  return { ok: true, detail: `SESSION_SECRET: OK (len=${s.length})` }
}

const checks: Check[] = [
  parseDbUrl(process.env.DATABASE_URL, 'DATABASE_URL'),
  checkSessionSecret(process.env.SESSION_SECRET),
  process.env.NUXT_PUBLIC_PLATFORM_DOMAIN?.trim()
    ? (() => {
        const domain = process.env.NUXT_PUBLIC_PLATFORM_DOMAIN.trim()
        const isLocalhost = domain.includes('localhost')
        const expectingProd =
          process.env.VERCEL === '1' ||
          (process.env.DOTENV_CONFIG_PATH || '').includes('vercel')
        if (isLocalhost && expectingProd) {
          return {
            ok: false,
            detail: `NUXT_PUBLIC_PLATFORM_DOMAIN: ${domain} — replace with your public Cloudflare/Vercel host`
          }
        }
        return {
          ok: true,
          detail: `NUXT_PUBLIC_PLATFORM_DOMAIN: ${domain}${
            isLocalhost ? ' (local OK)' : ''
          }`
        }
      })()
    : { ok: false, detail: 'NUXT_PUBLIC_PLATFORM_DOMAIN: MISSING' },
  {
    ok: process.env.ALLOW_DEMO_RESET !== 'true',
    detail:
      process.env.ALLOW_DEMO_RESET === 'true'
        ? 'ALLOW_DEMO_RESET: MUST be unset on Vercel'
        : 'ALLOW_DEMO_RESET: unset (good)'
  },
  {
    ok: !process.env.DATABASE_URL_ADMIN?.trim() || process.env.VERCEL !== '1',
    detail: process.env.DATABASE_URL_ADMIN?.trim()
      ? 'DATABASE_URL_ADMIN: present (OK locally; omit on Vercel)'
      : 'DATABASE_URL_ADMIN: absent'
  },
  {
    ok: Boolean(process.env.PLATFORM_ADMIN_PASSWORD?.trim()) || process.env.VERCEL !== '1',
    detail: process.env.PLATFORM_ADMIN_PASSWORD?.trim()
      ? `PLATFORM_ADMIN_PASSWORD: set (len=${process.env.PLATFORM_ADMIN_PASSWORD.trim().length}) — use for seed/rotation only, not required at runtime`
      : 'PLATFORM_ADMIN_PASSWORD: absent (set before db:seed / db:set-platform-password for public demo)'
  }
]

console.log('=== Deploy env checklist (masked) ===\n')
for (const c of checks) {
  console.log(`${c.ok ? 'PASS' : 'FAIL'}  ${c.detail}`)
}

const failed = checks.filter(c => !c.ok).length
console.log(`\n${failed === 0 ? 'All checks passed for this env file.' : `${failed} check(s) need attention.`}`)
console.log('\nVercel: after `vercel login`, run `vercel env pull .env.vercel.local --environment=production`')
console.log('then: DOTENV_CONFIG_PATH=.env.vercel.local pnpm check:deploy-env')
process.exit(failed === 0 ? 0 : 1)
