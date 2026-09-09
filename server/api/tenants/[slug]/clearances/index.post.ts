import { and, eq } from 'drizzle-orm'
import { withOrgContext } from '~~/server/db/client'
import { clearanceRequests, units } from '~~/server/db/schema'
import { requireOrgSession } from '~~/server/utils/auth'
import { getOrgBySlug } from '~~/server/utils/org'
import { isStaffRole } from '~~/app/core/rbac/permissions'
import { sanitizeText } from '~~/app/core/utils/sanitize'
import type { ClearanceType, OrgRole } from '~~/app/core/types'

const TYPES: ClearanceType[] = ['hoa_clearance', 'move_in', 'move_out', 'resale', 'certificate']

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')!
  const session = await requireOrgSession(event, slug)
  const org = await getOrgBySlug(slug)
  const body = await readBody<{
    unitId: string
    type?: ClearanceType
    purpose?: string
  }>(event)

  const unitId = body.unitId?.trim()
  if (!unitId) throw createError({ statusCode: 400, statusMessage: 'unitId required' })
  const type = body.type && TYPES.includes(body.type) ? body.type : 'hoa_clearance'

  return withOrgContext(
    { organizationId: org.id, role: session.role, userId: session.userId },
    async (tx) => {
      const unitRows = await tx.select().from(units)
        .where(and(eq(units.id, unitId), eq(units.organizationId, org.id)))
        .limit(1)
      const unit = unitRows[0]
      if (!unit) throw createError({ statusCode: 404, statusMessage: 'Unit not found' })

      if (!isStaffRole(session.role as OrgRole) && unit.ownerUserId !== session.userId) {
        throw createError({ statusCode: 403, statusMessage: 'Not your unit' })
      }

      const id = `clr-${crypto.randomUUID().slice(0, 8)}`
      const [row] = await tx.insert(clearanceRequests).values({
        id,
        organizationId: org.id,
        unitId,
        requesterId: session.userId,
        requesterName: session.name,
        type,
        purpose: body.purpose ? sanitizeText(body.purpose) : null,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning()

      return {
        clearance: {
          id: row!.id,
          organizationId: row!.organizationId,
          unitId: row!.unitId,
          requesterId: row!.requesterId,
          requesterName: row!.requesterName,
          type: row!.type,
          purpose: row!.purpose ?? undefined,
          status: row!.status,
          reviewedById: row!.reviewedById ?? undefined,
          reviewNotes: row!.reviewNotes ?? undefined,
          createdAt: row!.createdAt.toISOString(),
          updatedAt: row!.updatedAt.toISOString()
        }
      }
    }
  )
})
