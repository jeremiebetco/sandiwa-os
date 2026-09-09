<script setup lang="ts">
definePageMeta({ layout: 'impact' })

const { organization } = useTenant()
const { user, isOrgStaff, isMember, logout } = useAuth()
const { t } = useTerminology()
const { isEnabled } = useFeatures()
const { to: tenantPath } = useTenantPath()

const links = computed(() => {
  const items: { to: string, label: string, description: string, icon: string, enabled: boolean, alert: boolean }[] = [
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
      description: 'View statement and submit payments',
      icon: 'i-lucide-wallet',
      enabled: isEnabled('payments'),
      alert: false
    },
    {
      to: tenantPath('/portal/votes'),
      label: t('modules.polls.label'),
      description: t('modules.polls.description'),
      icon: 'i-lucide-vote',
      enabled: isEnabled('polls'),
      alert: false
    },
    {
      to: tenantPath('/alerts'),
      label: t('modules.broadcasts.label'),
      description: t('modules.broadcasts.description'),
      icon: 'i-lucide-siren',
      enabled: isEnabled('broadcasts'),
      alert: true
    },
    {
      to: tenantPath('/portal/clearance'),
      label: 'Clearance',
      description: 'Request HOA clearance certificates',
      icon: 'i-lucide-file-check',
      enabled: isEnabled('payments'),
      alert: false
    }
  ]
  return items.filter(i => i.enabled)
})

async function signOut() {
  await logout()
  await navigateTo(tenantPath('/login?member=1'))
}
</script>

<template>
  <div class="space-y-10">
    <div class="shell-glass shell-float p-6 md:p-8">
      <p class="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--bg-accent)]">
        Member portal
      </p>
      <h2 class="display-title mt-2 text-3xl md:text-4xl">
        Hello{{ user?.name ? `, ${user.name}` : '' }}
      </h2>
      <p class="mt-2 max-w-[52ch] text-[var(--text-secondary)]">
        {{ organization?.name }} member desk for requests, dues, votes, and alerts.
      </p>
      <p v-if="isOrgStaff" class="mt-3 text-sm">
        <NuxtLink :to="tenantPath('/console')" class="font-medium text-[var(--bg-accent)] hover:underline">
          Open operations console
        </NuxtLink>
      </p>
    </div>

    <div v-if="!isMember && !isOrgStaff" class="shell-surface p-6 text-center" role="alert">
      <p>You need a homeowner or staff account to use the portal.</p>
      <NuxtLink :to="tenantPath('/login?member=1')" class="btn-brand mt-4 inline-flex">
        Sign in
      </NuxtLink>
    </div>

    <section v-else>
      <div class="grid gap-4 sm:grid-cols-2">
        <NuxtLink
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          class="service-tile"
          :class="{ 'service-tile--alert': link.alert }"
        >
          <span class="service-tile__icon" aria-hidden="true">
            <UIcon :name="link.icon" class="size-5" />
          </span>
          <span class="display-title text-lg">{{ link.label }}</span>
          <span class="text-sm font-normal text-[var(--text-muted)]">{{ link.description }}</span>
        </NuxtLink>
      </div>
      <p v-if="!links.length" class="mt-6 text-center text-[var(--text-muted)]">
        No member modules are enabled for this community yet.
      </p>
    </section>

    <div class="flex justify-start">
      <button
        type="button"
        class="text-sm text-[var(--text-muted)] hover:underline"
        @click="signOut"
      >
        Sign out
      </button>
    </div>
  </div>
</template>
