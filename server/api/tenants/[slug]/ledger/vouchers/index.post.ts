import { and, eq } from 'drizzle-orm'
import { withOrgContext } from '~~/server/db/client'
import { disbursementVouchers, ledgerAccounts } from '~~/server/db/schema'
import { requireModuleAccess } from '~~/server/utils/auth'
import { getOrgBySlug } from '~~/server/utils/org'
import { sanitizeText } from '~~/app/core/utils/sanitize'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')!
  const session = await requireModuleAccess(event, slug, 'ledger')
  const org = await getOrgBySlug(slug)
  const body = await readBody<{
    accountId: string
    payee: string
    description: string
    amount: string
    status?: 'draft' | 'pending_approval'
  }>(event)

  const accountId = body.accountId?.trim()
  const payee = sanitizeText(body.payee || '', 256)
  const description = sanitizeText(body.description || '')
  const amount = body.amount?.trim()
  if (!accountId || !payee || !description || !amount) {
    throw createError({ statusCode: 400, statusMessage: 'accountId, payee, description, and amount required' })
  }
  if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid amount' })
  }

  return withOrgContext(
    { organizationId: org.id, role: session.role, userId: session.userId },
    async (tx) => {
      const acct = await tx.select().from(ledgerAccounts)
        .where(and(eq(ledgerAccounts.id, accountId), eq(ledgerAccounts.organizationId, org.id)))
        .limit(1)
      if (!acct[0]) throw createError({ statusCode: 404, statusMessage: 'Account not found' })

      const id = `dv-${crypto.randomUUID().slice(0, 8)}`
      const status = body.status === 'pending_approval' ? 'pending_approval' : 'draft'
      const [row] = await tx.insert(disbursementVouchers).values({
        id,
        organizationId: org.id,
        accountId,
        payee,
        description,
        amount,
        status,
        requestedById: session.userId,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning()

      return {
        voucher: {
          id: row!.id,
          organizationId: row!.organizationId,
          accountId: row!.accountId,
          payee: row!.payee,
          description: row!.description,
          amount: String(row!.amount),
          status: row!.status,
          requestedById: row!.requestedById,
          approvedById: row!.approvedById ?? undefined,
          paidAt: row!.paidAt?.toISOString(),
          createdAt: row!.createdAt.toISOString(),
          updatedAt: row!.updatedAt.toISOString()
        }
      }
    }
  )
})
