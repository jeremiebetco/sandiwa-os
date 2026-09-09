import { desc, eq } from 'drizzle-orm'
import { withOrgContext, withPublicRead } from '~~/server/db/client'
import { announcements, organizations } from '~~/server/db/schema'

async function resolveOrgId(slug: string) {
  return withPublicRead(async (tx) => {
    const rows = await tx.select().from(organizations).where(eq(organizations.slug, slug)).limit(1)
    const org = rows[0]
    if (!org) throw createError({ statusCode: 404, statusMessage: 'Organization not found' })
    return org
  })
}

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')!
  const org = await resolveOrgId(slug)

  // Public read for announcements
  return withOrgContext({ organizationId: org.id }, async (tx) => {
    const rows = await tx.select().from(announcements)
      .where(eq(announcements.organizationId, org.id))
      .orderBy(desc(announcements.publishedAt))
    return {
      announcements: rows.map(a => ({
        id: a.id,
        organizationId: a.organizationId,
        title: a.title,
        body: a.body,
        publishedAt: a.publishedAt.toISOString(),
        authorId: a.authorId
      }))
    }
  })
})
