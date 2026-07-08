<script setup lang="ts">
definePageMeta({ layout: 'impact' })

const { buildPlatformUrl } = useTenantDomain()
</script>

<template>
  <div class="py-16 text-center">
    <h1 class="text-2xl font-bold">
      Organization not found
    </h1>
    <p class="mt-2 shell-text-muted">
      This HOA subdomain is not registered on Sandiwa OS.
    </p>
    <a :href="buildPlatformUrl()" class="mt-6 inline-block text-[var(--bg-accent)] hover:underline">
      Go to platform
    </a>
  </div>
</template>
