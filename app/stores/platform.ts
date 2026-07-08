import { defineStore } from 'pinia'
import type { Announcement, AppDatabase, IntakeCase, Organization, OrgUser, PlanTier, PluginKey } from '~/core/types'
import { PLAN_PLUGIN_LIMITS, PLUGIN_KEYS } from '~/core/types'
import { createSeedDatabase } from '~/core/seed/data'
import { loadDatabase, requestSeedReset, saveDatabase } from '~/core/seed/service'
import { useTenantStore } from '~/stores/tenant'

export const usePlatformStore = defineStore('platform', {
  state: () => ({
    db: null as AppDatabase | null
  }),

  getters: {
    organizations(state): Organization[] {
      return state.db?.organizations ?? []
    },

    analytics(state) {
      const orgs = state.db?.organizations ?? []
      const active = orgs.filter(o => o.status === 'active')
      const intakeCount = state.db?.intakeCases.length ?? 0
      const enabledPlugins = active.reduce((sum, org) => {
        return sum + PLUGIN_KEYS.filter(k => org.features[k]).length
      }, 0)
      return {
        totalOrgs: orgs.length,
        activeOrgs: active.length,
        totalIntakeCases: intakeCount,
        enabledPluginSlots: enabledPlugins
      }
    }
  },

  actions: {
    hydrate() {
      this.db = loadDatabase()
    },

    persist() {
      if (this.db) saveDatabase(this.db)
    },

    resetDemoData() {
      requestSeedReset()
      this.db = createSeedDatabase()
      saveDatabase(this.db)
      useTenantStore().refreshOrganization()
    },

    getOrganizationBySlug(slug: string) {
      return this.db?.organizations.find(o => o.slug === slug) ?? null
    },

    createOrganization(payload: Omit<Organization, 'id'>) {
      if (!this.db) this.hydrate()
      const id = `org-${crypto.randomUUID().slice(0, 8)}`
      const org: Organization = { ...payload, id }
      this.db!.organizations.push(org)
      this.persist()
      return org
    },

    updateOrganization(id: string, patch: Partial<Organization>) {
      if (!this.db) this.hydrate()
      const idx = this.db!.organizations.findIndex(o => o.id === id)
      if (idx === -1) return null
      const current = this.db!.organizations[idx]!
      this.db!.organizations[idx] = { ...current, ...patch }
      this.persist()
      useTenantStore().refreshOrganization()
      return this.db!.organizations[idx]
    },

    updateFeatures(orgId: string, features: Organization['features']) {
      return this.updateOrganization(orgId, { features })
    },

    getOrgUsers(orgId: string): OrgUser[] {
      return this.db?.orgUsers.filter(u => u.organizationId === orgId) ?? []
    },

    upsertOrgUser(user: OrgUser) {
      if (!this.db) this.hydrate()
      const idx = this.db!.orgUsers.findIndex(u => u.id === user.id)
      if (idx === -1) {
        this.db!.orgUsers.push(user)
      } else {
        this.db!.orgUsers[idx] = user
      }
      this.persist()
    },

    deleteOrgUser(userId: string) {
      if (!this.db) this.hydrate()
      this.db!.orgUsers = this.db!.orgUsers.filter(u => u.id !== userId)
      this.persist()
    },

    getAnnouncements(orgId: string): Announcement[] {
      return (this.db?.announcements.filter(a => a.organizationId === orgId) ?? [])
        .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    },

    upsertAnnouncement(announcement: Announcement) {
      if (!this.db) this.hydrate()
      const idx = this.db!.announcements.findIndex(a => a.id === announcement.id)
      if (idx === -1) {
        this.db!.announcements.push(announcement)
      } else {
        this.db!.announcements[idx] = announcement
      }
      this.persist()
    },

    deleteAnnouncement(id: string) {
      if (!this.db) this.hydrate()
      this.db!.announcements = this.db!.announcements.filter(a => a.id !== id)
      this.persist()
    },

    getIntakeCases(orgId: string): IntakeCase[] {
      return (this.db?.intakeCases.filter(c => c.organizationId === orgId) ?? [])
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    },

    upsertIntakeCase(caseItem: IntakeCase) {
      if (!this.db) this.hydrate()
      const idx = this.db!.intakeCases.findIndex(c => c.id === caseItem.id)
      if (idx === -1) {
        this.db!.intakeCases.push(caseItem)
      } else {
        this.db!.intakeCases[idx] = caseItem
      }
      this.persist()
    },

    allowedPluginsForPlan(plan: PlanTier): PluginKey[] {
      return PLAN_PLUGIN_LIMITS[plan]
    }
  }
})
