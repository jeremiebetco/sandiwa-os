<script setup lang="ts">
const props = defineProps<{
  text: string
  locale?: string
}>()

const { t } = useI18n()
const { speaking, supported, toggle } = useSpeech()
const locale = computed(() => props.locale || useI18n().locale.value)
</script>

<template>
  <button
    v-if="supported"
    type="button"
    class="interactive-states inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium"
    style="border-color: var(--border-default); color: var(--text-secondary); background: var(--bg-surface)"
    :aria-pressed="speaking"
    @click="toggle(text, locale)"
  >
    <UIcon :name="speaking ? 'i-lucide-square' : 'i-lucide-volume-2'" class="size-4" />
    {{ speaking ? t('portal.stop') : t('portal.listen') }}
  </button>
</template>
