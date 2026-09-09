import { withOrgContext } from '~~/server/db/client'
import { polls } from '~~/server/db/schema'
import { requirePermission } from '~~/server/utils/auth'
import { getOrgBySlug } from '~~/server/utils/org'
import { sanitizeText } from '~~/app/core/utils/sanitize'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')!
  const session = await requirePermission(event, slug, 'poll.create')
  const org = await getOrgBySlug(slug)
  const body = await readBody<{
    title: string
    description?: string
    eligibility?: 'per_unit' | 'per_member'
    quorumPercent?: number
    options: string[]
    status?: 'draft' | 'open'
    opensAt?: string
    closesAt?: string
  }>(event)

  const title = sanitizeText(body.title || '', 256)
  const description = sanitizeText(body.description || '')
  const options = Array.isArray(body.options)
    ? body.options.map(o => sanitizeText(String(o), 256)).filter(Boolean)
    : []
  if (!title || options.length < 2) {
    throw createError({ statusCode: 400, statusMessage: 'title and at least 2 options required' })
  }

  const eligibility = body.eligibility === 'per_member' ? 'per_member' : 'per_unit'
  const quorumPercent = Number.isFinite(body.quorumPercent) ? Math.min(100, Math.max(0, Number(body.quorumPercent))) : 50
  const status = body.status === 'open' ? 'open' : 'draft'

  return withOrgContext(
    { organizationId: org.id, role: session.role, userId: session.userId },
    async (tx) => {
      const id = `poll-${crypto.randomUUID().slice(0, 8)}`
      const [row] = await tx.insert(polls).values({
        id,
        organizationId: org.id,
        title,
        description,
        status,
        eligibility,
        quorumPercent,
        options,
        opensAt: body.opensAt ? new Date(body.opensAt) : (status === 'open' ? new Date() : null),
        closesAt: body.closesAt ? new Date(body.closesAt) : null,
        createdById: session.userId,
        createdAt: new Date()
      }).returning()

      return {
        poll: {
          id: row!.id,
          organizationId: row!.organizationId,
          title: row!.title,
          description: row!.description,
          status: row!.status,
          eligibility: row!.eligibility,
          quorumPercent: row!.quorumPercent,
          options: row!.options,
          opensAt: row!.opensAt?.toISOString(),
          closesAt: row!.closesAt?.toISOString(),
          createdById: row!.createdById,
          summary: row!.summary ?? undefined,
          createdAt: row!.createdAt.toISOString()
        }
      }
    }
  )
})
