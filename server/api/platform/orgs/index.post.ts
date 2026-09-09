import { eq } from 'drizzle-orm'
import { defaultLandingFor } from '~~/app/core/branding/landing'
import { PLAN_PLUGIN_LIMITS, PLUGIN_KEYS, type FeatureFlags, type PlanTier } from '~~/app/core/types'
import { withPlatformContext } from '~~/server/db/client'
import { organizations } from '~~/server/db/schema'
import { requirePlatformAdmin } from '~~/server/utils/auth'
import { mapOrganization } from '~~/server/utils/mappers'

function defaultFeatures(plan: PlanTier): FeatureFlags {
  const allowed = new Set(PLAN_PLUGIN_LIMITS[plan])
  const features = {} as FeatureFlags
  for (const key of PLUGIN_KEYS) {
    features[key] = allowed.has(key) && (key === 'announcements' || key === 'intake' || key === 'staff_management' || key === 'landing_editor')
  }
  return features
}

export default defineEventHandler(async (event) => {
  await requirePlatformAdmin(event)
  const body = await readBody<{
    name: string
    slug: string
    address?: string
    contactEmail?: string
    contactPhone?: string
    planTier?: PlanTier
  }>(event)

  if (!body.name?.trim() || !body.slug?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'name and slug required' })
  }

  const slug = body.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-')
  const plan = body.planTier ?? 'basic'

  return withPlatformContext(async (tx) => {
    const existing = await tx.select().from(organizations).where(eq(organizations.slug, slug)).limit(1)
    if (existing[0]) {
      throw createError({ statusCode: 409, statusMessage: 'Slug already taken' })
    }

    const id = `org-${crypto.randomUUID().slice(0, 8)}`
    const [org] = await tx.insert(organizations).values({
      id,
      slug,
      name: body.name.trim(),
      address: body.address ?? '',
      contactEmail: body.contactEmail ?? '',
      contactPhone: body.contactPhone ?? '',
      planTier: plan,
      status: 'active',
      features: defaultFeatures(plan),
      landing: defaultLandingFor(body.name.trim(), {
        contactAddress: body.address ?? '',
        contactPhone: body.contactPhone ?? '',
        contactEmail: body.contactEmail ?? '',
        brandId: 'tenant'
      }, slug)
    }).returning()

    return { organization: mapOrganization(org!, []) }
  })
})
