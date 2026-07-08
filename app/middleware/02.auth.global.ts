import { useAuthStore } from '~/stores/auth'
import { useTenantStore } from '~/stores/tenant'

const PLATFORM_PUBLIC = ['/platform/login']
const ORG_PUBLIC = ['/', '/announcements', '/login', '/portal/requests', '/not-found']
const ORG_MEMBER_ROUTES = ['/portal/requests']

export default defineNuxtRouteMiddleware((to) => {
  if (!import.meta.client) return

  const auth = useAuthStore()
  const tenant = useTenantStore()

  auth.validateSessionForContext()

  if (tenant.isPlatform) {
    const isPublic = PLATFORM_PUBLIC.includes(to.path) || to.path === '/'
    if (!isPublic && !auth.isPlatformAdmin) {
      return navigateTo('/platform/login')
    }
    if (to.path === '/' && !auth.isPlatformAdmin) {
      return navigateTo('/platform/login')
    }
    if (to.path === '/' && auth.isPlatformAdmin) {
      return navigateTo('/platform/orgs')
    }
    return
  }

  if (tenant.isOrganization) {
    const isPublic = ORG_PUBLIC.some(p => to.path === p || to.path.startsWith(p + '/'))
    const isConsole = to.path.startsWith('/console')

    if (isConsole && !auth.isOrgStaff) {
      return navigateTo('/login')
    }

    if (!isPublic && !isConsole && !auth.isAuthenticated) {
      return navigateTo('/login')
    }

    if (to.path === '/login' && auth.isOrgStaff) {
      return navigateTo('/console')
    }

    if (ORG_MEMBER_ROUTES.some(r => to.path.startsWith(r)) && auth.isOrgStaff && !to.path.startsWith('/console')) {
      // staff can still view portal but console is primary
    }
  }
})
