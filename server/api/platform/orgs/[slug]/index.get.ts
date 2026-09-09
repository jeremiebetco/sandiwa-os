import { eq } from 'drizzle-orm'
import { withPlatformContext } from '~~/server/db/client'
import { officers, organizations } from '~~/server/db/schema'
import { requirePlatformAdmin } from '~~/server/utils/auth'
import { mapOrganization } from '~~/server/utils/mappers'

export default defineEventHandler(async (event) => {
  await requirePlatformAdmin(event)
  const slug = getRouterParam(event, 'slug')
  if (!slug) throw createError({ statusCode: 400, statusMessage: 'slug required' })

  return withPlatformContext(async (tx) => {
    const rows = await tx.select().from(organizations).where(eq(organizations.slug, slug)).limit(1)
    const org = rows[0]
    if (!org) throw createError({ statusCode: 404, statusMessage: 'Not found' })
    const offs = await tx.select().from(officers).where(eq(officers.organizationId, org.id))
    return { organization: mapOrganization(org, offs) }
  })
})
