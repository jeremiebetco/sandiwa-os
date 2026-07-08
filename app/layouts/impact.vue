<script setup lang="ts">
const { organization } = useTenant()
const { isOrgStaff } = useAuth()
const { t } = useTerminology()
const { to: tenantPath } = useTenantPath()

const language = useState('impact-language', () => 'en')

function toggleLanguage() {
  language.value = language.value === 'en' ? 'tl' : 'en'
}
</script>

<template>
  <div data-shell="impact" class="shell-canvas min-h-screen">
    <header class="shell-header-gradient px-4 py-6 md:px-8">
      <div class="mx-auto flex max-w-5xl items-center justify-between gap-4">
        <div>
          <p class="text-sm opacity-90">
            Sandiwa OS
          </p>
          <h1 class="text-2xl font-bold md:text-3xl">
            {{ organization?.name }}
          </h1>
        </div>
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="interactive-states rounded-full border border-white/30 px-4 py-2 text-sm font-medium"
            :aria-pressed="language === 'tl'"
            @click="toggleLanguage"
          >
            {{ language === 'en' ? 'EN' : 'TL' }}
          </button>
          <NuxtLink
            v-if="!isOrgStaff"
            :to="tenantPath('/login')"
            class="interactive-states rounded-full bg-white/20 px-4 py-2 text-sm font-semibold"
          >
            Staff Login
          </NuxtLink>
          <NuxtLink
            v-else
            :to="tenantPath('/console')"
            class="interactive-states rounded-full bg-white/20 px-4 py-2 text-sm font-semibold"
          >
            {{ t('roles.staff.label', 'Staff') }} Console
          </NuxtLink>
        </div>
      </div>
    </header>
    <main class="mx-auto max-w-5xl px-4 py-8 md:px-8">
      <slot />
    </main>
    <footer class="border-t border-[var(--border-default)] px-4 py-6 text-center text-sm shell-text-muted">
      {{ organization?.landing.contactPhone }} · {{ organization?.landing.officeHours }}
    </footer>
  </div>
</template>
