import { z } from 'zod'
import { withOrgContext } from '~~/server/db/client'
import { intakeCases } from '~~/server/db/schema'
import { requireOrgSession } from '~~/server/utils/auth'
import { getOrgBySlug } from '~~/server/utils/org'
import { sanitizeText } from '~~/app/core/utils/sanitize'
import { INTAKE_CATEGORIES } from '~~/app/core/types'

const SENTIMENTS = ['neutral', 'concerned', 'urgent'] as const

const IntakeCreateSchema = z.object({
  description: z.string().trim().min(1).max(5000),
  category: z.enum(INTAKE_CATEGORIES),
  unit: z.string().trim().max(128).optional(),
  sentiment: z.enum(SENTIMENTS).optional()
})

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')!
  const session = await requireOrgSession(event, slug)
  const org = await getOrgBySlug(slug)

  const parsed = IntakeCreateSchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid intake payload' })
  }

  const description = sanitizeText(parsed.data.description)
  const category = parsed.data.category
  const sentiment = parsed.data.sentiment ?? 'neutral'
  const unit = parsed.data.unit ? sanitizeText(parsed.data.unit, 128) : undefined

  return withOrgContext(
    { organizationId: org.id, role: session.role, userId: session.userId },
    async (tx) => {
      const id = `case-${crypto.randomUUID().slice(0, 8)}`
      const [created] = await tx.insert(intakeCases).values({
        id,
        organizationId: org.id,
        memberId: session.userId,
        memberName: session.name,
        unit: unit || null,
        description,
        category,
        sentiment,
        status: 'open',
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning()

      const row = created!
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
