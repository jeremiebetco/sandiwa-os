import { defineStore } from 'pinia'
import type {
  Announcement,
  FeatureFlags,
  IntakeCase,
  Organization,
  OrgUser,
  PlanTier,
  PluginKey
} from '~/core/types'
import { PLAN_PLUGIN_LIMITS } from '~/core/types'
import { useTenantStore } from '~/stores/tenant'

export const usePlatformStore = defineStore('platform', {
  state: () => ({
    organizations: [] as Organization[],
    announcements: [] as Announcement[],
    intakeCases: [] as IntakeCase[],
    orgUsers: [] as OrgUser[],
    analytics: {
      totalOrgs: 0,
      activeOrgs: 0,
      totalIntakeCases: 0,
      enabledPluginSlots: 0
    },
    loading: false,
    error: null as string | null
  }),

  actions: {
    async hydrate() {
      // no-op for API mode — data loaded on demand
    },

    async fetchOrganizations() {
      const res = await $fetch<{ organizations: Organization[] }>('/api/platform/orgs')
      this.organizations = res.organizations
      return res.organizations
    },

    async fetchAnalytics() {
      const res = await $fetch<{ analytics: {
        totalOrgs: number
        activeOrgs: number
        totalIntakeCases: number
        enabledPluginSlots: number
      } }>('/api/platform/analytics')
      this.analytics = res.analytics
      return res.analytics
    },

    getOrganizationBySlug(slug: string) {
      return this.organizations.find(o => o.slug === slug) ?? null
    },

    async createOrganization(payload: {
      name: string
      slug: string
      address?: string
      contactEmail?: string
      contactPhone?: string
      planTier?: PlanTier
    }) {
      const res = await $fetch<{ organization: Organization }>('/api/platform/orgs', {
        method: 'POST',
        body: payload
      })
      this.organizations.push(res.organization)
      return res.organization
    },

    async updateOrganization(slug: string, patch: Partial<Organization>) {
      const res = await $fetch<{ organization: Organization }>(`/api/platform/orgs/${slug}`, {
        method: 'PATCH',
        body: patch
      })
      const idx = this.organizations.findIndex(o => o.slug === slug)
      if (idx !== -1) this.organizations[idx] = res.organization
      useTenantStore().refreshOrganization()
      return res.organization
    },

    async updateFeatures(slug: string, features: FeatureFlags) {
      const res = await $fetch<{ organization: Organization }>(`/api/platform/orgs/${slug}/features`, {
        method: 'PATCH',
        body: { features }
      })
      const idx = this.organizations.findIndex(o => o.slug === slug)
      if (idx !== -1) this.organizations[idx] = res.organization
      useTenantStore().refreshOrganization()
      return res.organization
    },

    async resetDemoData() {
      await $fetch('/api/platform/reset-demo', { method: 'POST' })
      await this.fetchOrganizations()
      useTenantStore().refreshOrganization()
    },

    async fetchAnnouncements(slug: string) {
      const res = await $fetch<{ announcements: Announcement[] }>(`/api/tenants/${slug}/announcements`)
      this.announcements = res.announcements
      return res.announcements
    },

    async upsertAnnouncement(slug: string, announcement: Partial<Announcement> & { title: string, body: string }) {
      const res = await $fetch<{ announcement: Announcement }>(`/api/tenants/${slug}/announcements`, {
        method: 'POST',
        body: announcement
      })
      const idx = this.announcements.findIndex(a => a.id === res.announcement.id)
      if (idx === -1) this.announcements.unshift(res.announcement)
      else this.announcements[idx] = res.announcement
      return res.announcement
    },

    async deleteAnnouncement(slug: string, id: string) {
      await $fetch(`/api/tenants/${slug}/announcements/${id}`, { method: 'DELETE' })
      this.announcements = this.announcements.filter(a => a.id !== id)
    },

    async fetchIntakeCases(slug: string) {
      const res = await $fetch<{ cases: IntakeCase[] }>(`/api/tenants/${slug}/intake`)
      this.intakeCases = res.cases
      return res.cases
    },

    async upsertIntakeCase(slug: string, caseItem: Partial<IntakeCase> & { description: string, category: string }) {
      if (caseItem.id) {
        const res = await $fetch<{ case: IntakeCase }>(`/api/tenants/${slug}/intake/${caseItem.id}`, {
          method: 'PATCH',
          body: caseItem
        })
        const idx = this.intakeCases.findIndex(c => c.id === res.case.id)
        if (idx !== -1) this.intakeCases[idx] = res.case
        return res.case
      }
      const res = await $fetch<{ case: IntakeCase }>(`/api/tenants/${slug}/intake`, {
        method: 'POST',
        body: caseItem
      })
      this.intakeCases.unshift(res.case)
      return res.case
    },

    async fetchOrgUsers(slug: string) {
      const res = await $fetch<{ users: OrgUser[] }>(`/api/tenants/${slug}/users`)
      this.orgUsers = res.users
      return res.users
    },

    async upsertOrgUser(slug: string, user: OrgUser & { password?: string }) {
      const res = await $fetch<{ user: OrgUser }>(`/api/tenants/${slug}/users`, {
        method: 'POST',
        body: user
      })
      const idx = this.orgUsers.findIndex(u => u.id === res.user.id)
      if (idx === -1) this.orgUsers.push(res.user)
      else this.orgUsers[idx] = res.user
      return res.user
    },

    async deleteOrgUser(slug: string, userId: string) {
      await $fetch(`/api/tenants/${slug}/users/${userId}`, { method: 'DELETE' })
      this.orgUsers = this.orgUsers.filter(u => u.id !== userId)
    },

    async updateLanding(slug: string, landing: Organization['landing']) {
      const res = await $fetch<{ landing: Organization['landing'] }>(`/api/tenants/${slug}/landing`, {
        method: 'PATCH',
        body: { landing }
      })
      const tenant = useTenantStore()
      if (tenant.organization) {
        tenant.organization = {
          ...tenant.organization,
          landing: res.landing
        }
      }
      const idx = this.organizations.findIndex(o => o.slug === slug)
      const existing = idx !== -1 ? this.organizations[idx] : undefined
      if (existing) {
        this.organizations[idx] = {
          ...existing,
          landing: res.landing
        }
      }
      return res.landing
    },

    allowedPluginsForPlan(plan: PlanTier): PluginKey[] {
      return PLAN_PLUGIN_LIMITS[plan]
    },

    // Compat wrappers used by older pages during migration
    getAnnouncements(_orgId: string): Announcement[] {
      return this.announcements
    },
    getIntakeCases(_orgId: string): IntakeCase[] {
      return this.intakeCases
    },
    getOrgUsers(_orgId: string): OrgUser[] {
      return this.orgUsers
    }
  }
})
