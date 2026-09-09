import { and, eq } from 'drizzle-orm'
import { withOrgContext } from '~~/server/db/client'
import { pollVotes, polls, units } from '~~/server/db/schema'
import { requireOrgSession } from '~~/server/utils/auth'
import { getOrgBySlug } from '~~/server/utils/org'
import { sanitizeText } from '~~/app/core/utils/sanitize'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')!
  const pollId = getRouterParam(event, 'id')!
  const session = await requireOrgSession(event, slug)
  const org = await getOrgBySlug(slug)
  const body = await readBody<{
    optionIndex: number
    unitId?: string
    comment?: string
  }>(event)

  if (!Number.isInteger(body.optionIndex) || body.optionIndex < 0) {
    throw createError({ statusCode: 400, statusMessage: 'optionIndex required' })
  }

  return withOrgContext(
    { organizationId: org.id, role: session.role, userId: session.userId },
    async (tx) => {
      const pollRows = await tx.select().from(polls)
        .where(and(eq(polls.id, pollId), eq(polls.organizationId, org.id)))
        .limit(1)
      const poll = pollRows[0]
      if (!poll) throw createError({ statusCode: 404, statusMessage: 'Poll not found' })
      if (poll.status !== 'open') {
        throw createError({ statusCode: 400, statusMessage: 'Poll is not open' })
      }
      if (body.optionIndex >= poll.options.length) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid optionIndex' })
      }

      let unitId: string | null = body.unitId?.trim() || null
      if (poll.eligibility === 'per_unit') {
        if (!unitId) {
          const owned = await tx.select().from(units)
            .where(and(eq(units.organizationId, org.id), eq(units.ownerUserId, session.userId)))
            .limit(1)
          unitId = owned[0]?.id ?? null
        }
        if (!unitId) {
          throw createError({ statusCode: 400, statusMessage: 'unitId required for per_unit polls' })
        }
        const unitRows = await tx.select().from(units)
          .where(and(eq(units.id, unitId), eq(units.organizationId, org.id)))
          .limit(1)
        const unit = unitRows[0]
        if (!unit) throw createError({ statusCode: 404, statusMessage: 'Unit not found' })
        if (unit.ownerUserId !== session.userId) {
          throw createError({ statusCode: 403, statusMessage: 'Not your unit' })
        }

        const existingUnit = await tx.select({ id: pollVotes.id }).from(pollVotes)
          .where(and(eq(pollVotes.pollId, pollId), eq(pollVotes.unitId, unitId)))
          .limit(1)
        if (existingUnit[0]) {
          throw createError({ statusCode: 409, statusMessage: 'Unit already voted' })
        }
      }

      const existingVoter = await tx.select({ id: pollVotes.id }).from(pollVotes)
        .where(and(eq(pollVotes.pollId, pollId), eq(pollVotes.voterId, session.userId)))
        .limit(1)
      if (existingVoter[0]) {
        throw createError({ statusCode: 409, statusMessage: 'Already voted' })
      }

      const id = `vote-${crypto.randomUUID().slice(0, 8)}`
      const [row] = await tx.insert(pollVotes).values({
        id,
        organizationId: org.id,
        pollId,
        unitId,
        voterId: session.userId,
        optionIndex: body.optionIndex,
        comment: body.comment ? sanitizeText(body.comment, 1000) : null,
        createdAt: new Date()
      }).returning()

      return {
        vote: {
          id: row!.id,
          organizationId: row!.organizationId,
          pollId: row!.pollId,
          unitId: row!.unitId ?? undefined,
          voterId: row!.voterId,
          optionIndex: row!.optionIndex,
          comment: row!.comment ?? undefined,
          createdAt: row!.createdAt.toISOString()
        }
      }
    }
  )
})
