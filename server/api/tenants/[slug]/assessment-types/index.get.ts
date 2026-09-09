import { asc, eq } from 'drizzle-orm'
import { withOrgContext } from '~~/server/db/client'
import { assessmentTypes } from '~~/server/db/schema'
import { requireOrgSession } from '~~/server/utils/auth'
import { getOrgBySlug } from '~~/server/utils/org'
import { isStaffRole } from '~~/app/core/rbac/permissions'
import type { OrgRole } from '~~/app/core/types'

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
      const rows = await tx.select().from(assessmentTypes)
        .where(eq(assessmentTypes.organizationId, org.id))
        .orderBy(asc(assessmentTypes.name))

      return {
        assessmentTypes: rows.map(a => ({
          id: a.id,
          organizationId: a.organizationId,
          code: a.code,
          name: a.name,
          description: a.description ?? undefined,
          defaultAmount: String(a.defaultAmount),
          frequency: a.frequency,
          active: a.active
        }))
      }
    }
  )
})
