import { eq } from 'drizzle-orm'
import { landingFromRecord } from '~~/app/core/branding/landing'
import type { LandingContent } from '~~/app/core/types'
import { sanitizeText } from '~~/app/core/utils/sanitize'
import { withOrgContext } from '~~/server/db/client'
import { organizations } from '~~/server/db/schema'
import { requireModuleAccess } from '~~/server/utils/auth'
import { getOrgBySlug } from '~~/server/utils/org'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')!
  const session = await requireModuleAccess(event, slug, 'landing_editor')
  const org = await getOrgBySlug(slug)
  const body = await readBody<{ landing: Partial<LandingContent> }>(event)

  if (!body.landing || typeof body.landing !== 'object') {
    throw createError({ statusCode: 400, statusMessage: 'landing object required' })
  }

  const current = landingFromRecord(org.landing, slug)
  const landing = landingFromRecord({
    ...current,
    heroTitle: sanitizeText(body.landing.heroTitle ?? current.heroTitle, 256),
    heroSubtitle: sanitizeText(body.landing.heroSubtitle ?? current.heroSubtitle, 512),
    welcomeMessage: sanitizeText(body.landing.welcomeMessage ?? current.welcomeMessage),
    contactAddress: sanitizeText(body.landing.contactAddress ?? current.contactAddress, 512),
    contactPhone: sanitizeText(body.landing.contactPhone ?? current.contactPhone, 64),
    contactEmail: sanitizeText(body.landing.contactEmail ?? current.contactEmail, 255),
    officeHours: sanitizeText(body.landing.officeHours ?? current.officeHours, 256),
    brandId: body.landing.brandId ?? current.brandId,
    accentColor: body.landing.accentColor ?? current.accentColor
  }, slug)

  return withOrgContext(
    { organizationId: org.id, role: session.role, userId: session.userId },
    async (tx) => {
      const [updated] = await tx.update(organizations)
        .set({ landing, updatedAt: new Date() })
        .where(eq(organizations.id, org.id))
        .returning()

      return { landing: landingFromRecord(updated!.landing, slug) }
    }
  )
})
