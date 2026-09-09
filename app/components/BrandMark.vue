<script setup lang="ts">
defineProps<{
  name: string
  src?: string
  size?: 'sm' | 'md'
}>()
</script>

<template>
  <span
    class="inline-flex shrink-0 items-center justify-center overflow-hidden bg-[var(--brand-accent-muted)] text-[var(--bg-accent)]"
    :class="size === 'sm' ? 'h-8 w-8 rounded-md' : 'h-10 w-10 rounded-lg'"
  >
    <img
      v-if="src"
      :src="src"
      :alt="name"
      class="h-full w-full object-cover"
    >
    <span
      v-else
      class="text-sm font-semibold"
      aria-hidden="true"
    >
      {{ name.slice(0, 1) }}
    </span>
  </span>
</template>
