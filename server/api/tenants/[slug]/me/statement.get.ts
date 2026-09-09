import { and, desc, eq, inArray } from 'drizzle-orm'
import { withOrgContext } from '~~/server/db/client'
import { invoices, payments, units } from '~~/server/db/schema'
import { requireOrgSession } from '~~/server/utils/auth'
import { getOrgBySlug } from '~~/server/utils/org'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')!
  const session = await requireOrgSession(event, slug)
  const org = await getOrgBySlug(slug)

  return withOrgContext(
    { organizationId: org.id, role: session.role, userId: session.userId },
    async (tx) => {
      const mine = await tx.select().from(units)
        .where(and(
          eq(units.organizationId, org.id),
          eq(units.ownerUserId, session.userId)
        ))
      const unitIds = mine.map(u => u.id)
      if (unitIds.length === 0) {
        return { units: [], invoices: [], payments: [] }
      }

      const codeById = new Map(mine.map(u => [u.id, u.code]))
      const invRows = await tx.select().from(invoices)
        .where(inArray(invoices.unitId, unitIds))
        .orderBy(desc(invoices.issuedAt))
      const payRows = await tx.select().from(payments)
        .where(inArray(payments.unitId, unitIds))
        .orderBy(desc(payments.paidAt))

      return {
        units: mine.map(u => ({
          id: u.id,
          organizationId: u.organizationId,
          code: u.code,
          phase: u.phase ?? undefined,
          block: u.block ?? undefined,
          lot: u.lot ?? undefined,
          tower: u.tower ?? undefined,
          floor: u.floor ?? undefined,
          unitType: u.unitType,
          occupancy: u.occupancy,
          ownerUserId: u.ownerUserId ?? undefined,
          areaSqm: u.areaSqm != null ? String(u.areaSqm) : undefined,
          status: u.status
        })),
        invoices: invRows.map(inv => ({
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
        })),
        payments: payRows.map(p => ({
          id: p.id,
          organizationId: p.organizationId,
          unitId: p.unitId,
          invoiceId: p.invoiceId ?? undefined,
          amount: String(p.amount),
          method: p.method,
          reference: p.reference ?? undefined,
          status: p.status,
          submittedById: p.submittedById ?? undefined,
          verifiedById: p.verifiedById ?? undefined,
          notes: p.notes ?? undefined,
          paidAt: p.paidAt.toISOString(),
          verifiedAt: p.verifiedAt?.toISOString()
        }))
      }
    }
  )
})
