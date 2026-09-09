<script setup lang="ts">
definePageMeta({ layout: 'platform' })

const { loginPlatform, isLoading, error } = useAuth()
const email = ref('admin@sandiwa.local')
const password = ref('')

async function onSubmit() {
  const ok = await loginPlatform(email.value, password.value)
  if (ok) await navigateTo('/platform/orgs')
}
</script>

<template>
  <div class="mx-auto grid max-w-4xl gap-8 lg:grid-cols-2 lg:items-center">
    <div class="hidden lg:block">
      <h2 class="display-title text-4xl">
        HOA operations, one platform.
      </h2>
      <p class="mt-4 max-w-[36ch] text-sm text-[var(--text-secondary)]">
        Register communities, toggle modules, and monitor adoption across tenants.
      </p>
    </div>

    <div class="shell-surface p-8">
      <h2 class="display-title text-xl">
        Platform admin
      </h2>
      <p class="mt-2 text-sm text-[var(--text-muted)]">
        Sign in on the main domain to manage HOA tenants.
      </p>
      <p class="mt-2 text-xs text-[var(--text-muted)]">
        Demo hint: admin@sandiwa.local — password <code>demo1234</code> (not prefilled)
      </p>
      <form class="mt-6 space-y-4" @submit.prevent="onSubmit">
        <div>
          <label class="mb-1 block text-sm font-medium" for="email">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
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
    </div>
  </div>
</template>
