export default defineNuxtPlugin(() => {
  const tenant = useTenantStore()
  const platform = usePlatformStore()
  const auth = useAuthStore()

  tenant.initialize()
  platform.hydrate()
  auth.validateSessionForContext()
})
