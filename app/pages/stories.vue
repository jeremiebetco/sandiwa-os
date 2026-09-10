<script setup lang="ts">
import { LIVE_DEMO_STORIES } from '~/core/platform/marketing'

definePageMeta({ layout: 'platform' })

useSeoMeta({
  title: 'Stories - Sandiwa OS',
  description: 'Open live demo HOAs: Greenfield Village and Sunrise Condominium.'
})
</script>

<template>
  <div class="space-y-8">
    <header class="max-w-2xl">
      <h1 class="display-title text-4xl md:text-5xl">
        Live communities you can open today.
      </h1>
      <p class="mt-4 text-base text-[var(--text-secondary)]">
        These are seed demo tenants with sample data. Click through as a visitor, then try staff and member sign-in from the README.
      </p>
    </header>
    <div class="grid gap-6">
      <PlatformStoryCard
        v-for="story in LIVE_DEMO_STORIES"
        :key="story.slug"
        :story="story"
      />
    </div>
  </div>
</template>
