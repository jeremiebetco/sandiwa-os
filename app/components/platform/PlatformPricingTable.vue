<script setup lang="ts">
import { DEMO_PLANS, PLUGIN_MARKETING } from '~/core/platform/marketing'

defineProps<{
  compact?: boolean
}>()
</script>

<template>
  <div class="grid gap-4 lg:grid-cols-3">
    <article
      v-for="plan in DEMO_PLANS"
      :key="plan.id"
      class="platform-price-card"
      :class="{ 'platform-price-card--featured': plan.highlighted }"
    >
      <div>
        <div class="flex items-center justify-between gap-2">
          <h3 class="display-title text-xl">
            {{ plan.name }}
          </h3>
          <span v-if="plan.highlighted" class="platform-badge">
            Most chosen
          </span>
        </div>
        <p class="mt-4 flex items-baseline gap-1">
          <span class="display-title text-3xl">{{ plan.priceLabel }}</span>
          <span class="text-sm text-[var(--text-muted)]">{{ plan.cadence }}</span>
        </p>
        <p class="mt-3 text-sm text-[var(--text-secondary)]">
          {{ plan.summary }}
        </p>
      </div>

      <ul class="space-y-2 text-sm text-[var(--text-secondary)]">
        <li
          v-for="plugin in plan.plugins"
          :key="plugin"
          class="flex items-start gap-2"
        >
          <UIcon name="i-lucide-check" class="mt-0.5 size-4 shrink-0 text-[var(--color-success)]" />
          <span>{{ PLUGIN_MARKETING[plugin].title }}</span>
        </li>
      </ul>

      <div class="mt-auto pt-2">
        <NuxtLink
          :to="compact ? '/pricing' : '/contact'"
          class="w-full"
          :class="plan.highlighted || compact ? 'btn-brand' : 'btn-quiet'"
        >
          {{ compact ? 'Compare plans' : 'Request a walkthrough' }}
        </NuxtLink>
      </div>
    </article>
  </div>
  <p class="mt-4 text-xs text-[var(--text-muted)]">
    Demo list prices for comparison only. Billing is not live on this public demo.
  </p>
</template>
