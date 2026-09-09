import { and, eq } from 'drizzle-orm'
import { withOrgContext } from '~~/server/db/client'
import { polls } from '~~/server/db/schema'
import { requireModuleAccess, requirePermission } from '~~/server/utils/auth'
import { getOrgBySlug } from '~~/server/utils/org'
import { sanitizeText } from '~~/app/core/utils/sanitize'
import type { PollStatus } from '~~/app/core/types'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')!
  const id = getRouterParam(event, 'id')!
  const body = await readBody<{
    title?: string
    description?: string
    status?: PollStatus
    summary?: string
    closesAt?: string
    options?: string[]
  }>(event)

  const session = body.status === 'closed'
    ? await requirePermission(event, slug, 'poll.close')
    : await requireModuleAccess(event, slug, 'polls')

  const org = await getOrgBySlug(slug)

  return withOrgContext(
    { organizationId: org.id, role: session.role, userId: session.userId },
    async (tx) => {
      const existing = await tx.select().from(polls)
        .where(and(eq(polls.id, id), eq(polls.organizationId, org.id)))
        .limit(1)
      if (!existing[0]) throw createError({ statusCode: 404, statusMessage: 'Poll not found' })

      const patch: Partial<typeof polls.$inferInsert> = {}
      if (body.title !== undefined) patch.title = sanitizeText(body.title, 256)
      if (body.description !== undefined) patch.description = sanitizeText(body.description)
      if (body.status !== undefined) {
        if (!(['draft', 'open', 'closed'] as PollStatus[]).includes(body.status)) {
          throw createError({ statusCode: 400, statusMessage: 'Invalid status' })
        }
        patch.status = body.status
        if (body.status === 'closed' && !body.closesAt) {
          patch.closesAt = new Date()
        }
      }
      if (body.summary !== undefined) patch.summary = sanitizeText(body.summary)
      if (body.closesAt !== undefined) patch.closesAt = new Date(body.closesAt)
      if (body.options !== undefined) {
        const options = body.options.map(o => sanitizeText(String(o), 256)).filter(Boolean)
        if (options.length < 2) throw createError({ statusCode: 400, statusMessage: 'Need at least 2 options' })
        patch.options = options
      }

      const [row] = await tx.update(polls)
        .set(patch)
        .where(and(eq(polls.id, id), eq(polls.organizationId, org.id)))
        .returning()

      return {
        poll: {
          id: row!.id,
          organizationId: row!.organizationId,
          title: row!.title,
          description: row!.description,
          status: row!.status,
          eligibility: row!.eligibility,
          quorumPercent: row!.quorumPercent,
          options: row!.options,
          opensAt: row!.opensAt?.toISOString(),
          closesAt: row!.closesAt?.toISOString(),
          createdById: row!.createdById,
          summary: row!.summary ?? undefined,
          createdAt: row!.createdAt.toISOString()
        }
      }
    }
  )
})
