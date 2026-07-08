import { defineStore } from 'pinia'
import type { Organization, TenantContext } from '~/core/types'
import { resolveTenantFromHostname } from '~/core/tenant/resolver'
import { loadDatabase } from '~/core/seed/service'

interface TenantState {
  initialized: boolean
  context: TenantContext
  slug: string | null
  hostname: string
  organization: Organization | null
  unknownOrg: boolean
}

export const useTenantStore = defineStore('tenant', {
  state: (): TenantState => ({
    initialized: false,
    context: 'platform',
    slug: null,
    hostname: '',
    organization: null,
    unknownOrg: false
  }),

  getters: {
    isPlatform: state => state.context === 'platform',
    isOrganization: state => state.context === 'organization',
    organizationId: state => state.organization?.id ?? null
  },

  actions: {
    initialize() {
      const config = useRuntimeConfig()
      const platformDomain = (config.public.platformDomain as string) || undefined
      const resolution = resolveTenantFromHostname(undefined, platformDomain)
      this.context = resolution.context
      this.slug = resolution.slug
      this.hostname = resolution.hostname
      this.unknownOrg = false
      this.organization = null

      if (resolution.context === 'organization' && resolution.slug) {
        const db = loadDatabase()
        const org = db.organizations.find(o => o.slug === resolution.slug && o.status === 'active')
        if (org) {
          this.organization = org
        } else {
          this.unknownOrg = true
        }
      }

      this.initialized = true
    },

    refreshOrganization() {
      if (!this.slug) return
      const db = loadDatabase()
      const org = db.organizations.find(o => o.slug === this.slug && o.status === 'active')
      this.organization = org ?? null
      this.unknownOrg = !org
    }
  }
})
