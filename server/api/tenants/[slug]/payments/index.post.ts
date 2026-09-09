import { and, eq } from 'drizzle-orm'
import { withOrgContext } from '~~/server/db/client'
import { invoices, payments, units } from '~~/server/db/schema'
import { requirePermission } from '~~/server/utils/auth'
import { getOrgBySlug } from '~~/server/utils/org'
import { isStaffRole } from '~~/app/core/rbac/permissions'
import { sanitizeText } from '~~/app/core/utils/sanitize'
import type { OrgRole, PaymentMethod } from '~~/app/core/types'

const METHODS: PaymentMethod[] = ['gcash', 'maya', 'bank_transfer', 'cash', 'check', 'other']

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')!
  const session = await requirePermission(event, slug, 'payment.post')
  const org = await getOrgBySlug(slug)
  const body = await readBody<{
    unitId: string
    invoiceId?: string
    amount: string
    method: PaymentMethod
    reference?: string
    notes?: string
  }>(event)

  const unitId = body.unitId?.trim()
  const amount = body.amount?.trim()
  if (!unitId || !amount) {
    throw createError({ statusCode: 400, statusMessage: 'unitId and amount required' })
  }
  if (!METHODS.includes(body.method)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid payment method' })
  }
  const amountNum = Number(amount)
  if (!Number.isFinite(amountNum) || amountNum <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid amount' })
  }

  return withOrgContext(
    { organizationId: org.id, role: session.role, userId: session.userId },
    async (tx) => {
      const unitRows = await tx.select().from(units)
        .where(and(eq(units.id, unitId), eq(units.organizationId, org.id)))
        .limit(1)
      const unit = unitRows[0]
      if (!unit) throw createError({ statusCode: 404, statusMessage: 'Unit not found' })

      if (!isStaffRole(session.role as OrgRole) && unit.ownerUserId !== session.userId) {
        throw createError({ statusCode: 403, statusMessage: 'Not your unit' })
      }

      if (body.invoiceId) {
        const inv = await tx.select().from(invoices)
          .where(and(
            eq(invoices.id, body.invoiceId),
            eq(invoices.organizationId, org.id),
            eq(invoices.unitId, unitId)
          ))
          .limit(1)
        if (!inv[0]) throw createError({ statusCode: 404, statusMessage: 'Invoice not found' })
      }

      const id = `pay-${crypto.randomUUID().slice(0, 8)}`
      const [row] = await tx.insert(payments).values({
        id,
        organizationId: org.id,
        unitId,
        invoiceId: body.invoiceId || null,
        amount,
        method: body.method,
        reference: body.reference ? sanitizeText(body.reference, 256) : null,
        notes: body.notes ? sanitizeText(body.notes) : null,
        status: 'pending',
        submittedById: session.userId,
        paidAt: new Date()
      }).returning()

      return {
        payment: {
          id: row!.id,
          organizationId: row!.organizationId,
          unitId: row!.unitId,
          invoiceId: row!.invoiceId ?? undefined,
          amount: String(row!.amount),
          method: row!.method,
          reference: row!.reference ?? undefined,
          status: row!.status,
          submittedById: row!.submittedById ?? undefined,
          verifiedById: row!.verifiedById ?? undefined,
          notes: row!.notes ?? undefined,
          paidAt: row!.paidAt.toISOString(),
          verifiedAt: row!.verifiedAt?.toISOString()
        }
      }
    }
  )
})
