import { eq } from 'drizzle-orm'
import { withOrgContext, withPublicRead } from '~~/server/db/client'
import { announcements, organizations } from '~~/server/db/schema'
import { requireModuleAccess } from '~~/server/utils/auth'
import { sanitizeText } from '~~/app/core/utils/sanitize'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')!
  const session = await requireModuleAccess(event, slug, 'announcements')
  const body = await readBody<{ id?: string, title: string, body: string }>(event)

  const org = await withPublicRead(async (tx) => {
    const rows = await tx.select().from(organizations).where(eq(organizations.slug, slug)).limit(1)
    return rows[0]
  })
  if (!org) throw createError({ statusCode: 404, statusMessage: 'Not found' })

  return withOrgContext({ organizationId: org.id, role: session.role, userId: session.userId }, async (tx) => {
    const id = body.id || `ann-${crypto.randomUUID().slice(0, 8)}`
    const title = sanitizeText(body.title || '')
    const text = sanitizeText(body.body || '')
    if (!title || !text) throw createError({ statusCode: 400, statusMessage: 'title and body required' })

    const existing = await tx.select().from(announcements).where(eq(announcements.id, id)).limit(1)
    if (existing[0]) {
      const [updated] = await tx.update(announcements)
        .set({ title, body: text })
        .where(eq(announcements.id, id))
        .returning()
      return {
        announcement: {
          id: updated!.id,
          organizationId: updated!.organizationId,
          title: updated!.title,
          body: updated!.body,
          publishedAt: updated!.publishedAt.toISOString(),
          authorId: updated!.authorId
        }
      }
    }

    const [created] = await tx.insert(announcements).values({
      id,
      organizationId: org.id,
      title,
      body: text,
      authorId: session.userId,
      publishedAt: new Date()
    }).returning()

    return {
      announcement: {
        id: created!.id,
        organizationId: created!.organizationId,
        title: created!.title,
        body: created!.body,
        publishedAt: created!.publishedAt.toISOString(),
        authorId: created!.authorId
      }
    }
  })
})
