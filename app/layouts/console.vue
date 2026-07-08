<script setup lang="ts">
import type { PluginKey } from '~/core/types'

const { organization } = useTenant()
const { logout, user } = useAuth()
const { t } = useTerminology()
const { isEnabled } = useFeatures()
const route = useRoute()
const { to: tenantPath } = useTenantPath()

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
        icon: 'i-lucide-puzzle',
        plugin
      })
    }
  }

  return items
})

function isActive(path: string) {
  const full = tenantPath(path)
  return route.path === full || (path !== '/console' && route.path.startsWith(full))
}
</script>

<template>
  <div data-shell="console" class="shell-canvas flex min-h-screen">
    <aside
      class="hidden w-64 shrink-0 flex-col border-r border-[var(--border-default)] bg-[var(--bg-surface)] md:flex"
      style="width: var(--sidebar-width)"
    >
      <div class="shell-header-gradient p-6">
        <p class="text-xs uppercase tracking-wide opacity-80">
          Operations Console
        </p>
        <h1 class="text-lg font-semibold">
          {{ organization?.name }}
        </h1>
      </div>
      <nav class="flex flex-1 flex-col gap-1 p-4">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="interactive-states flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors"
          :class="isActive(item.to)
            ? 'bg-[var(--bg-surface-raised)] text-[var(--text-primary)] border-l-2 border-[var(--bg-accent)]'
            : 'text-[var(--text-muted)] hover:bg-[var(--bg-surface-raised)] hover:text-[var(--text-primary)]'"
        >
          <UIcon :name="item.icon" class="size-5" />
          {{ item.label }}
        </NuxtLink>
      </nav>
      <div class="border-t border-[var(--border-default)] p-4">
        <p class="text-sm font-medium">
          {{ user?.name }}
        </p>
        <p class="text-xs shell-text-muted">
          {{ user?.email }}
        </p>
        <div class="mt-3 flex gap-2">
          <NuxtLink :to="tenantPath('/')" class="text-xs text-[var(--bg-accent)] hover:underline">
            View portal
          </NuxtLink>
          <button type="button" class="text-xs shell-text-muted hover:underline" @click="logout(); navigateTo(tenantPath('/login'))">
            Sign out
          </button>
        </div>
      </div>
    </aside>
    <div class="flex min-w-0 flex-1 flex-col">
      <header class="flex items-center justify-between border-b border-[var(--border-default)] bg-[var(--bg-surface)] px-4 py-4 md:px-8">
        <h2 class="text-lg font-semibold md:hidden">
          {{ organization?.name }}
        </h2>
        <div class="ml-auto flex gap-2 md:hidden">
          <UButton size="sm" variant="ghost" @click="logout(); navigateTo(tenantPath('/login'))">
            Sign out
          </UButton>
        </div>
      </header>
      <main class="flex-1 p-4 md:p-8">
        <slot />
      </main>
    </div>
  </div>
</template>
