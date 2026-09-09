<script setup lang="ts">
definePageMeta({ layout: 'impact' })

const route = useRoute()
const auth = useAuthStore()
const { organization } = useTenant()
const { loginOrg, isLoading, error } = useAuth()
const { to: tenantPath } = useTenantPath()

const isMemberLogin = computed(() => {
  const q = route.query.member
  return q === '1' || q === 'true'
})

const slug = computed(() => organization.value?.slug || 'greenfield-hoa')

const demoEmail = computed(() => {
  if (isMemberLogin.value) return `member@${slug.value}.local`
  return `admin@${slug.value}.local`
})

const email = ref(demoEmail.value)
const password = ref('')

watch([isMemberLogin, demoEmail], () => {
  email.value = demoEmail.value
})

async function onSubmit() {
  const ok = await loginOrg(email.value, password.value, isMemberLogin.value)
  if (!ok) return
  if (auth.isMember) {
    await navigateTo(tenantPath('/portal'))
  } else {
    await navigateTo(tenantPath('/console'))
  }
}
</script>

<template>
  <div class="mx-auto grid max-w-4xl gap-8 lg:grid-cols-[1fr_1.05fr] lg:items-center">
    <div class="hidden lg:block">
      <div class="shell-glass shell-float p-8">
        <h2 class="display-title text-4xl">
          {{ isMemberLogin ? 'Your unit, your records.' : 'The desk for board and staff.' }}
        </h2>
        <p class="mt-4 max-w-[36ch] text-[var(--text-secondary)]">
          {{ organization?.name }} keeps dues, requests, and notices in one place.
        </p>
      </div>
    </div>

    <div class="shell-glass shell-glass--strong shell-float p-6 md:p-8">
      <h2 class="display-title text-2xl">
        {{ isMemberLogin ? 'Member login' : 'Staff login' }}
      </h2>
      <p class="mt-2 text-sm text-[var(--text-muted)]">
        {{ isMemberLogin
          ? 'Sign in to requests, dues, and votes.'
          : 'Operations console for board and staff.' }}
      </p>
      <p class="mt-3 text-xs text-[var(--text-muted)]">
        Demo hint: {{ demoEmail }} — password <code>demo1234</code> (not prefilled)
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
          {{ isLoading ? 'Signing in…' : (isMemberLogin ? 'Sign in to portal' : 'Sign in to console') }}
        </button>
        <NuxtLink
          v-if="!isMemberLogin"
          :to="tenantPath('/login?member=1')"
          class="block text-center text-sm text-[var(--text-muted)] hover:underline"
        >
          Member login
        </NuxtLink>
        <NuxtLink
          v-else
          :to="tenantPath('/login')"
          class="block text-center text-sm text-[var(--text-muted)] hover:underline"
        >
          Staff login
        </NuxtLink>
        <NuxtLink :to="tenantPath('/')" class="block text-center text-sm text-[var(--text-muted)] hover:underline">
          Back to home
        </NuxtLink>
      </form>
    </div>
  </div>
</template>
