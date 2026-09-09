import { desc, eq } from 'drizzle-orm'
import { withOrgContext } from '~~/server/db/client'
import { polls } from '~~/server/db/schema'
import { requireOrgSession } from '~~/server/utils/auth'
import { getOrgBySlug } from '~~/server/utils/org'

function mapPoll(row: typeof polls.$inferSelect) {
  return {
    id: row.id,
    organizationId: row.organizationId,
    title: row.title,
    description: row.description,
    status: row.status,
    eligibility: row.eligibility,
    quorumPercent: row.quorumPercent,
    options: row.options,
    opensAt: row.opensAt?.toISOString(),
    closesAt: row.closesAt?.toISOString(),
    createdById: row.createdById,
    summary: row.summary ?? undefined,
    createdAt: row.createdAt.toISOString()
  }
}

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')!
  const session = await requireOrgSession(event, slug)
  const org = await getOrgBySlug(slug)

  return withOrgContext(
    { organizationId: org.id, role: session.role, userId: session.userId },
    async (tx) => {
      const rows = await tx.select().from(polls)
        .where(eq(polls.organizationId, org.id))
        .orderBy(desc(polls.createdAt))

      return { polls: rows.map(mapPoll) }
    }
  )
})
