import { destroySession, assertCsrf } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  assertCsrf(event)
  await destroySession(event)
  return { ok: true }
})
