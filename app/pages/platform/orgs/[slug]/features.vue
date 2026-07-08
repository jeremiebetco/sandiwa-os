<script setup lang="ts">
import type { FeatureFlags } from '~/core/types'
import { PLUGIN_KEYS } from '~/core/types'

definePageMeta({ layout: 'platform' })

const platform = usePlatformStore()
const route = useRoute()
const slug = computed(() => route.params.slug as string)
const org = computed(() => platform.getOrganizationBySlug(slug.value))

const localFeatures = ref<FeatureFlags | null>(null)

watch(org, (value) => {
  if (value) localFeatures.value = { ...value.features }
}, { immediate: true })

function save() {
  if (org.value && localFeatures.value) {
    platform.updateFeatures(org.value.id, localFeatures.value)
    navigateTo('/platform/orgs')
  }
}

function isAllowed(plugin: typeof PLUGIN_KEYS[number]) {
  if (!org.value) return false
  return platform.allowedPluginsForPlan(org.value.planTier).includes(plugin)
}
</script>

<template>
  <div v-if="org && localFeatures" class="shell-surface max-w-lg p-6">
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
    <div class="mt-6 flex gap-2">
      <UButton @click="save">
        Save toggles
      </UButton>
      <UButton variant="ghost" to="/platform/orgs">
        Back
      </UButton>
    </div>
  </div>
</template>
