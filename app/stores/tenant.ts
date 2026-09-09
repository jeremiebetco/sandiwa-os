import { defineStore } from 'pinia'
import type { Organization, TenantContext } from '~/core/types'
import { parseTenantRoutingConfig } from '~/core/tenant/domain'
import { resolveTenantFromHostname } from '~/core/tenant/resolver'

interface TenantState {
  initialized: boolean
  context: TenantContext
  slug: string | null
  hostname: string
  routingMode: TenantRoutingMode
  organization: Organization | null
  unknownOrg: boolean
  loading: boolean
}

export const useTenantStore = defineStore('tenant', {
  state: (): TenantState => ({
    initialized: false,
    context: 'platform',
    slug: null,
    hostname: '',
    routingMode: 'subdomain',
    organization: null,
    unknownOrg: false,
    loading: false
  }),

  getters: {
    isPlatform: state => state.context === 'platform',
    isOrganization: state => state.context === 'organization',
    organizationId: state => state.organization?.id ?? null
  },

  actions: {
    async initialize() {
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
        await this.loadOrganization(resolution.slug)
      }

      this.initialized = true
    },

    async loadOrganization(slug: string) {
      this.loading = true
      try {
        const res = await $fetch<{ organization: Organization }>(`/api/tenants/${slug}`)
        this.organization = res.organization
        this.unknownOrg = false
      } catch {
        this.organization = null
        this.unknownOrg = true
      } finally {
        this.loading = false
      }
    },

    async refreshOrganization() {
      if (!this.slug) return
      await this.loadOrganization(this.slug)
    }
  }
})
