<script setup lang="ts">
import type { PluginKey } from '~/core/types'

const { organization } = useTenant()
const { logout, user } = useAuth()
const { t } = useTerminology()
const { isEnabled } = useFeatures()
const route = useRoute()
const { to: tenantPath } = useTenantPath()

const signingOut = ref(false)
const mobileNavOpen = ref(false)

const pluginIcons: Record<string, string> = {
  payments: 'i-lucide-wallet',
  ledger: 'i-lucide-book-open',
  polls: 'i-lucide-vote',
  broadcasts: 'i-lucide-siren'
}

const navItems = computed(() => {
  const items: { label: string, to: string, icon: string, plugin?: PluginKey }[] = [
    { label: 'Dashboard', to: tenantPath('/console'), icon: 'i-lucide-layout-dashboard' }
  ]

  if (isEnabled('announcements')) {
    items.push({ label: 'Announcements', to: tenantPath('/console/announcements'), icon: 'i-lucide-megaphone', plugin: 'announcements' })
  }
  if (isEnabled('intake')) {
    items.push({ label: t('modules.intake.navLabel'), to: tenantPath('/console/modules/intake'), icon: 'i-lucide-inbox', plugin: 'intake' })
  }
  if (isEnabled('staff_management')) {
    items.push({ label: 'Staff', to: tenantPath('/console/staff'), icon: 'i-lucide-users', plugin: 'staff_management' })
  }
  if (isEnabled('landing_editor')) {
    items.push({ label: 'Landing', to: tenantPath('/console/landing'), icon: 'i-lucide-palette', plugin: 'landing_editor' })
  }

  for (const plugin of ['payments', 'ledger', 'polls', 'broadcasts'] as PluginKey[]) {
    if (isEnabled(plugin)) {
      items.push({
        label: t(`modules.${plugin}.navLabel`),
        to: tenantPath(`/console/modules/${plugin}`),
        icon: pluginIcons[plugin] || 'i-lucide-puzzle',
        plugin
      })
    }
  }

  return items
})

function isActive(to: string) {
  const dashboard = tenantPath('/console')
  if (to === dashboard) return route.path === to
  return route.path === to || route.path.startsWith(`${to}/`)
}

watch(() => route.path, () => {
  mobileNavOpen.value = false
})

async function signOut() {
  signingOut.value = true
  try {
    await logout()
    await navigateTo(tenantPath('/login'))
  } finally {
    signingOut.value = false
  }
}
</script>

<template>
  <div data-shell="console" class="shell-canvas flex min-h-[100dvh]">
    <aside
      class="shell-glass hidden shrink-0 flex-col border-r border-[var(--glass-border)] md:flex md:rounded-none md:border-y-0 md:border-l-0"
      :style="{ width: 'var(--sidebar-width)' }"
    >
      <div class="flex items-center gap-3 px-5 py-5">
        <BrandMark
          :name="organization?.name || 'HOA'"
          :src="organization?.logoUrl"
        />
        <div class="min-w-0">
          <p class="display-title truncate text-base">
            {{ organization?.name }}
          </p>
          <p class="text-xs text-[var(--text-muted)]">
            Operations
          </p>
        </div>
      </div>
      <nav class="flex flex-1 flex-col gap-0.5 px-3 pb-4" aria-label="Operations">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="nav-link"
          :class="{ 'is-active': isActive(item.to) }"
        >
          <UIcon :name="item.icon" class="size-4 shrink-0" />
          {{ item.label }}
        </NuxtLink>
      </nav>
      <div class="border-t border-[var(--border-default)] px-5 py-4">
        <p class="truncate text-sm font-medium">
          {{ user?.name }}
        </p>
        <p class="truncate text-xs text-[var(--text-muted)]">
          {{ user?.email }}
        </p>
        <div class="mt-3 flex gap-3">
          <NuxtLink :to="tenantPath('/')" class="text-xs font-medium text-[var(--bg-accent)] hover:underline">
            Public site
          </NuxtLink>
          <button
            type="button"
            class="text-xs text-[var(--text-muted)] hover:underline disabled:opacity-50"
            :disabled="signingOut"
            @click="signOut"
          >
            Sign out
          </button>
        </div>
      </div>
    </aside>

    <div class="flex min-w-0 flex-1 flex-col">
      <header class="shell-glass flex items-center gap-3 border-b border-[var(--glass-border)] px-4 py-3 md:mx-4 md:mt-4 md:rounded-[var(--radius-xl)] md:border md:px-8">
        <button
          type="button"
          class="btn-quiet min-h-9 px-3 md:hidden"
          :aria-expanded="mobileNavOpen"
          aria-controls="console-mobile-nav"
          @click="mobileNavOpen = !mobileNavOpen"
        >
          Menu
        </button>
        <h2 class="display-title truncate text-base md:hidden">
          {{ organization?.name }}
        </h2>
        <div class="ml-auto flex gap-2 md:hidden">
          <button
            type="button"
            class="btn-quiet min-h-9 px-3 text-xs"
            :disabled="signingOut"
            @click="signOut"
          >
            Sign out
          </button>
        </div>
      </header>

      <nav
        v-if="mobileNavOpen"
        id="console-mobile-nav"
        class="flex gap-1 overflow-x-auto border-b border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2 md:hidden"
        aria-label="Operations"
      >
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="nav-link shrink-0"
          :class="{ 'is-active': isActive(item.to) }"
        >
          {{ item.label }}
        </NuxtLink>
      </nav>

      <main class="flex-1 p-4 md:p-8">
        <slot />
      </main>
    </div>
  </div>
</template>
