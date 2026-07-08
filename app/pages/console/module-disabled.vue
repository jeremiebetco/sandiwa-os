<script setup lang="ts">
definePageMeta({ layout: 'console' })

const { to: tenantPath } = useTenantPath()
</script>

<template>
  <div class="shell-surface p-8 text-center">
    <UIcon name="i-lucide-puzzle" class="mx-auto size-12 shell-text-muted" />
    <h2 class="mt-4 text-xl font-semibold">
      Module disabled
    </h2>
    <p class="mt-2 shell-text-muted">
      This feature is not enabled for your HOA. Contact the platform administrator.
    </p>
    <UButton class="mt-6" :to="tenantPath('/console')">
      Back to dashboard
    </UButton>
  </div>
</template>
