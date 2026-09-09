import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { withOrgContext, withPublicRead, db } from '~~/server/db/client'
import { organizations, orgUsers, platformAdmins, sessions } from '~~/server/db/schema'
import { createSession, setSessionCookie, assertCsrf, toSessionUser } from '~~/server/utils/auth'
import { verifyPassword } from '~~/server/utils/password'
import { consumeRateLimit } from '~~/server/utils/rate-limit'
import { isStaffRole, isMemberRole } from '~~/app/core/rbac/permissions'
import type { OrgRole } from '~~/app/core/types'

const LoginBodySchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(1).max(256),
  context: z.enum(['platform', 'organization']).default('organization'),
  orgSlug: z.string().trim().min(1).max(64).optional(),
  allowMember: z.boolean().optional()
})

function clientKey(event: Parameters<typeof getRequestIP>[0], email: string) {
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
  return `login:${ip}:${email.toLowerCase()}`
}

export default defineEventHandler(async (event) => {
  assertCsrf(event)

  const parsed = LoginBodySchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid login payload' })
  }

  const { email, password, context, orgSlug, allowMember } = parsed.data
  const normalizedEmail = email.toLowerCase()

  if (!consumeRateLimit(clientKey(event, normalizedEmail), {
    limit: 10,
    windowMs: 15 * 60 * 1000
  })) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Too many login attempts. Try again in 15 minutes.'
    })
  }

  if (context === 'platform') {
    const admins = await db.select().from(platformAdmins).where(eq(platformAdmins.email, normalizedEmail)).limit(1)
    const admin = admins[0]
    if (!admin || admin.status !== 'active' || !(await verifyPassword(password, admin.passwordHash))) {
      throw createError({ statusCode: 401, statusMessage: 'Invalid email or password.' })
    }

    await db.delete(sessions).where(eq(sessions.userId, admin.id))

    const token = await createSession({
      userId: admin.id,
      context: 'platform',
      role: 'platform_admin',
      email: admin.email,
      name: admin.name
    })
    setSessionCookie(event, token)

    return {
      user: toSessionUser({
        id: '',
        userId: admin.id,
        context: 'platform',
        organizationId: null,
        organizationSlug: null,
        role: 'platform_admin',
        email: admin.email,
        name: admin.name
      })
    }
  }

  const slug = orgSlug?.trim()
  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'orgSlug required for organization login' })
  }

  const org = await withPublicRead(async (tx) => {
    const rows = await tx.select().from(organizations).where(eq(organizations.slug, slug)).limit(1)
    return rows[0]
  })
  if (!org || org.status !== 'active') {
    throw createError({ statusCode: 404, statusMessage: 'Organization not found' })
  }

  const user = await withOrgContext({ organizationId: org.id }, async (tx) => {
    const rows = await tx.select().from(orgUsers).where(
      and(
        eq(orgUsers.organizationId, org.id),
        eq(orgUsers.email, normalizedEmail),
        eq(orgUsers.status, 'active')
      )
    ).limit(1)
    return rows[0]
  })

  // Uniform 401 — do not leak whether the account exists or is the wrong portal type
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid email or password.' })
  }

  const role = user.role as OrgRole
  const memberOk = allowMember === true && isMemberRole(role)
  if (!isStaffRole(role) && !memberOk) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid email or password.' })
  }

  await db.delete(sessions).where(eq(sessions.userId, user.id))

  const token = await createSession({
    userId: user.id,
    context: 'organization',
    organizationId: org.id,
    organizationSlug: org.slug,
    role: user.role,
    email: user.email,
    name: user.name
  })
  setSessionCookie(event, token)

  return {
    user: toSessionUser({
      id: '',
      userId: user.id,
      context: 'organization',
      organizationId: org.id,
      organizationSlug: org.slug,
      role: user.role,
      email: user.email,
      name: user.name
    })
  }
})
