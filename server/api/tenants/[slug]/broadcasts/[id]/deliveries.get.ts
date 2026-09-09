import { and, eq } from 'drizzle-orm'
import { withOrgContext } from '~~/server/db/client'
import { broadcastDeliveries, broadcasts } from '~~/server/db/schema'
import { requireModuleAccess } from '~~/server/utils/auth'
import { getOrgBySlug } from '~~/server/utils/org'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')!
  const broadcastId = getRouterParam(event, 'id')!
  const session = await requireModuleAccess(event, slug, 'broadcasts')
  const org = await getOrgBySlug(slug)

  return withOrgContext(
    { organizationId: org.id, role: session.role, userId: session.userId },
    async (tx) => {
      const bc = await tx.select({ id: broadcasts.id }).from(broadcasts)
        .where(and(eq(broadcasts.id, broadcastId), eq(broadcasts.organizationId, org.id)))
        .limit(1)
      if (!bc[0]) throw createError({ statusCode: 404, statusMessage: 'Broadcast not found' })

      const rows = await tx.select().from(broadcastDeliveries)
        .where(and(
          eq(broadcastDeliveries.broadcastId, broadcastId),
          eq(broadcastDeliveries.organizationId, org.id)
        ))

      return {
        deliveries: rows.map(d => ({
          id: d.id,
          organizationId: d.organizationId,
          broadcastId: d.broadcastId,
          recipientId: d.recipientId ?? undefined,
          channel: d.channel,
          status: d.status,
          error: d.error ?? undefined,
          deliveredAt: d.deliveredAt?.toISOString()
        }))
      }
    }
  )
})
