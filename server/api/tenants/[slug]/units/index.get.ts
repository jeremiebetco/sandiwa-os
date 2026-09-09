import { asc, eq } from 'drizzle-orm'
import { withOrgContext } from '~~/server/db/client'
import { units } from '~~/server/db/schema'
import { requireOrgSession } from '~~/server/utils/auth'
import { getOrgBySlug } from '~~/server/utils/org'
import { isStaffRole } from '~~/app/core/rbac/permissions'
import type { OrgRole } from '~~/app/core/types'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')!
  const session = await requireOrgSession(event, slug)
  const org = await getOrgBySlug(slug)
  const role = session.role as OrgRole

  return withOrgContext(
    { organizationId: org.id, role: session.role, userId: session.userId },
    async (tx) => {
      let rows = await tx.select().from(units)
        .where(eq(units.organizationId, org.id))
        .orderBy(asc(units.code))

      if (!isStaffRole(role)) {
        rows = rows.filter(u => u.ownerUserId === session.userId)
      }

      return {
        units: rows.map(u => ({
          id: u.id,
          organizationId: u.organizationId,
          code: u.code,
          phase: u.phase ?? undefined,
          block: u.block ?? undefined,
          lot: u.lot ?? undefined,
          tower: u.tower ?? undefined,
          floor: u.floor ?? undefined,
          unitType: u.unitType,
          occupancy: u.occupancy,
          ownerUserId: u.ownerUserId ?? undefined,
          areaSqm: u.areaSqm != null ? String(u.areaSqm) : undefined,
          status: u.status
        }))
      }
    }
  )
})
