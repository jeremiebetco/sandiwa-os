<script setup lang="ts">
const { isPlatform, isOrganization, organization, unknownOrg } = useTenant()
const { to: tenantPath } = useTenantPath()

onMounted(() => {
  if (isPlatform.value) {
    navigateTo('/platform/login')
  }
  if (unknownOrg.value) {
    navigateTo(tenantPath('/not-found'))
  }
})

const { t } = useTerminology()
const { isEnabled } = useFeatures()
const platform = usePlatformStore()

const announcements = computed(() => {
  if (!organization.value) return []
  return platform.getAnnouncements(organization.value.id).slice(0, 3)
})
</script>

<template>
  <div v-if="isOrganization && organization" class="space-y-10">
    <section class="shell-surface p-8 text-center">
      <h2 class="text-3xl font-bold md:text-4xl">
        {{ organization.landing.heroTitle }}
      </h2>
      <p class="mt-3 text-lg shell-text-muted">
        {{ organization.landing.heroSubtitle }}
      </p>
      <p class="mt-4 text-base">
        {{ organization.landing.welcomeMessage }}
      </p>
    </section>

    <section>
      <h3 class="mb-4 text-xl font-semibold">
        Services
      </h3>
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <NuxtLink
          v-if="isEnabled('intake')"
          :to="tenantPath('/portal/requests')"
          class="impact-action-panel impact-action-panel--services"
        >
          <UIcon name="i-lucide-message-square-plus" class="size-10" />
          <span>{{ t('modules.intake.label') }}</span>
          <span class="text-sm font-normal opacity-80">{{ t('modules.intake.description') }}</span>
        </NuxtLink>
        <div
          v-if="isEnabled('payments')"
          class="impact-action-panel impact-action-panel--payments"
        >
          <UIcon name="i-lucide-wallet" class="size-10" />
          <span>{{ t('modules.payments.label') }}</span>
          <span class="text-sm font-normal opacity-80">{{ t('modules.payments.description') }}</span>
        </div>
        <div
          v-if="isEnabled('broadcasts')"
          class="impact-action-panel impact-action-panel--emergency"
        >
          <UIcon name="i-lucide-siren" class="size-10" />
          <span>{{ t('modules.broadcasts.label') }}</span>
          <span class="text-sm font-normal opacity-80">{{ t('modules.broadcasts.description') }}</span>
        </div>
      </div>
    </section>

    <section v-if="announcements.length">
      <div class="mb-4 flex items-center justify-between">
        <h3 class="text-xl font-semibold">
          Announcements
        </h3>
        <NuxtLink :to="tenantPath('/announcements')" class="text-sm text-[var(--bg-accent)] hover:underline">
          View all
        </NuxtLink>
      </div>
      <ul class="space-y-3">
        <li v-for="item in announcements" :key="item.id" class="shell-surface p-4">
          <h4 class="font-semibold">
            {{ item.title }}
          </h4>
          <p class="mt-1 text-sm shell-text-muted line-clamp-2">
            {{ item.body }}
          </p>
        </li>
      </ul>
    </section>

    <section v-if="organization.officers.length">
      <h3 class="mb-4 text-xl font-semibold">
        Leadership
      </h3>
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div v-for="officer in organization.officers" :key="officer.id" class="shell-surface p-4">
          <p class="font-semibold">
            {{ officer.name }}
          </p>
          <p class="text-sm shell-text-muted">
            {{ officer.position }}
          </p>
        </div>
      </div>
    </section>

    <section class="shell-surface p-6">
      <h3 class="text-lg font-semibold">
        Contact
      </h3>
      <p class="mt-2 text-sm">
        {{ organization.landing.contactAddress }}
      </p>
      <p class="text-sm">
        {{ organization.landing.contactPhone }} · {{ organization.landing.contactEmail }}
      </p>
      <p class="text-sm shell-text-muted">
        {{ organization.landing.officeHours }}
      </p>
    </section>
  </div>
</template>
