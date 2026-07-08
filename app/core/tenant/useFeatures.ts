import type { PluginKey } from '~/core/types'
import { useTenantStore } from '~/stores/tenant'

export function useFeatures() {
  const tenant = useTenantStore()

  function isEnabled(plugin: PluginKey): boolean {
    return tenant.organization?.features[plugin] ?? false
  }

  const enabledPlugins = computed(() => {
    if (!tenant.organization) return [] as PluginKey[]
    return (Object.entries(tenant.organization.features) as [PluginKey, boolean][])
      .filter(([, on]) => on)
      .map(([key]) => key)
  })

  return { isEnabled, enabledPlugins }
}
