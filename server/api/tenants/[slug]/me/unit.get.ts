import { and, eq } from 'drizzle-orm'
import { withOrgContext } from '~~/server/db/client'
import { units } from '~~/server/db/schema'
import { requireOrgSession } from '~~/server/utils/auth'
import { getOrgBySlug } from '~~/server/utils/org'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')!
  const session = await requireOrgSession(event, slug)
  const org = await getOrgBySlug(slug)

  return withOrgContext(
    { organizationId: org.id, role: session.role, userId: session.userId },
    async (tx) => {
      const rows = await tx.select().from(units)
        .where(and(
          eq(units.organizationId, org.id),
          eq(units.ownerUserId, session.userId)
        ))

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
