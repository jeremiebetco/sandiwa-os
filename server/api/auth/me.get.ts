import { getAuthSession, toSessionUser } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const session = await getAuthSession(event)
  if (!session) {
    return { user: null }
  }
  return { user: toSessionUser(session) }
})
