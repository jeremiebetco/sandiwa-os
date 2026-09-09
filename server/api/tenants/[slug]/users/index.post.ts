import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { withOrgContext } from '~~/server/db/client'
import { orgUsers } from '~~/server/db/schema'
import { requireModuleAccess } from '~~/server/utils/auth'
import { getOrgBySlug } from '~~/server/utils/org'
import { hashPassword } from '~~/server/utils/password'
import { sanitizeText } from '~~/app/core/utils/sanitize'
import type { OrgRole } from '~~/app/core/types'

const ORG_ROLES = ['org_admin', 'manager', 'committee_lead', 'staff', 'member'] as const

const UpsertUserSchema = z.object({
  id: z.string().trim().min(1).max(64).optional(),
  email: z.string().trim().email().max(255),
  name: z.string().trim().min(1).max(256),
  role: z.enum(ORG_ROLES),
  password: z.string().min(8).max(256).optional(),
  unit: z.string().trim().max(128).optional(),
  memberNo: z.string().trim().max(64).optional(),
  status: z.enum(['active', 'inactive']).optional()
})

function mapUser(row: {
  id: string
  organizationId: string
  email: string
  name: string
  role: string
  unitLabel: string | null
  memberNo: string | null
  status: string
  createdAt: Date
}) {
  return {
    id: row.id,
    organizationId: row.organizationId,
    email: row.email,
    name: row.name,
    role: row.role,
    unit: row.unitLabel ?? undefined,
    memberNo: row.memberNo ?? undefined,
    status: row.status,
    createdAt: row.createdAt.toISOString()
  }
}

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')!
  const session = await requireModuleAccess(event, slug, 'staff_management')
  const org = await getOrgBySlug(slug)

  const parsed = UpsertUserSchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid user payload' })
  }

  const body = parsed.data
  const email = sanitizeText(body.email.toLowerCase(), 255)
  const name = sanitizeText(body.name, 256)
  const role = body.role as OrgRole
  const status = body.status === 'inactive' ? 'inactive' : 'active'
  const unitLabel = body.unit ? sanitizeText(body.unit, 128) : null
  const memberNo = body.memberNo ? sanitizeText(body.memberNo, 64) : null

  return withOrgContext(
    { organizationId: org.id, role: session.role, userId: session.userId },
    async (tx) => {
      const id = body.id || `user-${crypto.randomUUID().slice(0, 8)}`
      const existing = await tx.select().from(orgUsers)
        .where(and(eq(orgUsers.id, id), eq(orgUsers.organizationId, org.id)))
        .limit(1)

      if (existing[0]) {
        const patch: Partial<typeof orgUsers.$inferInsert> = {
          email,
          name,
          role,
          status,
          unitLabel,
          memberNo
        }
        if (body.password && body.password.length >= 8) {
          patch.passwordHash = await hashPassword(body.password)
        }
        const [updated] = await tx.update(orgUsers)
          .set(patch)
          .where(and(eq(orgUsers.id, id), eq(orgUsers.organizationId, org.id)))
          .returning({
            id: orgUsers.id,
            organizationId: orgUsers.organizationId,
            email: orgUsers.email,
            name: orgUsers.name,
            role: orgUsers.role,
            unitLabel: orgUsers.unitLabel,
            memberNo: orgUsers.memberNo,
            status: orgUsers.status,
            createdAt: orgUsers.createdAt
          })
        return { user: mapUser(updated!) }
      }

      if (!body.password || body.password.length < 8) {
        throw createError({ statusCode: 400, statusMessage: 'password required (min 8 chars)' })
      }

      const passwordHash = await hashPassword(body.password)
      const [created] = await tx.insert(orgUsers).values({
        id,
        organizationId: org.id,
        email,
        passwordHash,
        name,
        role,
        unitLabel,
        memberNo,
        status
      }).returning({
        id: orgUsers.id,
        organizationId: orgUsers.organizationId,
        email: orgUsers.email,
        name: orgUsers.name,
        role: orgUsers.role,
        unitLabel: orgUsers.unitLabel,
        memberNo: orgUsers.memberNo,
        status: orgUsers.status,
        createdAt: orgUsers.createdAt
      })

      return { user: mapUser(created!) }
    }
  )
})
