<script setup lang="ts">
import type { LIVE_DEMO_STORIES } from '~/core/platform/marketing'

const props = defineProps<{
  story: (typeof LIVE_DEMO_STORIES)[number]
}>()

const { buildTenantUrl } = useTenantDomain()
const href = computed(() => buildTenantUrl(props.story.slug))
</script>

<template>
  <article class="platform-story-card">
    <div class="platform-story-card__media">
      <img
        :src="story.heroUrl"
        :alt="`${story.name} grounds`"
        width="800"
        height="520"
        loading="lazy"
      >
    </div>
    <div class="platform-story-card__body">
      <div class="flex items-center gap-3">
        <img
          :src="story.logoUrl"
          alt=""
          class="h-10 w-10 rounded-md object-cover"
          width="40"
          height="40"
        >
        <div>
          <h3 class="display-title text-xl">
            {{ story.name }}
          </h3>
          <p class="text-xs text-[var(--text-muted)]">
            {{ story.kind }} · {{ story.plan }} plan · live demo
          </p>
        </div>
      </div>
      <p class="text-sm text-[var(--text-secondary)]">
        {{ story.summary }}
      </p>
      <div class="flex items-center gap-3 pt-1">
        <img
          :src="story.officer.photoUrl"
          :alt="story.officer.name"
          class="h-10 w-10 rounded-full object-cover"
          width="40"
          height="40"
        >
        <div class="text-sm">
          <p class="font-semibold">
            {{ story.officer.name }}
          </p>
          <p class="text-[var(--text-muted)]">
            {{ story.officer.role }}
          </p>
        </div>
      </div>
      <a
        :href="href"
        class="btn-brand mt-2 w-fit"
        target="_blank"
        rel="noopener noreferrer"
      >
        Open this community
      </a>
    </div>
  </article>
</template>
