import { useAuthStore } from '~/stores/auth'
import { useTenantStore } from '~/stores/tenant'
import { stripTenantPathPrefix, tenantPath } from '~/core/tenant/domain'

const PLATFORM_PUBLIC = ['/platform/login']
const ORG_PUBLIC = ['/', '/announcements', '/login', '/portal', '/not-found', '/alerts']

export default defineNuxtRouteMiddleware((to) => {
  if (!import.meta.client) return

  const auth = useAuthStore()
  const tenant = useTenantStore()

  auth.validateSessionForContext()

  const { innerPath } = stripTenantPathPrefix(to.path)
  const orgPath = tenant.isOrganization ? innerPath : to.path

  function orgTo(path: string) {
    return tenantPath(path, tenant.slug, tenant.routingMode)
  }

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
    const isPublic = ORG_PUBLIC.some(p => orgPath === p || orgPath.startsWith(`${p}/`))
    const isConsole = orgPath.startsWith('/console')
    const isMemberArea = orgPath.startsWith('/portal') || orgPath.startsWith('/alerts')

    if (isConsole && !auth.isOrgStaff) {
      return navigateTo(orgTo('/login'))
    }

    if (isMemberArea && !auth.isAuthenticated) {
      return navigateTo(orgTo('/login?member=1'))
    }

    if (!isPublic && !isConsole && !auth.isAuthenticated) {
      return navigateTo(orgTo('/login'))
    }

    if (orgPath === '/login' && auth.isOrgStaff) {
      return navigateTo(orgTo('/console'))
    }

    if (orgPath === '/login' && auth.isMember) {
      return navigateTo(orgTo('/portal'))
    }
  }
})
