import { desc, eq, inArray } from 'drizzle-orm'
import { withOrgContext } from '~~/server/db/client'
import { payments, units } from '~~/server/db/schema'
import { requireOrgSession } from '~~/server/utils/auth'
import { getOrgBySlug } from '~~/server/utils/org'
import { isStaffRole } from '~~/app/core/rbac/permissions'
import type { OrgRole } from '~~/app/core/types'

function mapPayment(row: typeof payments.$inferSelect) {
  return {
    id: row.id,
    organizationId: row.organizationId,
    unitId: row.unitId,
    invoiceId: row.invoiceId ?? undefined,
    amount: String(row.amount),
    method: row.method,
    reference: row.reference ?? undefined,
    status: row.status,
    submittedById: row.submittedById ?? undefined,
    verifiedById: row.verifiedById ?? undefined,
    notes: row.notes ?? undefined,
    paidAt: row.paidAt.toISOString(),
    verifiedAt: row.verifiedAt?.toISOString()
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
        if (allowedUnitIds.length === 0) return { payments: [] }
      }

      const rows = await tx.select().from(payments)
        .where(
          allowedUnitIds.length === unitRows.length
            ? eq(payments.organizationId, org.id)
            : inArray(payments.unitId, allowedUnitIds)
        )
        .orderBy(desc(payments.paidAt))

      return { payments: rows.map(mapPayment) }
    }
  )
})
