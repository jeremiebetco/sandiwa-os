<script setup lang="ts">
import type { FeatureFlags } from '~/core/types'
import { PLUGIN_KEYS } from '~/core/types'

definePageMeta({ layout: 'platform' })

const platform = usePlatformStore()
const route = useRoute()
const slug = computed(() => route.params.slug as string)
const org = computed(() => platform.getOrganizationBySlug(slug.value))

const loading = ref(true)
const saving = ref(false)
const error = ref('')
const localFeatures = ref<FeatureFlags | null>(null)

onMounted(async () => {
  loading.value = true
  error.value = ''
  try {
    if (!org.value) {
      await platform.fetchOrganizations()
    }
    if (org.value) {
      localFeatures.value = { ...org.value.features }
    }
  } catch {
    error.value = 'Failed to load organization.'
  } finally {
    loading.value = false
  }
})

watch(org, (value) => {
  if (value && !localFeatures.value) {
    localFeatures.value = { ...value.features }
  }
})

async function save() {
  if (!org.value || !localFeatures.value) return
  saving.value = true
  error.value = ''
  try {
    await platform.updateFeatures(slug.value, localFeatures.value)
    await navigateTo('/platform/orgs')
  } catch (e: unknown) {
    const err = e as { data?: { statusMessage?: string }, statusMessage?: string }
    error.value = err?.data?.statusMessage || err?.statusMessage || 'Failed to save features.'
  } finally {
    saving.value = false
  }
}

function isAllowed(plugin: typeof PLUGIN_KEYS[number]) {
  if (!org.value) return false
  return platform.allowedPluginsForPlan(org.value.planTier).includes(plugin)
}
</script>

<template>
  <div v-if="loading" class="shell-surface max-w-lg p-6 shell-text-muted">
    Loading features…
  </div>
  <div v-else-if="org && localFeatures" class="shell-surface max-w-lg p-6">
    <h2 class="text-xl font-semibold">
      Feature toggles — {{ org.name }}
    </h2>
    <p class="mt-1 text-sm shell-text-muted">
      Plan: {{ org.planTier }}. Plugins not in plan are disabled.
    </p>
    <ul class="mt-6 space-y-3">
      <li v-for="plugin in PLUGIN_KEYS" :key="plugin" class="flex items-center justify-between gap-4">
        <span class="capitalize">{{ plugin.replace('_', ' ') }}</span>
        <input
          v-model="localFeatures[plugin]"
          type="checkbox"
          :disabled="!isAllowed(plugin)"
          class="size-5"
        >
      </li>
    </ul>
    <p v-if="error" class="mt-4 text-sm text-[var(--color-danger)]" role="alert">
      {{ error }}
    </p>
    <div class="mt-6 flex gap-2">
      <UButton :loading="saving" @click="save">
        Save toggles
      </UButton>
      <UButton variant="ghost" to="/platform/orgs">
        Back
      </UButton>
    </div>
  </div>
  <div v-else class="shell-text-muted">
    {{ error || 'Organization not found.' }}
  </div>
</template>
