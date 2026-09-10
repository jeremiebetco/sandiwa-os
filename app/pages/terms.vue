<script setup lang="ts">
definePageMeta({ layout: 'platform' })

useSeoMeta({
  title: 'Terms - Sandiwa OS',
  description: 'Terms for using the Sandiwa OS public demo.'
})
</script>

<template>
  <article class="max-w-3xl space-y-6">
    <h1 class="display-title text-4xl">
      Terms
    </h1>
    <p class="text-[var(--text-secondary)]">
      Sandiwa OS on this host is provided as a public demonstration. Features, pricing labels, and seed data may change or reset without notice.
    </p>
    <h2 class="display-title text-2xl">
      Demo data
    </h2>
    <p class="text-sm text-[var(--text-secondary)]">
      Demo passwords and sample tenants are shared. Do not treat this environment as a production system of record for any HOA.
    </p>
    <h2 class="display-title text-2xl">
      Pricing labels
    </h2>
    <p class="text-sm text-[var(--text-secondary)]">
      Plan prices shown on the marketing site are demo list prices for comparison. Billing is not live.
    </p>
    <h2 class="display-title text-2xl">
      Acceptable use
    </h2>
    <p class="text-sm text-[var(--text-secondary)]">
      Do not upload sensitive personal information. Do not attempt to disrupt shared demo tenants beyond normal product exploration.
    </p>
    <NuxtLink to="/" class="btn-quiet inline-flex">
      Back to home
    </NuxtLink>
  </article>
</template>
