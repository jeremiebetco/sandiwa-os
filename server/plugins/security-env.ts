import { getDatabaseUrl } from '../db/connection'
import { getSessionSecret, isProductionRuntime } from '../utils/session-secret'

/**
 * Fail fast in production if secrets / DB URL are missing or placeholder.
 */
export default defineNitroPlugin(() => {
  if (!isProductionRuntime()) return

  getSessionSecret()
  getDatabaseUrl('app')
})
