import { and, eq } from 'drizzle-orm'
import { withOrgContext } from '~~/server/db/client'
import { clearanceRequests } from '~~/server/db/schema'
import { requirePermission } from '~~/server/utils/auth'
import { getOrgBySlug } from '~~/server/utils/org'
import { sanitizeText } from '~~/app/core/utils/sanitize'
import type { ClearanceStatus } from '~~/app/core/types'

const REVIEW_STATUSES: ClearanceStatus[] = ['approved', 'rejected', 'issued']

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')!
  const id = getRouterParam(event, 'id')!
  const session = await requirePermission(event, slug, 'clearance.review')
  const org = await getOrgBySlug(slug)
  const body = await readBody<{
    status: ClearanceStatus
    reviewNotes?: string
  }>(event)

  if (!REVIEW_STATUSES.includes(body.status)) {
    throw createError({ statusCode: 400, statusMessage: 'status must be approved, rejected, or issued' })
  }

  return withOrgContext(
    { organizationId: org.id, role: session.role, userId: session.userId },
    async (tx) => {
      const existing = await tx.select().from(clearanceRequests)
        .where(and(eq(clearanceRequests.id, id), eq(clearanceRequests.organizationId, org.id)))
        .limit(1)
      if (!existing[0]) throw createError({ statusCode: 404, statusMessage: 'Clearance not found' })

      const [row] = await tx.update(clearanceRequests)
        .set({
          status: body.status,
          reviewedById: session.userId,
          reviewNotes: body.reviewNotes ? sanitizeText(body.reviewNotes) : existing[0].reviewNotes,
          updatedAt: new Date()
        })
        .where(and(eq(clearanceRequests.id, id), eq(clearanceRequests.organizationId, org.id)))
        .returning()

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
