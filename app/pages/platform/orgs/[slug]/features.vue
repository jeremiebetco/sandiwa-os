<script setup lang="ts">
import type { FeatureFlags } from '~/core/types'

definePageMeta({ layout: 'platform' })

const platform = usePlatformStore()
const route = useRoute()
const slug = computed(() => route.params.slug as string)
const org = computed(() => platform.getOrganizationBySlug(slug.value))

const loading = ref(true)
const saving = ref(false)
const error = ref('')
const localFeatures = ref<FeatureFlags | null>(null)

const allowedPlugins = computed(() => {
  if (!org.value) return []
  return platform.allowedPluginsForPlan(org.value.planTier)
})

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
</script>

<template>
  <div>
    <div class="mb-6">
      <NuxtLink to="/platform/orgs" class="text-sm font-medium text-[var(--bg-accent)] hover:underline">
        Back to organizations
      </NuxtLink>
      <h1 class="display-title mt-3 text-3xl">
        Feature matrix
      </h1>
      <p v-if="org" class="mt-1 text-sm text-[var(--text-muted)]">
        {{ org.name }} · {{ org.planTier }} plan. Plugins outside the plan stay locked.
      </p>
    </div>

    <div v-if="loading" class="grid gap-3" aria-busy="true">
      <div class="platform-skeleton" />
      <div class="platform-skeleton" />
      <div class="platform-skeleton" />
    </div>

    <div v-else-if="org && localFeatures" class="space-y-6">
      <PlatformFeatureMatrix
        v-model="localFeatures"
        :plan-tier="org.planTier"
        :allowed-plugins="allowedPlugins"
      />
      <p v-if="error" class="text-sm text-[var(--color-danger)]" role="alert">
        {{ error }}
      </p>
      <div class="flex flex-wrap gap-2">
        <button type="button" class="btn-brand" :disabled="saving" @click="save">
          {{ saving ? 'Saving…' : 'Save toggles' }}
        </button>
        <NuxtLink :to="`/platform/orgs/${slug}`" class="btn-quiet">
          Edit org
        </NuxtLink>
        <NuxtLink to="/platform/orgs" class="btn-quiet">
          Cancel
        </NuxtLink>
      </div>
    </div>

    <div v-else class="shell-surface p-8 text-[var(--text-muted)]">
      {{ error || 'Organization not found.' }}
    </div>
  </div>
</template>
