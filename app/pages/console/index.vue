<script setup lang="ts">
definePageMeta({ layout: 'console' })

const { organization, slug } = useTenant()
const { t } = useTerminology()
const { isEnabled } = useFeatures()
const { to: tenantPath } = useTenantPath()
const platform = usePlatformStore()

const loading = ref(true)
const error = ref('')

const stats = computed(() => {
  const cases = platform.intakeCases
  return [
    {
      label: 'Announcements',
      value: platform.announcements.length,
      to: tenantPath('/console/announcements'),
      show: isEnabled('announcements')
    },
    {
      label: `Open ${t('modules.intake.navLabel')}`,
      value: cases.filter(c => c.status === 'open' || c.status === 'in_progress').length,
      to: tenantPath('/console/modules/intake'),
      show: isEnabled('intake')
    }
  ].filter(s => s.show)
})

onMounted(async () => {
  if (!slug.value) return
  loading.value = true
  error.value = ''
  try {
    const tasks: Promise<unknown>[] = [platform.fetchAnnouncements(slug.value)]
    if (isEnabled('intake')) {
      tasks.push(platform.fetchIntakeCases(slug.value))
    }
    await Promise.all(tasks)
  } catch {
    error.value = 'Failed to load dashboard stats.'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="space-y-8">
    <div>
      <h2 class="display-title text-3xl">
        Dashboard
      </h2>
      <p class="mt-1 text-sm text-[var(--text-muted)]">
        {{ organization?.name }} operations overview
      </p>
    </div>

    <p v-if="error" class="text-sm text-[var(--color-danger)]" role="alert">
      {{ error }}
    </p>

    <div v-if="loading" class="shell-surface p-10 text-center text-[var(--text-muted)]">
      Loading dashboard…
    </div>

    <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <NuxtLink
        v-for="stat in stats"
        :key="stat.label"
        :to="stat.to"
        class="shell-surface shell-float block p-6"
      >
        <p class="text-sm text-[var(--text-muted)]">
          {{ stat.label }}
        </p>
        <p class="display-title mt-2 text-4xl">
          {{ stat.value }}
        </p>
      </NuxtLink>
    </div>

    <section class="border-t border-[var(--border-default)] pt-6">
      <h3 class="text-sm font-semibold">
        Quick links
      </h3>
      <div class="mt-3 flex flex-wrap gap-3">
        <NuxtLink :to="tenantPath('/')" class="btn-quiet text-sm">
          Public site
        </NuxtLink>
        <NuxtLink
          v-if="isEnabled('landing_editor')"
          :to="tenantPath('/console/landing')"
          class="btn-quiet text-sm"
        >
          Edit landing
        </NuxtLink>
      </div>
    </section>
  </div>
</template>
