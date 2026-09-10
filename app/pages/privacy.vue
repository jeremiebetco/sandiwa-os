<script setup lang="ts">
definePageMeta({ layout: 'platform' })

useSeoMeta({
  title: 'Privacy - Sandiwa OS',
  description: 'Privacy notes for the Sandiwa OS public demo.'
})
</script>

<template>
  <article class="prose-platform max-w-3xl space-y-6">
    <h1 class="display-title text-4xl">
      Privacy
    </h1>
    <p class="text-[var(--text-secondary)]">
      This deployment is a public pilot and portfolio demo. Sample organizations and accounts are shared. Do not enter real homeowner, payment, or board data.
    </p>
    <h2 class="display-title text-2xl">
      What we collect on this demo
    </h2>
    <p class="text-sm text-[var(--text-secondary)]">
      Session cookies are used for sign-in. Demo accounts are intentional and documented. Marketing contact forms on this site validate in the browser and do not store submissions.
    </p>
    <h2 class="display-title text-2xl">
      Private deployments
    </h2>
    <p class="text-sm text-[var(--text-secondary)]">
      A private Sandiwa deployment should use strong secrets, change demo passwords, and keep production data off shared demo environments. See SECURITY.md in the repository for the control checklist.
    </p>
    <NuxtLink to="/" class="btn-quiet inline-flex">
      Back to home
    </NuxtLink>
  </article>
</template>
