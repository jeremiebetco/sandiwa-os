<script setup lang="ts">
definePageMeta({ layout: 'platform' })

useSeoMeta({
  title: 'Pricing - Sandiwa OS',
  description: 'Demo list prices for Basic, Standard, and Premium HOA plans mapped to real module caps.'
})
</script>

<template>
  <div class="space-y-8">
    <header class="max-w-2xl">
      <h1 class="display-title text-4xl md:text-5xl">
        Plans that match the Features screen.
      </h1>
      <p class="mt-4 text-base text-[var(--text-secondary)]">
        Basic, Standard, and Premium use the same plugin limits the platform admin console enforces. Prices below are demo list prices only.
      </p>
    </header>
    <PlatformPricingTable />
    <div class="shell-surface p-6">
      <h2 class="display-title text-xl">
        Prefer a guided walkthrough?
      </h2>
      <p class="mt-2 text-sm text-[var(--text-secondary)]">
        Open a live HOA demo now, or leave a walkthrough request. This public site does not bill anyone.
      </p>
      <div class="mt-4 flex flex-wrap gap-3">
        <NuxtLink to="/stories" class="btn-brand">
          See live stories
        </NuxtLink>
        <NuxtLink to="/contact" class="btn-quiet">
          Request a walkthrough
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
