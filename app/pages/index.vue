<script setup lang="ts">
const { isPlatform, isOrganization, organization, unknownOrg, slug } = useTenant()
const { to: tenantPath } = useTenantPath()
const { t } = useTerminology()
const { isEnabled } = useFeatures()
const platform = usePlatformStore()

const loadingAnnouncements = ref(false)
const announcements = computed(() => platform.announcements.slice(0, 3))

onMounted(async () => {
  if (isPlatform.value) {
    await navigateTo('/platform/login')
    return
  }
  if (unknownOrg.value) {
    await navigateTo(tenantPath('/not-found'))
    return
  }
  if (!slug.value || !isOrganization.value) return
  loadingAnnouncements.value = true
  try {
    await platform.fetchAnnouncements(slug.value)
  } catch {
    // keep empty list; home still renders
  } finally {
    loadingAnnouncements.value = false
  }
})

const services = computed(() => {
  if (!organization.value) return []
  return [
    {
      to: tenantPath('/portal/requests'),
      label: t('modules.intake.label'),
      description: t('modules.intake.description'),
      icon: 'i-lucide-message-square-plus',
      enabled: isEnabled('intake'),
      alert: false
    },
    {
      to: tenantPath('/portal/statement'),
      label: t('modules.payments.label'),
      description: t('modules.payments.description'),
      icon: 'i-lucide-wallet',
      enabled: isEnabled('payments'),
      alert: false
    },
    {
      to: tenantPath('/alerts'),
      label: t('modules.broadcasts.label'),
      description: t('modules.broadcasts.description'),
      icon: 'i-lucide-siren',
      enabled: isEnabled('broadcasts'),
      alert: true
    }
  ].filter(item => item.enabled)
})
</script>

<template>
  <div v-if="isOrganization && organization" class="space-y-12">
    <section class="hero-panel shell-float">
      <div class="hero-panel__glow" aria-hidden="true" />
      <div class="grid lg:grid-cols-[1.1fr_0.9fr]">
        <div class="relative z-[1] flex flex-col justify-end gap-5 p-6 md:p-10">
          <p class="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--bg-accent)]">
            Welcome home
          </p>
          <h2 class="display-title max-w-xl text-3xl md:text-5xl">
            {{ organization.landing.heroTitle }}
          </h2>
          <p class="max-w-[38ch] text-base text-[var(--text-secondary)] md:text-lg">
            {{ organization.landing.heroSubtitle }}
          </p>
          <p class="max-w-[52ch] text-sm text-[var(--text-muted)]">
            {{ organization.landing.welcomeMessage }}
          </p>
          <div class="flex flex-wrap gap-3 pt-1">
            <NuxtLink :to="tenantPath('/login?member=1')" class="btn-brand">
              Member sign in
            </NuxtLink>
            <NuxtLink :to="tenantPath('/announcements')" class="btn-quiet">
              Announcements
            </NuxtLink>
          </div>
        </div>
        <div class="hero-panel__media relative min-h-56 lg:min-h-full">
          <img
            v-if="organization.heroImageUrl"
            :src="organization.heroImageUrl"
            :alt="`${organization.name} grounds`"
            class="relative z-[1] h-full w-full object-cover"
          >
          <div
            v-else
            class="relative z-[1] h-full min-h-56 bg-[var(--brand-accent-muted)]"
            aria-hidden="true"
          />
        </div>
      </div>
    </section>

    <section v-if="services.length" class="grid gap-4 md:grid-cols-2">
      <NuxtLink
        v-for="item in services"
        :key="item.to"
        :to="item.to"
        class="service-tile"
        :class="{ 'service-tile--alert': item.alert }"
      >
        <span class="service-tile__icon" aria-hidden="true">
          <UIcon :name="item.icon" class="size-5" />
        </span>
        <span class="display-title text-lg">{{ item.label }}</span>
        <span class="text-sm font-normal text-[var(--text-muted)]">{{ item.description }}</span>
      </NuxtLink>
    </section>

    <section v-if="loadingAnnouncements || announcements.length">
      <div class="mb-5 flex items-end justify-between gap-4">
        <h3 class="display-title text-2xl">
          Announcements
        </h3>
        <NuxtLink :to="tenantPath('/announcements')" class="text-sm font-medium text-[var(--bg-accent)] hover:underline">
          View all
        </NuxtLink>
      </div>
      <p v-if="loadingAnnouncements" class="shell-text-muted text-sm">
        Loading announcements…
      </p>
      <ul v-else class="grid gap-3 md:grid-cols-3">
        <li
          v-for="item in announcements"
          :key="item.id"
          class="shell-surface shell-float p-5"
        >
          <h4 class="font-semibold">
            {{ item.title }}
          </h4>
          <p class="mt-2 text-sm text-[var(--text-muted)] line-clamp-3">
            {{ item.body }}
          </p>
        </li>
      </ul>
    </section>

    <section v-if="organization.officers.length">
      <h3 class="mb-5 display-title text-2xl">
        Leadership
      </h3>
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <article
          v-for="officer in organization.officers"
          :key="officer.id"
          class="shell-surface shell-float flex items-center gap-4 p-4"
        >
          <img
            v-if="officer.photoUrl"
            :src="officer.photoUrl"
            :alt="officer.name"
            class="h-14 w-14 rounded-full object-cover"
          >
          <BrandMark v-else :name="officer.name" size="sm" />
          <div>
            <p class="font-semibold">
              {{ officer.name }}
            </p>
            <p class="text-sm text-[var(--text-muted)]">
              {{ officer.position }}
            </p>
          </div>
        </article>
      </div>
    </section>

    <section class="shell-surface shell-float p-6 md:p-8">
      <h3 class="display-title text-xl">
        Contact
      </h3>
      <p class="mt-3 max-w-[52ch] text-sm text-[var(--text-secondary)]">
        {{ organization.landing.contactAddress }}
      </p>
      <p class="mt-1 text-sm">
        {{ organization.landing.contactPhone }}
        <span class="text-[var(--text-muted)]"> / </span>
        {{ organization.landing.contactEmail }}
      </p>
      <p class="mt-1 text-sm text-[var(--text-muted)]">
        {{ organization.landing.officeHours }}
      </p>
    </section>
  </div>
</template>
