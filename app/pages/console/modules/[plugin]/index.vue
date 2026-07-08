<script setup lang="ts">
const { t } = useTerminology()
const route = useRoute()
const { to: tenantPath } = useTenantPath()
const plugin = computed(() => route.params.plugin as string)

definePageMeta({ layout: 'console' })
</script>

<template>
  <div class="shell-surface p-8 text-center">
    <h2 class="text-xl font-semibold">
      {{ t(`modules.${plugin}.label`, plugin) }}
    </h2>
    <p class="mt-2 shell-text-muted">
      Module stub — full implementation deferred. Feature gating and routing are active.
    </p>
    <UButton class="mt-6" :to="tenantPath('/console')">
      Back to dashboard
    </UButton>
  </div>
</template>
