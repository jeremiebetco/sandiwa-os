<script setup lang="ts">
const { t } = useTerminology()
const route = useRoute()
const { to: tenantPath } = useTenantPath()

const plugin = computed(() => route.params.plugin as string)

const KNOWN_PLUGINS = ['payments', 'ledger', 'polls', 'broadcasts', 'intake'] as const

definePageMeta({ layout: 'console' })

onMounted(() => {
  if ((KNOWN_PLUGINS as readonly string[]).includes(plugin.value)) {
    navigateTo(tenantPath(`/console/modules/${plugin.value}`), { replace: true })
  }
})
</script>

<template>
  <div class="shell-surface p-8 text-center">
    <h2 class="text-xl font-semibold">
      {{ t(`modules.${plugin}.label`, plugin) }}
    </h2>
    <p class="mt-2 shell-text-muted">
      This module is not available yet. Feature gating and routing are active.
    </p>
    <UButton class="mt-6" :to="tenantPath('/console')">
      Back to dashboard
    </UButton>
  </div>
</template>
