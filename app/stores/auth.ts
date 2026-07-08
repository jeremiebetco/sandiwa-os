import { defineStore } from 'pinia'
import type { SessionUser } from '~/core/types'
import { loadDatabase } from '~/core/seed/service'
import { useTenantStore } from '~/stores/tenant'
import { isStaffRole } from '~/core/rbac/permissions'

interface AuthState {
  user: SessionUser | null
  isLoading: boolean
  error: string | null
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    isLoading: false,
    error: null
  }),

  getters: {
    isAuthenticated: state => !!state.user,
    isPlatformAdmin: state => state.user?.role === 'platform_admin',
    isOrgStaff: state => !!state.user && state.user.context === 'organization' && isStaffRole(state.user.role as never)
  },

  actions: {
    clearSession() {
      this.user = null
      this.error = null
      this.isLoading = false
    },

    validateSessionForContext(): boolean {
      if (!this.user) return true

      const tenant = useTenantStore()

      if (tenant.isPlatform && this.user.context !== 'platform') {
        this.clearSession()
        return false
      }

      if (tenant.isOrganization) {
        if (this.user.context !== 'organization') {
          this.clearSession()
          return false
        }
        if (this.user.organizationSlug !== tenant.slug) {
          this.clearSession()
          return false
        }
      }

      return true
    },

    async loginPlatform(email: string, password: string): Promise<boolean> {
      this.isLoading = true
      this.error = null

      try {
        const tenant = useTenantStore()
        if (!tenant.isPlatform) {
          this.error = 'Platform login is only available on the main domain.'
          return false
        }

        const db = loadDatabase()
        const admin = db.platformAdmins.find(
          a => a.email.toLowerCase() === email.toLowerCase() && a.status === 'active'
        )

        if (!admin || admin.password !== password) {
          this.error = 'Invalid email or password.'
          return false
        }

        this.user = {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
          context: 'platform'
        }
        return true
      } finally {
        this.isLoading = false
      }
    },

    async loginOrg(email: string, password: string): Promise<boolean> {
      this.isLoading = true
      this.error = null

      try {
        const tenant = useTenantStore()
        if (!tenant.isOrganization || !tenant.organization) {
          this.error = 'Organization login is only available on an HOA subdomain.'
          return false
        }

        const db = loadDatabase()
        const orgUser = db.orgUsers.find(
          u =>
            u.organizationId === tenant.organization!.id
            && u.email.toLowerCase() === email.toLowerCase()
            && u.status === 'active'
            && isStaffRole(u.role)
        )

        if (!orgUser || orgUser.password !== password) {
          this.error = 'Invalid email or password.'
          return false
        }

        this.user = {
          id: orgUser.id,
          email: orgUser.email,
          name: orgUser.name,
          role: orgUser.role,
          context: 'organization',
          organizationId: orgUser.organizationId,
          organizationSlug: tenant.slug!
        }
        return true
      } finally {
        this.isLoading = false
      }
    },

    logout() {
      this.clearSession()
    }
  },

  persist: {
    key: 'sandiwa-os-auth',
    pick: ['user']
  }
})
