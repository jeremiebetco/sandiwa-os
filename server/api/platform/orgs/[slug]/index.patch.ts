import { eq } from 'drizzle-orm'
import { withPlatformContext } from '~~/server/db/client'
import { officers, organizations } from '~~/server/db/schema'
import { requirePlatformAdmin } from '~~/server/utils/auth'
import { mapOrganization } from '~~/server/utils/mappers'

export default defineEventHandler(async (event) => {
  await requirePlatformAdmin(event)
  const slug = getRouterParam(event, 'slug')
  if (!slug) throw createError({ statusCode: 400, statusMessage: 'slug required' })

  const body = await readBody<Record<string, unknown>>(event)

  return withPlatformContext(async (tx) => {
    const rows = await tx.select().from(organizations).where(eq(organizations.slug, slug)).limit(1)
    const org = rows[0]
    if (!org) throw createError({ statusCode: 404, statusMessage: 'Not found' })

    const patch: Partial<typeof organizations.$inferInsert> = { updatedAt: new Date() }
    if (typeof body.name === 'string') patch.name = body.name
    if (typeof body.address === 'string') patch.address = body.address
    if (typeof body.contactEmail === 'string') patch.contactEmail = body.contactEmail
    if (typeof body.contactPhone === 'string') patch.contactPhone = body.contactPhone
    if (typeof body.planTier === 'string') patch.planTier = body.planTier as never
    if (typeof body.status === 'string') patch.status = body.status as never
    if (body.landing && typeof body.landing === 'object') {
      patch.landing = { ...(org.landing as object), ...(body.landing as object) }
    }
    if (body.features && typeof body.features === 'object') {
      patch.features = body.features as never
    }

    const [updated] = await tx.update(organizations).set(patch).where(eq(organizations.id, org.id)).returning()
    const offs = await tx.select().from(officers).where(eq(officers.organizationId, org.id))
    return { organization: mapOrganization(updated!, offs) }
  })
})
