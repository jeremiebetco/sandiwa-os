import { asc, eq } from 'drizzle-orm'
import { withOrgContext } from '~~/server/db/client'
import { ledgerAccounts } from '~~/server/db/schema'
import { requireModuleAccess } from '~~/server/utils/auth'
import { getOrgBySlug } from '~~/server/utils/org'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')!
  const session = await requireModuleAccess(event, slug, 'ledger')
  const org = await getOrgBySlug(slug)

  return withOrgContext(
    { organizationId: org.id, role: session.role, userId: session.userId },
    async (tx) => {
      const rows = await tx.select().from(ledgerAccounts)
        .where(eq(ledgerAccounts.organizationId, org.id))
        .orderBy(asc(ledgerAccounts.code))

      return {
        accounts: rows.map(a => ({
          id: a.id,
          organizationId: a.organizationId,
          code: a.code,
          name: a.name,
          accountType: a.accountType,
          fundCategory: a.fundCategory ?? undefined,
          active: a.active
        }))
      }
    }
  )
})
