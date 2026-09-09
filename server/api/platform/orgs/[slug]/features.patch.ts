import { eq } from 'drizzle-orm'
import { withPlatformContext } from '~~/server/db/client'
import { officers, organizations } from '~~/server/db/schema'
import { requirePlatformAdmin } from '~~/server/utils/auth'
import { mapOrganization } from '~~/server/utils/mappers'
import { PLAN_PLUGIN_LIMITS, PLUGIN_KEYS, type FeatureFlags, type PlanTier } from '~~/app/core/types'

export default defineEventHandler(async (event) => {
  await requirePlatformAdmin(event)
  const slug = getRouterParam(event, 'slug')
  if (!slug) throw createError({ statusCode: 400, statusMessage: 'slug required' })

  const body = await readBody<{ features: FeatureFlags }>(event)
  if (!body.features) throw createError({ statusCode: 400, statusMessage: 'features required' })

  return withPlatformContext(async (tx) => {
    const rows = await tx.select().from(organizations).where(eq(organizations.slug, slug)).limit(1)
    const org = rows[0]
    if (!org) throw createError({ statusCode: 404, statusMessage: 'Not found' })

    const allowed = new Set(PLAN_PLUGIN_LIMITS[org.planTier as PlanTier])
    const features = {} as FeatureFlags
    for (const key of PLUGIN_KEYS) {
      features[key] = Boolean(body.features[key] && allowed.has(key))
    }

    const [updated] = await tx.update(organizations)
      .set({ features, updatedAt: new Date() })
      .where(eq(organizations.id, org.id))
      .returning()

    const offs = await tx.select().from(officers).where(eq(officers.organizationId, org.id))
    return { organization: mapOrganization(updated!, offs) }
  })
})
