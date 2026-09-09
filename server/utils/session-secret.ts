const WEAK_PREFIXES = ['change-me', 'ci-session', 'dev-only']

/**
 * Session HMAC secret. Required and non-placeholder in production.
 * Local/CI may use SESSION_SECRET or a deterministic development fallback.
 */
export function getSessionSecret(): string {
  const secret = (process.env.SESSION_SECRET || '').trim()
  const isProd = process.env.NODE_ENV === 'production'

  if (isProd) {
    if (!secret || secret.length < 32) {
      throw new Error('SESSION_SECRET must be set to a random string of at least 32 characters in production')
    }
    if (WEAK_PREFIXES.some(p => secret.toLowerCase().startsWith(p))) {
      throw new Error('SESSION_SECRET must not use a placeholder value in production')
    }
    return secret
  }

  if (secret.length >= 16) {
    return secret
  }

  return 'dev-only-session-secret-do-not-use-in-prod'
}

export function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === 'production' || process.env.VERCEL === '1'
}
