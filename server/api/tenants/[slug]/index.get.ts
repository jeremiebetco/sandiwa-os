import { eq } from 'drizzle-orm'
import { withPublicRead } from '~~/server/db/client'
import { officers, organizations } from '~~/server/db/schema'
import { mapOrganization } from '~~/server/utils/mappers'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'slug required' })
  }

  return withPublicRead(async (tx) => {
    const rows = await tx.select().from(organizations).where(eq(organizations.slug, slug)).limit(1)
    const org = rows[0]
    if (!org || org.status !== 'active') {
      throw createError({ statusCode: 404, statusMessage: 'Organization not found' })
    }
    const offs = await tx.select().from(officers).where(eq(officers.organizationId, org.id))
    return { organization: mapOrganization(org, offs) }
  })
})
