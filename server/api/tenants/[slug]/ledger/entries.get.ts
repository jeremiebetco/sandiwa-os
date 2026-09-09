import { desc, eq } from 'drizzle-orm'
import { withOrgContext } from '~~/server/db/client'
import { ledgerEntries } from '~~/server/db/schema'
import { requireModuleAccess } from '~~/server/utils/auth'
import { getOrgBySlug } from '~~/server/utils/org'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')!
  const session = await requireModuleAccess(event, slug, 'ledger')
  const org = await getOrgBySlug(slug)

  return withOrgContext(
    { organizationId: org.id, role: session.role, userId: session.userId },
    async (tx) => {
      const rows = await tx.select().from(ledgerEntries)
        .where(eq(ledgerEntries.organizationId, org.id))
        .orderBy(desc(ledgerEntries.entryDate), desc(ledgerEntries.createdAt))

      return {
        entries: rows.map(e => ({
          id: e.id,
          organizationId: e.organizationId,
          accountId: e.accountId,
          entryDate: String(e.entryDate),
          description: e.description,
          debit: String(e.debit),
          credit: String(e.credit),
          referenceType: e.referenceType ?? undefined,
          referenceId: e.referenceId ?? undefined,
          createdAt: e.createdAt.toISOString()
        }))
      }
    }
  )
})
