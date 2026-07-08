<script setup lang="ts">
definePageMeta({ layout: 'impact' })

const { loginOrg, isLoading, error } = useAuth()
const { to: tenantPath } = useTenantPath()
const email = ref('admin@greenfield-hoa.local')
const password = ref('demo1234')

async function onSubmit() {
  const ok = await loginOrg(email.value, password.value)
  if (ok) await navigateTo(tenantPath('/console'))
}
</script>

<template>
  <div class="mx-auto max-w-md">
    <div class="shell-surface p-8">
      <h2 class="text-xl font-semibold">
        HOA Staff Login
      </h2>
      <p class="mt-2 text-sm shell-text-muted">
        Operations console access for board and staff.
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
            autocomplete="current-password"
            class="interactive-states w-full rounded-lg border border-[var(--border-default)] px-3 py-2"
          >
        </div>
        <p v-if="error" class="text-sm text-[var(--color-danger)]" role="alert">
          {{ error }}
        </p>
        <UButton type="submit" block :loading="isLoading">
          Sign in to console
        </UButton>
        <NuxtLink :to="tenantPath('/')" class="block text-center text-sm shell-text-muted hover:underline">
          Back to member portal
        </NuxtLink>
      </form>
    </div>
  </div>
</template>
