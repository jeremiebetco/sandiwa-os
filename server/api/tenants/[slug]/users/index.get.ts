import { asc, eq } from 'drizzle-orm'
import { withOrgContext } from '~~/server/db/client'
import { orgUsers } from '~~/server/db/schema'
import { requireOrgSession } from '~~/server/utils/auth'
import { getOrgBySlug } from '~~/server/utils/org'
import { isStaffRole } from '~~/app/core/rbac/permissions'
import type { OrgRole } from '~~/app/core/types'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')!
  const session = await requireOrgSession(event, slug)
  if (!isStaffRole(session.role as OrgRole)) {
    throw createError({ statusCode: 403, statusMessage: 'Staff role required' })
  }
  const org = await getOrgBySlug(slug)

  return withOrgContext(
    { organizationId: org.id, role: session.role, userId: session.userId },
    async (tx) => {
      const rows = await tx.select({
        id: orgUsers.id,
        organizationId: orgUsers.organizationId,
        email: orgUsers.email,
        name: orgUsers.name,
        role: orgUsers.role,
        unitLabel: orgUsers.unitLabel,
        memberNo: orgUsers.memberNo,
        status: orgUsers.status,
        createdAt: orgUsers.createdAt
      }).from(orgUsers)
        .where(eq(orgUsers.organizationId, org.id))
        .orderBy(asc(orgUsers.name))

      return {
        users: rows.map(u => ({
          id: u.id,
          organizationId: u.organizationId,
          email: u.email,
          name: u.name,
          role: u.role,
          unit: u.unitLabel ?? undefined,
          memberNo: u.memberNo ?? undefined,
          status: u.status,
          createdAt: u.createdAt.toISOString()
        }))
      }
    }
  )
})
