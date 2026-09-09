import { and, eq } from 'drizzle-orm'
import { withOrgContext, withPublicRead } from '~~/server/db/client'
import { announcements, organizations } from '~~/server/db/schema'
import { requireModuleAccess } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')!
  const id = getRouterParam(event, 'id')!
  await requireModuleAccess(event, slug, 'announcements')

  const org = await withPublicRead(async (tx) => {
    const rows = await tx.select().from(organizations).where(eq(organizations.slug, slug)).limit(1)
    return rows[0]
  })
  if (!org) throw createError({ statusCode: 404, statusMessage: 'Not found' })

  await withOrgContext({ organizationId: org.id }, async (tx) => {
    await tx.delete(announcements).where(and(eq(announcements.id, id), eq(announcements.organizationId, org.id)))
  })

  return { ok: true }
})
