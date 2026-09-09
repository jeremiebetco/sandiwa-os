import { desc, eq, inArray } from 'drizzle-orm'
import { withOrgContext } from '~~/server/db/client'
import { invoices, units } from '~~/server/db/schema'
import { requireOrgSession } from '~~/server/utils/auth'
import { getOrgBySlug } from '~~/server/utils/org'
import { isStaffRole } from '~~/app/core/rbac/permissions'
import type { OrgRole } from '~~/app/core/types'

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
        if (allowedUnitIds.length === 0) return { invoices: [] }
      }

      const codeById = new Map(unitRows.map(u => [u.id, u.code]))
      const rows = await tx.select().from(invoices)
        .where(
          allowedUnitIds.length === unitRows.length
            ? eq(invoices.organizationId, org.id)
            : inArray(invoices.unitId, allowedUnitIds)
        )
        .orderBy(desc(invoices.issuedAt))

      return {
        invoices: rows.map(inv => ({
          id: inv.id,
          organizationId: inv.organizationId,
          unitId: inv.unitId,
          assessmentTypeId: inv.assessmentTypeId ?? undefined,
          period: inv.period,
          description: inv.description,
          amount: String(inv.amount),
          penaltyAmount: String(inv.penaltyAmount),
          amountPaid: String(inv.amountPaid),
          status: inv.status,
          dueDate: String(inv.dueDate),
          issuedAt: inv.issuedAt.toISOString(),
          unitCode: codeById.get(inv.unitId)
        }))
      }
    }
  )
})
