import type { H3Event } from 'h3'
import { createSession, requirePlatformAdmin, setSessionCookie, type AuthSession } from '~~/server/utils/auth'
import { isProductionRuntime } from '~~/server/utils/session-secret'

/**
 * `pnpm db:seed` truncates sessions. The caller is still on the platform page,
 * so issue a fresh cookie or every later save returns 401 Unauthorized.
 */
async function restorePlatformSession(event: H3Event, session: AuthSession) {
  const token = await createSession({
    userId: session.userId,
    context: 'platform',
    role: session.role,
    email: session.email,
    name: session.name
  })
  setSessionCookie(event, token)
}

/**
 * Demo data reset — local/dev only.
 * Never spawn a shell; production and Vercel always reject.
 * Enable locally with ALLOW_DEMO_RESET=true, then use `pnpm db:seed` via execFile.
 */
export default defineEventHandler(async (event) => {
  const session = await requirePlatformAdmin(event)

  if (isProductionRuntime() || process.env.ALLOW_DEMO_RESET !== 'true') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Demo reset is disabled. Run `pnpm db:seed` locally when ALLOW_DEMO_RESET=true is set for UI reset.'
    })
  }

  const { execFile } = await import('node:child_process')
  const { promisify } = await import('node:util')
  const execFileAsync = promisify(execFile)

  try {
    await execFileAsync('pnpm', ['db:seed'], {
      cwd: process.cwd(),
      env: process.env,
      timeout: 120_000,
      maxBuffer: 10 * 1024 * 1024
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Seed failed'
    throw createError({ statusCode: 500, statusMessage: `Demo reset failed: ${message}` })
  } finally {
    try {
      await restorePlatformSession(event, session)
    } catch (restoreErr) {
      console.error('Failed to restore platform session after demo reset', restoreErr)
    }
  }

  return { ok: true }
})
