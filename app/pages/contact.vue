<script setup lang="ts">
definePageMeta({ layout: 'platform' })

useSeoMeta({
  title: 'Contact - Sandiwa OS',
  description: 'Request a Sandiwa OS walkthrough. Demo form only; nothing is stored on this public site.'
})
</script>

<template>
  <div class="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
    <header>
      <h1 class="display-title text-4xl md:text-5xl">
        Request a walkthrough.
      </h1>
      <p class="mt-4 max-w-[40ch] text-base text-[var(--text-secondary)]">
        Tell us which HOA workflows matter most. This form stays on your browser. It does not email or store personal data on the public demo.
      </p>
      <ul class="mt-6 space-y-2 text-sm text-[var(--text-secondary)]">
        <li>Dues and clearances</li>
        <li>Member requests and alerts</li>
        <li>Board roles and module plans</li>
      </ul>
    </header>
    <PlatformContactForm />
  </div>
</template>
