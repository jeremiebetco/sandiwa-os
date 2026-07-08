import { useAuthStore } from '~/stores/auth'

export function useAuth() {
  const store = useAuthStore()

  return {
    user: computed(() => store.user),
    isAuthenticated: computed(() => store.isAuthenticated),
    isLoading: computed(() => store.isLoading),
    error: computed(() => store.error),
    isPlatformAdmin: computed(() => store.isPlatformAdmin),
    isOrgStaff: computed(() => store.isOrgStaff),
    loginPlatform: store.loginPlatform,
    loginOrg: store.loginOrg,
    logout: store.logout,
    validateSessionForContext: store.validateSessionForContext
  }
}
