import { withPlatformContext } from '~~/server/db/client'
import { officers, organizations } from '~~/server/db/schema'
import { requirePlatformAdmin } from '~~/server/utils/auth'
import { mapOrganization } from '~~/server/utils/mappers'

export default defineEventHandler(async (event) => {
  await requirePlatformAdmin(event)

  return withPlatformContext(async (tx) => {
    const orgs = await tx.select().from(organizations)
    const allOfficers = await tx.select().from(officers)
    return {
      organizations: orgs.map(org =>
        mapOrganization(org, allOfficers.filter(o => o.organizationId === org.id))
      )
    }
  })
})
