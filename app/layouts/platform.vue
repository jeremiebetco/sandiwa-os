<script setup lang="ts">
const { logout, user, isPlatformAdmin } = useAuth()
const route = useRoute()
const signingOut = ref(false)

const navItems = [
  { label: 'Organizations', to: '/platform/orgs', icon: 'i-lucide-building-2' },
  { label: 'Analytics', to: '/platform/analytics', icon: 'i-lucide-bar-chart-3' }
]

function isActive(path: string) {
  return route.path === path || route.path.startsWith(`${path}/`)
}

async function signOut() {
  signingOut.value = true
  try {
    await logout()
    await navigateTo('/platform/login')
  } finally {
    signingOut.value = false
  }
}
</script>

<template>
  <div data-shell="platform" class="shell-canvas min-h-[100dvh]">
    <header class="shell-header-gradient">
      <div class="mx-auto flex h-[var(--chrome-height)] max-w-6xl items-center justify-between gap-4 px-4 md:px-8">
        <NuxtLink to="/platform/orgs" class="flex items-center gap-3 text-[var(--text-on-accent)]">
          <img
            src="/assets/sandiwa-mark.png"
            alt=""
            class="h-9 w-9 rounded-md object-cover"
          >
          <span class="display-title text-lg">Sandiwa</span>
        </NuxtLink>
        <div v-if="isPlatformAdmin" class="flex items-center gap-3 text-sm text-[var(--text-on-accent)]">
          <span class="hidden sm:inline">{{ user?.name }}</span>
          <button
            type="button"
            class="btn-ghost min-h-9 text-xs"
            :disabled="signingOut"
            @click="signOut"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>

    <div v-if="isPlatformAdmin" class="mx-auto flex max-w-6xl gap-8 px-4 py-8 md:px-8">
      <nav class="hidden w-48 shrink-0 flex-col gap-0.5 md:flex" aria-label="Platform">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="nav-link"
          :class="{ 'is-active': isActive(item.to) }"
        >
          <UIcon :name="item.icon" class="size-4" />
          {{ item.label }}
        </NuxtLink>
      </nav>
      <main class="min-w-0 flex-1">
        <slot />
      </main>
    </div>
    <main v-else class="mx-auto max-w-md px-4 py-12">
      <slot />
    </main>
  </div>
</template>
