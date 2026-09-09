import { desc, eq } from 'drizzle-orm'
import { withOrgContext } from '~~/server/db/client'
import { intakeCases } from '~~/server/db/schema'
import { requireOrgSession } from '~~/server/utils/auth'
import { getOrgBySlug } from '~~/server/utils/org'
import {
  canViewAllIntakeCases,
  isStaffRole
} from '~~/app/core/rbac/permissions'
import type { OrgRole } from '~~/app/core/types'

function mapCase(row: typeof intakeCases.$inferSelect) {
  return {
    id: row.id,
    organizationId: row.organizationId,
    memberId: row.memberId,
    memberName: row.memberName,
    unit: row.unit ?? undefined,
    description: row.description,
    category: row.category,
    sentiment: row.sentiment,
    status: row.status,
    assignedToId: row.assignedToId ?? undefined,
    assignedToName: row.assignedToName ?? undefined,
    resolutionNotes: row.resolutionNotes ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  }
}

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')!
  const session = await requireOrgSession(event, slug)
  const org = await getOrgBySlug(slug)
  const role = session.role as OrgRole

  return withOrgContext(
    { organizationId: org.id, role: session.role, userId: session.userId },
    async (tx) => {
      let rows = await tx.select().from(intakeCases)
        .where(eq(intakeCases.organizationId, org.id))
        .orderBy(desc(intakeCases.createdAt))

      if (role === 'member') {
        rows = rows.filter(r => r.memberId === session.userId)
      } else if (!canViewAllIntakeCases(role) && role === 'committee_lead') {
        rows = rows.filter(r =>
          r.status === 'open' || r.assignedToId === session.userId
        )
      } else if (!isStaffRole(role) && !canViewAllIntakeCases(role)) {
        rows = rows.filter(r => r.memberId === session.userId)
      }

      return { cases: rows.map(mapCase) }
    }
  )
})
