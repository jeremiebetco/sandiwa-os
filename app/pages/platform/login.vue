<script setup lang="ts">
definePageMeta({ layout: 'platform' })

useSeoMeta({
  title: 'Platform sign in - Sandiwa OS',
  description: 'Sign in to manage HOA tenants on the Sandiwa platform.'
})

const { loginPlatform, isLoading, error } = useAuth()
const email = ref('admin@sandiwa.local')
const password = ref('')

async function onSubmit() {
  const ok = await loginPlatform(email.value, password.value)
  if (ok) await navigateTo('/platform/orgs')
}
</script>

<template>
  <div class="mx-auto grid w-full max-w-md gap-8 lg:max-w-5xl lg:grid-cols-2 lg:items-center lg:gap-12">
    <div class="hidden min-w-0 lg:block">
      <p class="text-sm font-semibold text-[var(--bg-accent)]">
        Platform admin
      </p>
      <h1 class="display-title mt-3 text-4xl">
        Register communities. Toggle modules. Watch adoption.
      </h1>
      <p class="mt-4 max-w-[38ch] text-sm text-[var(--text-secondary)]">
        Sign in on the main domain to manage HOA tenants, plans, and feature flags across the Sandiwa platform.
      </p>
      <ul class="mt-6 space-y-2 text-sm text-[var(--text-secondary)]">
        <li>Organization directory and host links</li>
        <li>Plan-aware feature matrix</li>
        <li>Light analytics across tenants</li>
      </ul>
    </div>

    <div class="shell-surface min-w-0 w-full p-8">
      <h2 class="display-title text-2xl">
        Sign in
      </h2>
      <p class="mt-2 text-sm text-[var(--text-muted)]">
        Use a platform admin account for this host.
      </p>
      <p class="mt-2 text-xs text-[var(--text-muted)]">
        Demo hint: admin@sandiwa.local - password <code>demo1234</code> (not prefilled)
      </p>
      <form class="mt-6 space-y-4" @submit.prevent="onSubmit">
        <div>
          <label class="mb-1 block text-sm font-medium" for="email">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            autocomplete="username"
            class="field-input"
          >
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium" for="password">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            autocomplete="current-password"
            class="field-input"
          >
        </div>
        <p v-if="error" class="text-sm text-[var(--color-danger)]" role="alert">
          {{ error }}
        </p>
        <button type="submit" class="btn-brand w-full" :disabled="isLoading">
          {{ isLoading ? 'Signing in…' : 'Sign in' }}
        </button>
      </form>
      <p class="mt-6 text-center text-sm text-[var(--text-muted)]">
        Looking for the product site?
        <NuxtLink to="/" class="font-medium text-[var(--bg-accent)] hover:underline">
          Back to home
        </NuxtLink>
      </p>
    </div>
  </div>
</template>
