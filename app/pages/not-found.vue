<script setup lang="ts">
definePageMeta({ layout: 'impact' })

const { buildPlatformUrl } = useTenantDomain()
</script>

<template>
  <div class="py-16 text-center">
    <h1 class="display-title text-3xl">
      Organization not found
    </h1>
    <p class="mt-3 text-[var(--text-muted)]">
      This HOA subdomain is not registered on Sandiwa.
    </p>
    <a :href="buildPlatformUrl()" class="btn-brand mt-8 inline-flex">
      Go to platform
    </a>
  </div>
</template>
