import { defineStore } from 'pinia'
import type { Organization, TenantContext } from '~/core/types'
import { parseTenantRoutingConfig, resolveTenantRoutingMode } from '~/core/tenant/domain'
import { resolveTenantFromHostname } from '~/core/tenant/resolver'
import { loadDatabase } from '~/core/seed/service'

interface TenantState {
  initialized: boolean
  context: TenantContext
  slug: string | null
  hostname: string
  routingMode: TenantRoutingMode
  organization: Organization | null
  unknownOrg: boolean
}

export const useTenantStore = defineStore('tenant', {
  state: (): TenantState => ({
    initialized: false,
    context: 'platform',
    slug: null,
    hostname: '',
    routingMode: 'subdomain',
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
      const configuredDomain = (config.public.platformDomain as string) || undefined
      const routingConfig = parseTenantRoutingConfig(config.public.tenantRouting as string | undefined)
      const resolution = resolveTenantFromHostname(
        undefined,
        configuredDomain,
        import.meta.client ? window.location.pathname : undefined,
        routingConfig
      )

      this.context = resolution.context
      this.slug = resolution.slug
      this.hostname = resolution.hostname
      this.routingMode = resolution.routingMode
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
