import { eq } from 'drizzle-orm'
import { withPublicRead } from '../db/client'
import { organizations } from '../db/schema'

export async function getOrgBySlug(slug: string) {
  const org = await withPublicRead(async (tx) => {
    const rows = await tx.select().from(organizations).where(eq(organizations.slug, slug)).limit(1)
    return rows[0]
  })
  if (!org) {
    throw createError({ statusCode: 404, statusMessage: 'Organization not found' })
  }
  return org
}
