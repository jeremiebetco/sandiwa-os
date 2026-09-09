import { desc, eq } from 'drizzle-orm'
import { withOrgContext } from '~~/server/db/client'
import { disbursementVouchers } from '~~/server/db/schema'
import { requireModuleAccess } from '~~/server/utils/auth'
import { getOrgBySlug } from '~~/server/utils/org'

function mapVoucher(row: typeof disbursementVouchers.$inferSelect) {
  return {
    id: row.id,
    organizationId: row.organizationId,
    accountId: row.accountId,
    payee: row.payee,
    description: row.description,
    amount: String(row.amount),
    status: row.status,
    requestedById: row.requestedById,
    approvedById: row.approvedById ?? undefined,
    paidAt: row.paidAt?.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  }
}

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')!
  const session = await requireModuleAccess(event, slug, 'ledger')
  const org = await getOrgBySlug(slug)

  return withOrgContext(
    { organizationId: org.id, role: session.role, userId: session.userId },
    async (tx) => {
      const rows = await tx.select().from(disbursementVouchers)
        .where(eq(disbursementVouchers.organizationId, org.id))
        .orderBy(desc(disbursementVouchers.createdAt))

      return { vouchers: rows.map(mapVoucher) }
    }
  )
})
