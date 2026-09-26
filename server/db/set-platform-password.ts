/**
 * Rotate the platform admin password without reseeding org demo data.
 * Usage: PLATFORM_ADMIN_PASSWORD='…' pnpm db:set-platform-password
 *
 * Uses DATABASE_URL_ADMIN (or local admin fallback). Never run with a weak password in production.
 */
import { config } from 'dotenv'
import { eq } from 'drizzle-orm'
import { getDatabaseUrl } from './connection'
import { resolvePlatformAdminPassword } from '../utils/demo-passwords'
import { hashPassword } from '../utils/password'

config()

process.env.DATABASE_URL = getDatabaseUrl('admin')

const { db, sqlClient } = await import('./client')
const { platformAdmins } = await import('./schema')

const PLATFORM_EMAIL = 'admin@sandiwa.local'

async function main() {
  // Always require a strong password for this script (it exists to lock the demo).
  const password = resolvePlatformAdminPassword({ requireStrong: true })
  const passwordHash = await hashPassword(password)

  const updated = await db
    .update(platformAdmins)
    .set({ passwordHash })
    .where(eq(platformAdmins.email, PLATFORM_EMAIL))
    .returning({ id: platformAdmins.id, email: platformAdmins.email })

  if (updated.length === 0) {
    throw new Error(`No platform admin found for ${PLATFORM_EMAIL}. Run pnpm db:seed first.`)
  }

  // Invalidate existing platform sessions so old cookies cannot keep admin access.
  await sqlClient.unsafe(`DELETE FROM sessions WHERE context = 'platform'`)

  console.log(`Updated password for ${updated[0].email} and cleared platform sessions.`)
  console.log('Password value was not printed — store it in your password manager / Vercel env notes.')
  await sqlClient.end({ timeout: 5 })
}

main().catch(async (err) => {
  console.error(err)
  try {
    await sqlClient.end({ timeout: 1 })
  } catch {
    // ignore
  }
  process.exit(1)
})
