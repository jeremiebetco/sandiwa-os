import { and, eq } from 'drizzle-orm'
import { withOrgContext } from '~~/server/db/client'
import { orgUsers } from '~~/server/db/schema'
import { requireModuleAccess } from '~~/server/utils/auth'
import { getOrgBySlug } from '~~/server/utils/org'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')!
  const id = getRouterParam(event, 'id')!
  const session = await requireModuleAccess(event, slug, 'staff_management')
  const org = await getOrgBySlug(slug)

  if (id === session.userId) {
    throw createError({ statusCode: 400, statusMessage: 'Cannot delete your own account' })
  }

  await withOrgContext(
    { organizationId: org.id, role: session.role, userId: session.userId },
    async (tx) => {
      const existing = await tx.select({ id: orgUsers.id }).from(orgUsers)
        .where(and(eq(orgUsers.id, id), eq(orgUsers.organizationId, org.id)))
        .limit(1)
      if (!existing[0]) throw createError({ statusCode: 404, statusMessage: 'User not found' })
      await tx.delete(orgUsers).where(and(eq(orgUsers.id, id), eq(orgUsers.organizationId, org.id)))
    }
  )

  return { ok: true }
})
