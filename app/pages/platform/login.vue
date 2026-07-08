<script setup lang="ts">
definePageMeta({ layout: 'platform' })

const { loginPlatform, isLoading, error } = useAuth()
const email = ref('admin@sandiwa.local')
const password = ref('demo1234')

async function onSubmit() {
  const ok = await loginPlatform(email.value, password.value)
  if (ok) await navigateTo('/platform/orgs')
}
</script>

<template>
  <div class="shell-surface mx-auto max-w-md p-8">
    <h2 class="text-xl font-semibold">
      Platform Admin Login
    </h2>
    <p class="mt-2 text-sm shell-text-muted">
      Sign in on the main domain to manage HOA tenants.
    </p>
    <form class="mt-6 space-y-4" @submit.prevent="onSubmit">
      <div>
        <label class="mb-1 block text-sm font-medium" for="email">Email</label>
        <input
          id="email"
          v-model="email"
          type="email"
          required
          class="interactive-states w-full rounded-lg border border-[var(--border-default)] px-3 py-2"
        >
      </div>
      <div>
        <label class="mb-1 block text-sm font-medium" for="password">Password</label>
        <input
          id="password"
          v-model="password"
          type="password"
          required
          class="interactive-states w-full rounded-lg border border-[var(--border-default)] px-3 py-2"
        >
      </div>
      <p v-if="error" class="text-sm text-[var(--color-danger)]" role="alert">
        {{ error }}
      </p>
      <UButton type="submit" block :loading="isLoading">
        Sign in
      </UButton>
    </form>
  </div>
</template>
