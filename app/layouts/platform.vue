<script setup lang="ts">
const { logout, user, isPlatformAdmin } = useAuth()
const route = useRoute()
const signingOut = ref(false)
const menuOpen = ref(false)

const isAdminShell = computed(() =>
  isPlatformAdmin.value && route.path.startsWith('/platform') && route.path !== '/platform/login'
)

const isLoginPage = computed(() => route.path === '/platform/login')

const marketingLinks = [
  { label: 'Product', to: '/product' },
  { label: 'Pricing', to: '/pricing' },
  { label: 'Stories', to: '/stories' },
  { label: 'Contact', to: '/contact' }
]

const adminNav = [
  { label: 'Organizations', to: '/platform/orgs', icon: 'i-lucide-building-2' },
  { label: 'Analytics', to: '/platform/analytics', icon: 'i-lucide-bar-chart-3' }
]

const { buildTenantUrl } = useTenantDomain()
const liveDemoUrl = computed(() => buildTenantUrl('greenfield-hoa'))

function isMarketingActive(path: string) {
  return route.path === path
}

function isAdminActive(path: string) {
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

watch(() => route.path, () => {
  menuOpen.value = false
})
</script>

<template>
  <div data-shell="platform" class="shell-canvas flex min-h-[100dvh] flex-col">
    <!-- Marketing chrome -->
    <template v-if="!isAdminShell">
      <header class="platform-mkt-header">
        <div class="mx-auto flex h-full max-w-6xl items-center justify-between gap-4 px-4 md:px-8">
          <NuxtLink to="/" class="flex items-center gap-3 text-[var(--text-primary)]">
            <img
              src="/assets/sandiwa-mark.png"
              alt=""
              class="h-8 w-8 rounded-md object-cover"
            >
            <span class="display-title text-lg">Sandiwa</span>
          </NuxtLink>

          <nav class="hidden items-center gap-1 lg:flex" aria-label="Platform">
            <NuxtLink
              v-for="link in marketingLinks"
              :key="link.to"
              :to="link.to"
              class="platform-mkt-link"
              :class="{ 'is-active': isMarketingActive(link.to) }"
            >
              {{ link.label }}
            </NuxtLink>
          </nav>

          <div class="hidden items-center gap-2 lg:flex">
            <a
              :href="liveDemoUrl"
              class="btn-quiet text-sm"
              target="_blank"
              rel="noopener noreferrer"
            >
              See a live HOA
            </a>
            <NuxtLink
              v-if="isPlatformAdmin"
              to="/platform/orgs"
              class="btn-brand text-sm"
            >
              Open console
            </NuxtLink>
            <NuxtLink
              v-else
              to="/platform/login"
              class="btn-brand text-sm"
            >
              Sign in
            </NuxtLink>
          </div>

          <button
            type="button"
            class="btn-quiet lg:hidden"
            :aria-expanded="menuOpen"
            aria-controls="platform-mobile-nav"
            @click="menuOpen = !menuOpen"
          >
            Menu
          </button>
        </div>

        <div
          v-if="menuOpen"
          id="platform-mobile-nav"
          class="border-t border-[var(--border-default)] bg-[var(--bg-surface-raised)] px-4 py-4 lg:hidden"
        >
          <nav class="flex flex-col gap-1" aria-label="Platform mobile">
            <NuxtLink
              v-for="link in marketingLinks"
              :key="link.to"
              :to="link.to"
              class="platform-mkt-link"
              :class="{ 'is-active': isMarketingActive(link.to) }"
            >
              {{ link.label }}
            </NuxtLink>
            <a
              :href="liveDemoUrl"
              class="platform-mkt-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              See a live HOA
            </a>
            <NuxtLink
              v-if="isPlatformAdmin"
              to="/platform/orgs"
              class="platform-mkt-link"
            >
              Open console
            </NuxtLink>
            <NuxtLink
              v-else
              to="/platform/login"
              class="platform-mkt-link"
            >
              Sign in
            </NuxtLink>
          </nav>
        </div>
      </header>

      <main class="mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:px-8 md:py-10" :class="{ 'max-w-4xl': isLoginPage }">
        <slot />
      </main>

      <footer v-if="!isLoginPage" class="platform-footer">
        <div class="mx-auto grid max-w-6xl gap-8 px-4 md:grid-cols-[1.2fr_1fr_1fr] md:px-8">
          <div>
            <p class="display-title text-xl">
              Sandiwa OS
            </p>
            <p class="mt-3 max-w-[36ch] text-sm text-[var(--text-secondary)]">
              HOA operations for Philippine villages and condominiums. Public demo with sample data only.
            </p>
          </div>
          <div>
            <p class="text-sm font-semibold text-[var(--text-primary)]">
              Product
            </p>
            <ul class="mt-3 space-y-2 text-sm text-[var(--text-secondary)]">
              <li>
                <NuxtLink to="/product" class="hover:text-[var(--bg-accent)] hover:underline">
                  Modules
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/pricing" class="hover:text-[var(--bg-accent)] hover:underline">
                  Pricing
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/stories" class="hover:text-[var(--bg-accent)] hover:underline">
                  Live stories
                </NuxtLink>
              </li>
            </ul>
          </div>
          <div>
            <p class="text-sm font-semibold text-[var(--text-primary)]">
              Company
            </p>
            <ul class="mt-3 space-y-2 text-sm text-[var(--text-secondary)]">
              <li>
                <NuxtLink to="/contact" class="hover:text-[var(--bg-accent)] hover:underline">
                  Contact
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/privacy" class="hover:text-[var(--bg-accent)] hover:underline">
                  Privacy
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/terms" class="hover:text-[var(--bg-accent)] hover:underline">
                  Terms
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/platform/login" class="hover:text-[var(--bg-accent)] hover:underline">
                  Platform sign in
                </NuxtLink>
              </li>
            </ul>
          </div>
        </div>
      </footer>
    </template>

    <!-- Admin chrome -->
    <template v-else>
      <header class="platform-admin-header">
        <div class="mx-auto flex h-[var(--chrome-height)] max-w-6xl items-center justify-between gap-4 px-4 md:px-8">
          <NuxtLink to="/" class="flex items-center gap-3 text-[var(--text-on-accent)]">
            <img
              src="/assets/sandiwa-mark.png"
              alt=""
              class="h-9 w-9 rounded-md object-cover"
            >
            <span class="display-title text-lg">Sandiwa</span>
          </NuxtLink>
          <div class="flex items-center gap-3 text-sm text-[var(--text-on-accent)]">
            <NuxtLink to="/" class="btn-ghost min-h-9 text-xs">
              Marketing site
            </NuxtLink>
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

      <div class="mx-auto flex w-full max-w-6xl flex-1 gap-8 px-4 py-8 md:px-8">
        <nav class="hidden w-52 shrink-0 flex-col gap-1 md:flex" aria-label="Platform admin">
          <NuxtLink
            v-for="item in adminNav"
            :key="item.to"
            :to="item.to"
            class="platform-admin-link"
            :class="{ 'is-active': isAdminActive(item.to) }"
          >
            <UIcon :name="item.icon" class="size-4" />
            {{ item.label }}
          </NuxtLink>
        </nav>
        <main class="min-w-0 flex-1">
          <div class="mb-6 flex gap-2 md:hidden" aria-label="Platform admin mobile">
            <NuxtLink
              v-for="item in adminNav"
              :key="item.to"
              :to="item.to"
              class="platform-admin-link"
              :class="{ 'is-active': isAdminActive(item.to) }"
            >
              {{ item.label }}
            </NuxtLink>
          </div>
          <slot />
        </main>
      </div>
    </template>
  </div>
</template>
