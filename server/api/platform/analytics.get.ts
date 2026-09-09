import { withPlatformContext } from '~~/server/db/client'
import { intakeCases, organizations } from '~~/server/db/schema'
import { requirePlatformAdmin } from '~~/server/utils/auth'
import { PLUGIN_KEYS } from '~~/app/core/types'

export default defineEventHandler(async (event) => {
  await requirePlatformAdmin(event)

  return withPlatformContext(async (tx) => {
    const orgs = await tx.select().from(organizations)
    const cases = await tx.select().from(intakeCases)
    const active = orgs.filter(o => o.status === 'active')
    const enabledPluginSlots = active.reduce((sum, org) => {
      const features = org.features as Record<string, boolean>
      return sum + PLUGIN_KEYS.filter(k => features[k]).length
    }, 0)

    return {
      analytics: {
        totalOrgs: orgs.length,
        activeOrgs: active.length,
        totalIntakeCases: cases.length,
        enabledPluginSlots
      }
    }
  })
})
