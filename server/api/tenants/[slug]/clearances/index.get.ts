import { desc, eq, inArray } from 'drizzle-orm'
import { withOrgContext } from '~~/server/db/client'
import { clearanceRequests, units } from '~~/server/db/schema'
import { requireOrgSession } from '~~/server/utils/auth'
import { getOrgBySlug } from '~~/server/utils/org'
import { isStaffRole } from '~~/app/core/rbac/permissions'
import type { OrgRole } from '~~/app/core/types'

function mapClearance(row: typeof clearanceRequests.$inferSelect) {
  return {
    id: row.id,
    organizationId: row.organizationId,
    unitId: row.unitId,
    requesterId: row.requesterId,
    requesterName: row.requesterName,
    type: row.type,
    purpose: row.purpose ?? undefined,
    status: row.status,
    reviewedById: row.reviewedById ?? undefined,
    reviewNotes: row.reviewNotes ?? undefined,
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
      const unitRows = await tx.select().from(units).where(eq(units.organizationId, org.id))
      let allowedUnitIds = unitRows.map(u => u.id)
      if (!isStaffRole(role)) {
        allowedUnitIds = unitRows.filter(u => u.ownerUserId === session.userId).map(u => u.id)
        if (allowedUnitIds.length === 0) return { clearances: [] }
      }

      const rows = await tx.select().from(clearanceRequests)
        .where(
          allowedUnitIds.length === unitRows.length
            ? eq(clearanceRequests.organizationId, org.id)
            : inArray(clearanceRequests.unitId, allowedUnitIds)
        )
        .orderBy(desc(clearanceRequests.createdAt))

      return { clearances: rows.map(mapClearance) }
    }
  )
})
