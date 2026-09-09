export default defineNuxtPlugin(async () => {
  const tenant = useTenantStore()
  const auth = useAuthStore()

  await tenant.initialize()
  await auth.fetchMe()
  auth.validateSessionForContext()
})
