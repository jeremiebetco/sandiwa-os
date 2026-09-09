import { and, eq } from 'drizzle-orm'
import { withOrgContext } from '~~/server/db/client'
import { intakeCases } from '~~/server/db/schema'
import { requireModuleAccess } from '~~/server/utils/auth'
import { getOrgBySlug } from '~~/server/utils/org'
import { canManageIntakeCase } from '~~/app/core/rbac/permissions'
import { sanitizeText } from '~~/app/core/utils/sanitize'
import type { IntakeStatus, OrgRole } from '~~/app/core/types'

const STATUSES: IntakeStatus[] = ['open', 'in_progress', 'resolved', 'closed']

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')!
  const id = getRouterParam(event, 'id')!
  const session = await requireModuleAccess(event, slug, 'intake')
  const org = await getOrgBySlug(slug)
  const body = await readBody<{
    status?: IntakeStatus
    assignedToId?: string | null
    assignedToName?: string | null
    resolutionNotes?: string | null
  }>(event)

  if (body.status && !STATUSES.includes(body.status)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid status' })
  }

  return withOrgContext(
    { organizationId: org.id, role: session.role, userId: session.userId },
    async (tx) => {
      const existing = await tx.select().from(intakeCases)
        .where(and(eq(intakeCases.id, id), eq(intakeCases.organizationId, org.id)))
        .limit(1)
      const current = existing[0]
      if (!current) throw createError({ statusCode: 404, statusMessage: 'Case not found' })

      if (!canManageIntakeCase(session.role as OrgRole, current.assignedToId ?? undefined, session.userId)) {
        throw createError({ statusCode: 403, statusMessage: 'Cannot manage this case' })
      }

      const patch: Partial<typeof intakeCases.$inferInsert> = {
        updatedAt: new Date()
      }
      if (body.status !== undefined) patch.status = body.status
      if (body.assignedToId !== undefined) patch.assignedToId = body.assignedToId
      if (body.assignedToName !== undefined) {
        patch.assignedToName = body.assignedToName
          ? sanitizeText(body.assignedToName, 256)
          : null
      }
      if (body.resolutionNotes !== undefined) {
        patch.resolutionNotes = body.resolutionNotes
          ? sanitizeText(body.resolutionNotes)
          : null
      }

      const [updated] = await tx.update(intakeCases)
        .set(patch)
        .where(and(eq(intakeCases.id, id), eq(intakeCases.organizationId, org.id)))
        .returning()

      const row = updated!
      return {
        case: {
          id: row.id,
          organizationId: row.organizationId,
          memberId: row.memberId,
          memberName: row.memberName,
          unit: row.unit ?? undefined,
          description: row.description,
          category: row.category,
          sentiment: row.sentiment,
          status: row.status,
          assignedToId: row.assignedToId ?? undefined,
          assignedToName: row.assignedToName ?? undefined,
          resolutionNotes: row.resolutionNotes ?? undefined,
          createdAt: row.createdAt.toISOString(),
          updatedAt: row.updatedAt.toISOString()
        }
      }
    }
  )
})
