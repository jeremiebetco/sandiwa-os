<script setup lang="ts">
import type { FeatureFlags, PlanTier, PluginKey } from '~/core/types'
import { PLUGIN_KEYS } from '~/core/types'
import { PLUGIN_MARKETING } from '~/core/platform/marketing'

const props = defineProps<{
  planTier: PlanTier
  modelValue: FeatureFlags
  allowedPlugins: PluginKey[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: FeatureFlags]
}>()

function isAllowed(plugin: PluginKey) {
  return props.allowedPlugins.includes(plugin)
}

function toggle(plugin: PluginKey, checked: boolean) {
  if (!isAllowed(plugin)) return
  emit('update:modelValue', {
    ...props.modelValue,
    [plugin]: checked
  })
}
</script>

<template>
  <div class="platform-feature-matrix" role="list">
    <div
      v-for="plugin in PLUGIN_KEYS"
      :key="plugin"
      class="platform-feature-row"
      :class="{ 'platform-feature-row--locked': !isAllowed(plugin) }"
      role="listitem"
    >
      <div class="min-w-0">
        <div class="flex flex-wrap items-center gap-2">
          <UIcon :name="PLUGIN_MARKETING[plugin].icon" class="size-4 text-[var(--bg-accent)]" />
          <p class="font-semibold">
            {{ PLUGIN_MARKETING[plugin].title }}
          </p>
          <span v-if="!isAllowed(plugin)" class="platform-badge platform-badge--muted">
            Not in {{ planTier }}
          </span>
        </div>
        <p class="mt-1 text-sm text-[var(--text-muted)]">
          {{ PLUGIN_MARKETING[plugin].blurb }}
        </p>
      </div>
      <label class="inline-flex items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          class="size-5 accent-[var(--bg-accent)]"
          :checked="modelValue[plugin]"
          :disabled="!isAllowed(plugin)"
          :aria-label="`Enable ${PLUGIN_MARKETING[plugin].title}`"
          @change="toggle(plugin, ($event.target as HTMLInputElement).checked)"
        >
        <span class="hidden sm:inline">{{ modelValue[plugin] ? 'On' : 'Off' }}</span>
      </label>
    </div>
  </div>
</template>
