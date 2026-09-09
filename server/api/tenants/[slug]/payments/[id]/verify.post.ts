import { and, eq } from 'drizzle-orm'
import { withOrgContext } from '~~/server/db/client'
import { invoices, ledgerAccounts, ledgerEntries, payments } from '~~/server/db/schema'
import { requirePermission } from '~~/server/utils/auth'
import { getOrgBySlug } from '~~/server/utils/org'
import { sanitizeText } from '~~/app/core/utils/sanitize'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')!
  const id = getRouterParam(event, 'id')!
  const session = await requirePermission(event, slug, 'payment.verify')
  const org = await getOrgBySlug(slug)
  const body = await readBody<{
    action: 'verify' | 'reject'
    notes?: string
  }>(event)

  if (body.action !== 'verify' && body.action !== 'reject') {
    throw createError({ statusCode: 400, statusMessage: 'action must be verify or reject' })
  }

  return withOrgContext(
    { organizationId: org.id, role: session.role, userId: session.userId },
    async (tx) => {
      const rows = await tx.select().from(payments)
        .where(and(eq(payments.id, id), eq(payments.organizationId, org.id)))
        .limit(1)
      const payment = rows[0]
      if (!payment) throw createError({ statusCode: 404, statusMessage: 'Payment not found' })
      if (payment.status !== 'pending') {
        throw createError({ statusCode: 400, statusMessage: 'Payment already processed' })
      }

      if (body.action === 'reject') {
        const [updated] = await tx.update(payments)
          .set({
            status: 'rejected',
            verifiedById: session.userId,
            verifiedAt: new Date(),
            notes: body.notes ? sanitizeText(body.notes) : payment.notes
          })
          .where(eq(payments.id, id))
          .returning()

        return {
          payment: {
            id: updated!.id,
            organizationId: updated!.organizationId,
            unitId: updated!.unitId,
            invoiceId: updated!.invoiceId ?? undefined,
            amount: String(updated!.amount),
            method: updated!.method,
            reference: updated!.reference ?? undefined,
            status: updated!.status,
            submittedById: updated!.submittedById ?? undefined,
            verifiedById: updated!.verifiedById ?? undefined,
            notes: updated!.notes ?? undefined,
            paidAt: updated!.paidAt.toISOString(),
            verifiedAt: updated!.verifiedAt?.toISOString()
          }
        }
      }

      const accounts = await tx.select().from(ledgerAccounts)
        .where(eq(ledgerAccounts.organizationId, org.id))
      const bank = accounts.find(a => a.code === '1100') || accounts.find(a => a.code === '1000')
      const dues = accounts.find(a => a.code === '4000')
      if (!bank || !dues) {
        throw createError({ statusCode: 500, statusMessage: 'Ledger accounts (bank/dues) not configured' })
      }

      const [updated] = await tx.update(payments)
        .set({
          status: 'verified',
          verifiedById: session.userId,
          verifiedAt: new Date(),
          notes: body.notes ? sanitizeText(body.notes) : payment.notes
        })
        .where(eq(payments.id, id))
        .returning()

      if (payment.invoiceId) {
        const invRows = await tx.select().from(invoices)
          .where(and(eq(invoices.id, payment.invoiceId), eq(invoices.organizationId, org.id)))
          .limit(1)
        const inv = invRows[0]
        if (inv) {
          const paid = Number(inv.amountPaid) + Number(payment.amount)
          const total = Number(inv.amount) + Number(inv.penaltyAmount)
          let status: typeof inv.status = 'partial'
          if (paid >= total) status = 'paid'
          else if (paid <= 0) status = inv.status === 'overdue' ? 'overdue' : 'open'

          await tx.update(invoices)
            .set({ amountPaid: paid.toFixed(2), status })
            .where(eq(invoices.id, inv.id))
        }
      }

      const entryDate = new Date().toISOString().slice(0, 10)
      const desc = sanitizeText(`Payment ${payment.id} verified`, 512)
      await tx.insert(ledgerEntries).values([
        {
          id: `le-${crypto.randomUUID().slice(0, 8)}`,
          organizationId: org.id,
          accountId: bank.id,
          entryDate,
          description: desc,
          debit: String(payment.amount),
          credit: '0',
          referenceType: 'payment',
          referenceId: payment.id
        },
        {
          id: `le-${crypto.randomUUID().slice(0, 8)}`,
          organizationId: org.id,
          accountId: dues.id,
          entryDate,
          description: desc,
          debit: '0',
          credit: String(payment.amount),
          referenceType: 'payment',
          referenceId: payment.id
        }
      ])

      return {
        payment: {
          id: updated!.id,
          organizationId: updated!.organizationId,
          unitId: updated!.unitId,
          invoiceId: updated!.invoiceId ?? undefined,
          amount: String(updated!.amount),
          method: updated!.method,
          reference: updated!.reference ?? undefined,
          status: updated!.status,
          submittedById: updated!.submittedById ?? undefined,
          verifiedById: updated!.verifiedById ?? undefined,
          notes: updated!.notes ?? undefined,
          paidAt: updated!.paidAt.toISOString(),
          verifiedAt: updated!.verifiedAt?.toISOString()
        }
      }
    }
  )
})
