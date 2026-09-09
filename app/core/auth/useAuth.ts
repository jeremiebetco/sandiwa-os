import { useAuthStore } from '~/stores/auth'

export function useAuth() {
  const store = useAuthStore()

  return {
    user: computed(() => store.user),
    isAuthenticated: computed(() => store.isAuthenticated),
    isLoading: computed(() => store.isLoading),
    error: computed(() => store.error),
    hydrated: computed(() => store.hydrated),
    isPlatformAdmin: computed(() => store.isPlatformAdmin),
    isOrgStaff: computed(() => store.isOrgStaff),
    isMember: computed(() => store.isMember),
    loginPlatform: store.loginPlatform,
    loginOrg: store.loginOrg,
    logout: store.logout,
    fetchMe: store.fetchMe,
    validateSessionForContext: store.validateSessionForContext
  }
}
