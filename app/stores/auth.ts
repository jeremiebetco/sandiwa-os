import { defineStore } from 'pinia'
import type { SessionUser, OrgRole } from '~/core/types'
import { useTenantStore } from '~/stores/tenant'
import { isStaffRole, isMemberRole } from '~/core/rbac/permissions'

interface AuthState {
  user: SessionUser | null
  isLoading: boolean
  error: string | null
  hydrated: boolean
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    isLoading: false,
    error: null,
    hydrated: false
  }),

  getters: {
    isAuthenticated: state => !!state.user,
    isPlatformAdmin: state => state.user?.role === 'platform_admin',
    isOrgStaff: state => !!state.user && state.user.context === 'organization' && isStaffRole(state.user.role as OrgRole),
    isMember: state => !!state.user && state.user.context === 'organization' && isMemberRole(state.user.role as OrgRole)
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

    async fetchMe() {
      try {
        const res = await $fetch<{ user: SessionUser | null }>('/api/auth/me')
        this.user = res.user
        this.validateSessionForContext()
      } catch {
        this.user = null
      } finally {
        this.hydrated = true
      }
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
        const res = await $fetch<{ user: SessionUser }>('/api/auth/login', {
          method: 'POST',
          body: { email, password, context: 'platform' }
        })
        this.user = res.user
        return true
      } catch (e: unknown) {
        const err = e as { data?: { statusMessage?: string }, statusMessage?: string }
        this.error = err?.data?.statusMessage || err?.statusMessage || 'Invalid email or password.'
        return false
      } finally {
        this.isLoading = false
      }
    },

    async loginOrg(email: string, password: string, allowMember = false): Promise<boolean> {
      this.isLoading = true
      this.error = null
      try {
        const tenant = useTenantStore()
        if (!tenant.isOrganization || !tenant.slug) {
          this.error = 'Organization login is only available on an HOA subdomain.'
          return false
        }
        const res = await $fetch<{ user: SessionUser }>('/api/auth/login', {
          method: 'POST',
          body: {
            email,
            password,
            context: 'organization',
            orgSlug: tenant.slug,
            allowMember
          }
        })
        this.user = res.user
        return true
      } catch (e: unknown) {
        const err = e as { data?: { statusMessage?: string }, statusMessage?: string }
        this.error = err?.data?.statusMessage || err?.statusMessage || 'Invalid email or password.'
        return false
      } finally {
        this.isLoading = false
      }
    },

    async logout() {
      try {
        await $fetch('/api/auth/logout', { method: 'POST' })
      } catch {
        // clear locally anyway
      }
      this.clearSession()
    }
  }
})
