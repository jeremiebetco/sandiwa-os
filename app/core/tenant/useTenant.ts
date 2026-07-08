import { useTenantStore } from '~/stores/tenant'

export function useTenant() {
  const store = useTenantStore()

  return {
    context: computed(() => store.context),
    slug: computed(() => store.slug),
    organization: computed(() => store.organization),
    organizationId: computed(() => store.organizationId),
    isPlatform: computed(() => store.isPlatform),
    isOrganization: computed(() => store.isOrganization),
    unknownOrg: computed(() => store.unknownOrg),
    initialized: computed(() => store.initialized),
    refresh: () => store.refreshOrganization()
  }
}
