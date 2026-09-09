<script setup lang="ts">
const { organization } = useTenant()
const { isAuthenticated, isOrgStaff, isMember, logout } = useAuth()
const { t } = useTerminology()
const { to: tenantPath } = useTenantPath()
const { locale, setLocale, t: $t } = useI18n()

const signingOut = ref(false)

async function toggleLanguage() {
  await setLocale(locale.value === 'en' ? 'tl' : 'en')
}

async function signOut() {
  signingOut.value = true
  try {
    await logout()
    await navigateTo(tenantPath('/'))
  } finally {
    signingOut.value = false
  }
}
</script>

<template>
  <div data-shell="impact" class="shell-scene">
    <div class="shell-scene__backdrop" aria-hidden="true" />
    <div class="shell-scene__orb shell-scene__orb--a" aria-hidden="true" />
    <div class="shell-scene__orb shell-scene__orb--b" aria-hidden="true" />
    <div class="shell-scene__orb shell-scene__orb--c" aria-hidden="true" />

    <header class="shell-header-float">
      <div class="flex h-[var(--chrome-height)] items-center justify-between gap-3 px-4 md:px-6">
        <NuxtLink :to="tenantPath('/')" class="flex min-w-0 items-center gap-3 text-[var(--text-on-accent)]">
          <BrandMark
            :name="organization?.name || 'HOA'"
            :src="organization?.logoUrl"
          />
          <span class="display-title truncate text-lg md:text-xl">
            {{ organization?.name }}
          </span>
        </NuxtLink>

        <div class="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            class="btn-ghost min-h-9 px-3 text-xs"
            :aria-pressed="locale === 'tl'"
            :aria-label="locale === 'en' ? 'Switch to Tagalog' : 'Switch to English'"
            @click="toggleLanguage"
          >
            {{ locale === 'en' ? 'EN' : 'TL' }}
          </button>

          <template v-if="isAuthenticated">
            <NuxtLink
              v-if="isMember"
              :to="tenantPath('/portal')"
              class="btn-ghost min-h-9 text-xs"
            >
              {{ $t('nav.portal') }}
            </NuxtLink>
            <NuxtLink
              v-if="isOrgStaff"
              :to="tenantPath('/console')"
              class="btn-ghost min-h-9 text-xs"
            >
              {{ t('roles.staff.label', 'Staff') }}
            </NuxtLink>
            <button
              type="button"
              class="btn-ghost min-h-9 text-xs"
              :disabled="signingOut"
              @click="signOut"
            >
              {{ $t('nav.logout') }}
            </button>
          </template>

          <template v-else>
            <NuxtLink
              :to="tenantPath('/login?member=1')"
              class="btn-ghost min-h-9 text-xs"
            >
              {{ $t('nav.memberLogin') }}
            </NuxtLink>
            <NuxtLink
              :to="tenantPath('/login')"
              class="btn-brand min-h-9 bg-[var(--brand-surface)] text-[var(--bg-accent)] text-xs hover:bg-white"
            >
              {{ $t('nav.login') }}
            </NuxtLink>
          </template>
        </div>
      </div>
    </header>

    <main class="shell-scene__content mx-auto w-full max-w-6xl px-4 py-8 md:px-8 md:py-10">
      <slot />
    </main>
  </div>
</template>
