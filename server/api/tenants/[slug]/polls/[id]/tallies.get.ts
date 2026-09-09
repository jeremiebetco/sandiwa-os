import { and, eq } from 'drizzle-orm'
import { withOrgContext } from '~~/server/db/client'
import { pollVotes, polls } from '~~/server/db/schema'
import { requireOrgSession } from '~~/server/utils/auth'
import { getOrgBySlug } from '~~/server/utils/org'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')!
  const pollId = getRouterParam(event, 'id')!
  const session = await requireOrgSession(event, slug)
  const org = await getOrgBySlug(slug)

  return withOrgContext(
    { organizationId: org.id, role: session.role, userId: session.userId },
    async (tx) => {
      const pollRows = await tx.select().from(polls)
        .where(and(eq(polls.id, pollId), eq(polls.organizationId, org.id)))
        .limit(1)
      const poll = pollRows[0]
      if (!poll) throw createError({ statusCode: 404, statusMessage: 'Poll not found' })

      const votes = await tx.select().from(pollVotes)
        .where(and(eq(pollVotes.pollId, pollId), eq(pollVotes.organizationId, org.id)))

      const tallies = poll.options.map(() => 0)
      for (const vote of votes) {
        if (vote.optionIndex >= 0 && vote.optionIndex < tallies.length) {
          tallies[vote.optionIndex]! += 1
        }
      }

      return {
        pollId,
        options: poll.options,
        tallies,
        voteCount: votes.length,
        quorumPercent: poll.quorumPercent,
        status: poll.status
      }
    }
  )
})
