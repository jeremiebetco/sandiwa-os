<script setup lang="ts">
definePageMeta({ layout: 'platform' })

const platform = usePlatformStore()
const loading = ref(true)
const error = ref('')
const stats = computed(() => platform.analytics)

onMounted(async () => {
  loading.value = true
  error.value = ''
  try {
    await platform.fetchAnalytics()
  } catch {
    error.value = 'Failed to load analytics.'
  } finally {
    loading.value = false
  }
})

const cards = computed(() => [
  {
    label: 'Total HOAs',
    value: stats.value.totalOrgs,
    hint: 'Tenants registered on this platform host.'
  },
  {
    label: 'Active HOAs',
    value: stats.value.activeOrgs,
    hint: 'Organizations currently marked active.'
  },
  {
    label: 'Intake cases',
    value: stats.value.totalIntakeCases,
    hint: 'Member requests across all tenants.'
  },
  {
    label: 'Enabled modules',
    value: stats.value.enabledPluginSlots,
    hint: 'Sum of feature flags turned on across orgs.'
  }
])
</script>

<template>
  <div>
    <h1 class="display-title text-3xl">
      Analytics
    </h1>
    <p class="mt-1 text-sm text-[var(--text-muted)]">
      Aggregated metrics across HOA tenants.
    </p>

    <p v-if="error" class="mt-4 text-sm text-[var(--color-danger)]" role="alert">
      {{ error }}
    </p>

    <div v-if="loading" class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-busy="true">
      <div v-for="n in 4" :key="n" class="platform-skeleton min-h-32" />
    </div>

    <div v-else class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div
        v-for="card in cards"
        :key="card.label"
        class="platform-metric"
      >
        <p class="text-sm text-[var(--text-muted)]">
          {{ card.label }}
        </p>
        <p class="display-title mt-2 text-4xl">
          {{ card.value }}
        </p>
        <p class="mt-3 text-xs text-[var(--text-muted)]">
          {{ card.hint }}
        </p>
      </div>
    </div>
  </div>
</template>
