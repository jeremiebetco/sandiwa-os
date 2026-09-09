import { eq } from 'drizzle-orm'
import { withOrgContext } from '~~/server/db/client'
import { invoices } from '~~/server/db/schema'
import { requireOrgSession } from '~~/server/utils/auth'
import { getOrgBySlug } from '~~/server/utils/org'
import { isStaffRole } from '~~/app/core/rbac/permissions'
import type { OrgRole } from '~~/app/core/types'

function daysPastDue(dueDate: string, today: Date): number {
  const due = new Date(`${dueDate}T00:00:00.000Z`)
  const diff = today.getTime() - due.getTime()
  return Math.floor(diff / (24 * 60 * 60 * 1000))
}

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')!
  const session = await requireOrgSession(event, slug)
  const org = await getOrgBySlug(slug)
  const role = session.role as OrgRole

  if (!isStaffRole(role)) {
    throw createError({ statusCode: 403, statusMessage: 'Staff role required' })
  }

  return withOrgContext(
    { organizationId: org.id, role: session.role, userId: session.userId },
    async (tx) => {
      const rows = await tx.select().from(invoices)
        .where(eq(invoices.organizationId, org.id))

      const openStatuses = new Set(['open', 'partial', 'overdue'])
      const today = new Date()
      const buckets = {
        current: { count: 0, amount: 0 },
        days30: { count: 0, amount: 0 },
        days60: { count: 0, amount: 0 },
        days90Plus: { count: 0, amount: 0 }
      }

      for (const inv of rows) {
        if (!openStatuses.has(inv.status)) continue
        const balance = Number(inv.amount) + Number(inv.penaltyAmount) - Number(inv.amountPaid)
        if (balance <= 0) continue

        const age = daysPastDue(String(inv.dueDate), today)
        let bucket: keyof typeof buckets
        if (age <= 0) bucket = 'current'
        else if (age <= 30) bucket = 'days30'
        else if (age <= 60) bucket = 'days60'
        else bucket = 'days90Plus'

        buckets[bucket].count += 1
        buckets[bucket].amount += balance
      }

      return {
        aging: {
          current: { count: buckets.current.count, amount: buckets.current.amount.toFixed(2) },
          days30: { count: buckets.days30.count, amount: buckets.days30.amount.toFixed(2) },
          days60: { count: buckets.days60.count, amount: buckets.days60.amount.toFixed(2) },
          days90Plus: { count: buckets.days90Plus.count, amount: buckets.days90Plus.amount.toFixed(2) }
        }
      }
    }
  )
})
