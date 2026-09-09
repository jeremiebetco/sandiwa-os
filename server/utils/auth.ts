import { and, eq, gt } from 'drizzle-orm'
import type { H3Event } from 'h3'
import { createError, getCookie, getHeader, getMethod, getRequestURL, setCookie, deleteCookie } from 'h3'
import { db } from '../db/client'
import { sessions } from '../db/schema'
import { isAllowedCsrfOrigin } from './csrf'
import { generateSessionToken, hashToken } from './password'
import {
  canAccessModule,
  type ActionPermission,
  canPerformAction
} from '~~/app/core/rbac/permissions'
import type { OrgRole, PluginKey } from '~~/app/core/types'

export const SESSION_COOKIE = 'sandiwa_session'
const SESSION_DAYS = 14

export type AuthSession = {
  id: string
  userId: string
  context: 'platform' | 'organization'
  organizationId: string | null
  organizationSlug: string | null
  role: string
  email: string
  name: string
}

export async function createSession(params: {
  userId: string
  context: 'platform' | 'organization'
  organizationId?: string | null
  organizationSlug?: string | null
  role: string
  email: string
  name: string
}): Promise<string> {
  const token = generateSessionToken()
  const tokenHash = hashToken(token)
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000)

  await db.insert(sessions).values({
    tokenHash,
    userId: params.userId,
    context: params.context,
    organizationId: params.organizationId ?? null,
    organizationSlug: params.organizationSlug ?? null,
    role: params.role,
    email: params.email,
    name: params.name,
    expiresAt
  })

  return token
}

export function setSessionCookie(event: H3Event, token: string) {
  const isProd = process.env.NODE_ENV === 'production'
  setCookie(event, SESSION_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DAYS * 24 * 60 * 60
  })
}

export function clearSessionCookie(event: H3Event) {
  deleteCookie(event, SESSION_COOKIE, { path: '/' })
}

export async function getAuthSession(event: H3Event): Promise<AuthSession | null> {
  const token = getCookie(event, SESSION_COOKIE)
  if (!token) return null

  const tokenHash = hashToken(token)
  const rows = await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.tokenHash, tokenHash), gt(sessions.expiresAt, new Date())))
    .limit(1)

  const row = rows[0]
  if (!row) return null

  return {
    id: row.id,
    userId: row.userId,
    context: row.context,
    organizationId: row.organizationId,
    organizationSlug: row.organizationSlug,
    role: row.role,
    email: row.email,
    name: row.name
  }
}

export async function destroySession(event: H3Event) {
  const token = getCookie(event, SESSION_COOKIE)
  if (token) {
    await db.delete(sessions).where(eq(sessions.tokenHash, hashToken(token)))
  }
  clearSessionCookie(event)
}

export function assertCsrf(event: H3Event) {
  const method = getMethod(event).toUpperCase()
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return

  const secFetchSite = getHeader(event, 'sec-fetch-site')
  // same-origin / none (navigate) are safe. Do NOT trust same-site alone —
  // on *.vercel.app, unrelated apps share the eTLD+1 and report same-site.
  if (secFetchSite === 'same-origin' || secFetchSite === 'none') {
    return
  }

  const origin = getHeader(event, 'origin')
  if (!origin) {
    // Non-browser clients (tests/scripts) without Origin — allow in development
    if (process.env.NODE_ENV !== 'production') return
    throw createError({ statusCode: 403, statusMessage: 'CSRF: missing Origin' })
  }

  const url = getRequestURL(event)
  let originHost: string
  try {
    originHost = new URL(origin).host
  } catch {
    throw createError({ statusCode: 403, statusMessage: 'CSRF: invalid Origin' })
  }

  const platformDomain = process.env.NUXT_PUBLIC_PLATFORM_DOMAIN
  if (isAllowedCsrfOrigin(originHost, url.host, platformDomain)) {
    return
  }

  throw createError({ statusCode: 403, statusMessage: 'CSRF: origin mismatch' })
}

export async function requireSession(event: H3Event): Promise<AuthSession> {
  assertCsrf(event)
  const session = await getAuthSession(event)
  if (!session) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  return session
}

export async function requirePlatformAdmin(event: H3Event): Promise<AuthSession> {
  const session = await requireSession(event)
  if (session.context !== 'platform' || session.role !== 'platform_admin') {
    throw createError({ statusCode: 403, statusMessage: 'Platform admin required' })
  }
  return session
}

/**
 * Require org session bound to the given slug (prevents cross-tenant on shared-host path routing).
 */
export async function requireOrgSession(event: H3Event, orgSlug: string): Promise<AuthSession> {
  const session = await requireSession(event)
  if (session.context !== 'organization') {
    throw createError({ statusCode: 403, statusMessage: 'Organization session required' })
  }
  if (session.organizationSlug !== orgSlug) {
    throw createError({ statusCode: 403, statusMessage: 'Tenant mismatch' })
  }
  return session
}

export async function requireOrgRole(
  event: H3Event,
  orgSlug: string,
  roles: OrgRole[]
): Promise<AuthSession> {
  const session = await requireOrgSession(event, orgSlug)
  if (!roles.includes(session.role as OrgRole)) {
    throw createError({ statusCode: 403, statusMessage: 'Insufficient role' })
  }
  return session
}

export async function requireModuleAccess(
  event: H3Event,
  orgSlug: string,
  plugin: PluginKey
): Promise<AuthSession> {
  const session = await requireOrgSession(event, orgSlug)
  if (!canAccessModule(session.role as OrgRole, plugin)) {
    throw createError({ statusCode: 403, statusMessage: 'Module access denied' })
  }
  const { getOrgBySlug } = await import('./org')
  const org = await getOrgBySlug(orgSlug)
  const features = (org.features || {}) as Record<string, boolean>
  if (!features[plugin]) {
    throw createError({ statusCode: 403, statusMessage: 'Feature disabled for this organization' })
  }
  return session
}

export async function requirePermission(
  event: H3Event,
  orgSlug: string,
  action: ActionPermission
): Promise<AuthSession> {
  const session = await requireOrgSession(event, orgSlug)
  if (!canPerformAction(session.role as OrgRole, action)) {
    throw createError({ statusCode: 403, statusMessage: 'Permission denied' })
  }
  return session
}

export function toSessionUser(session: AuthSession) {
  return {
    id: session.userId,
    email: session.email,
    name: session.name,
    role: session.role,
    context: session.context,
    organizationId: session.organizationId ?? undefined,
    organizationSlug: session.organizationSlug ?? undefined
  }
}
