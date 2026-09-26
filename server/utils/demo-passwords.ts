import { isProductionRuntime } from './session-secret'

/** Shared password for org staff/member demo accounts (intentional for public demos). */
export const ORG_DEMO_PASSWORD = 'demo1234'

const WEAK_PLATFORM_PREFIXES = ['change-me', 'demo1234', 'password', 'admin']

/**
 * Platform admin password for seed / rotation scripts.
 * Local default: same as org demo password (DX).
 * Production / Vercel seed: requires PLATFORM_ADMIN_PASSWORD (≥12 chars, not a known weak value).
 */
export function resolvePlatformAdminPassword(options?: { requireStrong?: boolean }): string {
  const fromEnv = (process.env.PLATFORM_ADMIN_PASSWORD || '').trim()
  const requireStrong = options?.requireStrong ?? isProductionRuntime()

  if (requireStrong) {
    if (!fromEnv || fromEnv.length < 12) {
      throw new Error(
        'PLATFORM_ADMIN_PASSWORD must be set to a strong password (≥12 characters) when seeding or rotating the platform admin in production'
      )
    }
    if (WEAK_PLATFORM_PREFIXES.some(p => fromEnv.toLowerCase() === p || fromEnv.toLowerCase().startsWith(`${p}-`))) {
      throw new Error(
        'PLATFORM_ADMIN_PASSWORD must not be a known demo/weak value (e.g. demo1234). Use a unique secret stored only in your env manager.'
      )
    }
    return fromEnv
  }

  if (fromEnv.length >= 8) {
    return fromEnv
  }

  return ORG_DEMO_PASSWORD
}
