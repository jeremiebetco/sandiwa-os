<script setup lang="ts">
const { logout, user, isPlatformAdmin } = useAuth()
const route = useRoute()

const navItems = [
  { label: 'Organizations', to: '/platform/orgs', icon: 'i-lucide-building-2' },
  { label: 'Analytics', to: '/platform/analytics', icon: 'i-lucide-bar-chart-3' }
]

function isActive(path: string) {
  return route.path === path || route.path.startsWith(path + '/')
}
</script>

<template>
  <div data-shell="platform" class="shell-canvas min-h-screen">
    <header class="shell-header-gradient px-4 py-6 md:px-8">
      <div class="mx-auto flex max-w-6xl items-center justify-between">
        <div>
          <p class="text-sm opacity-90">
            Sandiwa OS Platform
          </p>
          <h1 class="text-2xl font-bold">
            HOA Tenant Management
          </h1>
        </div>
        <div v-if="isPlatformAdmin" class="flex items-center gap-4 text-sm">
          <span>{{ user?.name }}</span>
          <button type="button" class="interactive-states underline" @click="logout(); navigateTo('/platform/login')">
            Sign out
          </button>
        </div>
      </div>
    </header>
    <div v-if="isPlatformAdmin" class="mx-auto flex max-w-6xl gap-8 px-4 py-8 md:px-8">
      <nav class="hidden w-48 shrink-0 flex-col gap-1 md:flex">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="interactive-states flex items-center gap-2 rounded-lg px-3 py-2 text-sm"
          :class="isActive(item.to) ? 'bg-[var(--bg-muted)] font-medium' : 'shell-text-muted hover:bg-[var(--bg-muted)]'"
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
