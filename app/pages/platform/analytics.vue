<script setup lang="ts">
definePageMeta({ layout: 'platform' })

const platform = usePlatformStore()
onMounted(() => platform.hydrate())
const stats = computed(() => platform.analytics)
</script>

<template>
  <div>
    <h2 class="text-2xl font-semibold">
      Cross-organization analytics
    </h2>
    <p class="text-sm shell-text-muted">
      Aggregated, anonymized metrics across HOA tenants.
    </p>
    <div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div class="shell-surface p-6">
        <p class="text-sm shell-text-muted">
          Total HOAs
        </p>
        <p class="text-3xl font-bold">
          {{ stats.totalOrgs }}
        </p>
      </div>
      <div class="shell-surface p-6">
        <p class="text-sm shell-text-muted">
          Active HOAs
        </p>
        <p class="text-3xl font-bold">
          {{ stats.activeOrgs }}
        </p>
      </div>
      <div class="shell-surface p-6">
        <p class="text-sm shell-text-muted">
          Intake cases (all tenants)
        </p>
        <p class="text-3xl font-bold">
          {{ stats.totalIntakeCases }}
        </p>
      </div>
      <div class="shell-surface p-6">
        <p class="text-sm shell-text-muted">
          Enabled plugin slots
        </p>
        <p class="text-3xl font-bold">
          {{ stats.enabledPluginSlots }}
        </p>
      </div>
    </div>
  </div>
</template>
