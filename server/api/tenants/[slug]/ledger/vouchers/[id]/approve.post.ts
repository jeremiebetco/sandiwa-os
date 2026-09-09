import { and, eq } from 'drizzle-orm'
import { withOrgContext } from '~~/server/db/client'
import { disbursementVouchers, ledgerAccounts, ledgerEntries } from '~~/server/db/schema'
import { requirePermission } from '~~/server/utils/auth'
import { getOrgBySlug } from '~~/server/utils/org'
import { sanitizeText } from '~~/app/core/utils/sanitize'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')!
  const id = getRouterParam(event, 'id')!
  const session = await requirePermission(event, slug, 'voucher.approve')
  const org = await getOrgBySlug(slug)

  return withOrgContext(
    { organizationId: org.id, role: session.role, userId: session.userId },
    async (tx) => {
      const rows = await tx.select().from(disbursementVouchers)
        .where(and(eq(disbursementVouchers.id, id), eq(disbursementVouchers.organizationId, org.id)))
        .limit(1)
      const voucher = rows[0]
      if (!voucher) throw createError({ statusCode: 404, statusMessage: 'Voucher not found' })
      if (voucher.status !== 'pending_approval' && voucher.status !== 'draft') {
        throw createError({ statusCode: 400, statusMessage: 'Voucher cannot be approved' })
      }

      const [updated] = await tx.update(disbursementVouchers)
        .set({
          status: 'approved',
          approvedById: session.userId,
          updatedAt: new Date()
        })
        .where(eq(disbursementVouchers.id, id))
        .returning()

      const accounts = await tx.select().from(ledgerAccounts)
        .where(eq(ledgerAccounts.organizationId, org.id))
      const bank = accounts.find(a => a.code === '1100') || accounts.find(a => a.code === '1000')
      if (bank) {
        const entryDate = new Date().toISOString().slice(0, 10)
        const desc = sanitizeText(`Voucher ${voucher.id} approved — ${voucher.payee}`, 512)
        await tx.insert(ledgerEntries).values([
          {
            id: `le-${crypto.randomUUID().slice(0, 8)}`,
            organizationId: org.id,
            accountId: voucher.accountId,
            entryDate,
            description: desc,
            debit: String(voucher.amount),
            credit: '0',
            referenceType: 'voucher',
            referenceId: voucher.id
          },
          {
            id: `le-${crypto.randomUUID().slice(0, 8)}`,
            organizationId: org.id,
            accountId: bank.id,
            entryDate,
            description: desc,
            debit: '0',
            credit: String(voucher.amount),
            referenceType: 'voucher',
            referenceId: voucher.id
          }
        ])
      }

      return {
        voucher: {
          id: updated!.id,
          organizationId: updated!.organizationId,
          accountId: updated!.accountId,
          payee: updated!.payee,
          description: updated!.description,
          amount: String(updated!.amount),
          status: updated!.status,
          requestedById: updated!.requestedById,
          approvedById: updated!.approvedById ?? undefined,
          paidAt: updated!.paidAt?.toISOString(),
          createdAt: updated!.createdAt.toISOString(),
          updatedAt: updated!.updatedAt.toISOString()
        }
      }
    }
  )
})
