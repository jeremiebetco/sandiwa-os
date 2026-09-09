import { eq } from 'drizzle-orm'
import { withOrgContext } from '~~/server/db/client'
import { broadcastDeliveries, broadcasts, orgUsers } from '~~/server/db/schema'
import { requirePermission } from '~~/server/utils/auth'
import { getOrgBySlug } from '~~/server/utils/org'
import { sanitizeText } from '~~/app/core/utils/sanitize'
import type { BroadcastSeverity } from '~~/app/core/types'

const SEVERITIES: BroadcastSeverity[] = ['info', 'warning', 'emergency']
const CHANNELS = ['portal', 'sms', 'both'] as const

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')!
  const session = await requirePermission(event, slug, 'broadcast.send')
  const org = await getOrgBySlug(slug)
  const body = await readBody<{
    title: string
    body: string
    severity?: BroadcastSeverity
    channel?: typeof CHANNELS[number]
    audiencePhase?: string
    audienceUnitType?: string
  }>(event)

  const title = sanitizeText(body.title || '', 256)
  const text = sanitizeText(body.body || '')
  if (!title || !text) {
    throw createError({ statusCode: 400, statusMessage: 'title and body required' })
  }
  const severity = body.severity && SEVERITIES.includes(body.severity) ? body.severity : 'info'
  const channel = body.channel && CHANNELS.includes(body.channel) ? body.channel : 'portal'

  return withOrgContext(
    { organizationId: org.id, role: session.role, userId: session.userId },
    async (tx) => {
      const id = `bc-${crypto.randomUUID().slice(0, 8)}`
      const sentAt = new Date()
      const [row] = await tx.insert(broadcasts).values({
        id,
        organizationId: org.id,
        title,
        body: text,
        severity,
        channel,
        audiencePhase: body.audiencePhase ? sanitizeText(body.audiencePhase, 64) : null,
        audienceUnitType: body.audienceUnitType ? sanitizeText(body.audienceUnitType, 64) : null,
        createdById: session.userId,
        sentAt,
        createdAt: sentAt
      }).returning()

      const orgMembers = await tx.select({ id: orgUsers.id, role: orgUsers.role }).from(orgUsers)
        .where(eq(orgUsers.organizationId, org.id))
      const members = orgMembers.filter(u => u.role === 'member')
      const deliveryTargets = members.length > 0 ? members : orgMembers

      if (deliveryTargets.length > 0) {
        await tx.insert(broadcastDeliveries).values(
          deliveryTargets.map(r => ({
            id: `bd-${crypto.randomUUID().slice(0, 8)}`,
            organizationId: org.id,
            broadcastId: id,
            recipientId: r.id,
            channel: channel === 'both' ? 'portal' : channel,
            status: 'sent' as const,
            deliveredAt: sentAt
          }))
        )
      }

      return {
        broadcast: {
          id: row!.id,
          organizationId: row!.organizationId,
          title: row!.title,
          body: row!.body,
          severity: row!.severity,
          channel: row!.channel,
          audiencePhase: row!.audiencePhase ?? undefined,
          audienceUnitType: row!.audienceUnitType ?? undefined,
          createdById: row!.createdById,
          sentAt: row!.sentAt?.toISOString(),
          createdAt: row!.createdAt.toISOString()
        },
        deliveriesCreated: deliveryTargets.length
      }
    }
  )
})
