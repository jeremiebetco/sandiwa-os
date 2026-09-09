import { desc, eq } from 'drizzle-orm'
import { withOrgContext } from '~~/server/db/client'
import { broadcasts } from '~~/server/db/schema'
import { getOrgBySlug } from '~~/server/utils/org'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')!
  const org = await getOrgBySlug(slug)

  return withOrgContext({ organizationId: org.id }, async (tx) => {
    const rows = await tx.select().from(broadcasts)
      .where(eq(broadcasts.organizationId, org.id))
      .orderBy(desc(broadcasts.createdAt))

    return {
      broadcasts: rows.map(b => ({
        id: b.id,
        organizationId: b.organizationId,
        title: b.title,
        body: b.body,
        severity: b.severity,
        channel: b.channel,
        audiencePhase: b.audiencePhase ?? undefined,
        audienceUnitType: b.audienceUnitType ?? undefined,
        createdById: b.createdById,
        sentAt: b.sentAt?.toISOString(),
        createdAt: b.createdAt.toISOString()
      }))
    }
  })
})
