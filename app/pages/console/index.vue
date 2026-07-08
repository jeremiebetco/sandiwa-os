<script setup lang="ts">
definePageMeta({ layout: 'console' })

const { organization } = useTenant()
const { t } = useTerminology()
const { isEnabled } = useFeatures()
const platform = usePlatformStore()

const stats = computed(() => {
  if (!organization.value) return { announcements: 0, intakeOpen: 0 }
  const cases = platform.getIntakeCases(organization.value.id)
  return {
    announcements: platform.getAnnouncements(organization.value.id).length,
    intakeOpen: cases.filter(c => c.status === 'open' || c.status === 'in_progress').length
  }
})
</script>

<template>
  <div>
    <h2 class="text-2xl font-semibold">
      Dashboard
    </h2>
    <p class="text-sm shell-text-muted">
      {{ organization?.name }} operations overview
    </p>
    <div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div class="shell-surface p-6">
        <p class="text-sm shell-text-muted">
          Announcements
        </p>
        <p class="text-3xl font-bold">
          {{ stats.announcements }}
        </p>
      </div>
      <div v-if="isEnabled('intake')" class="shell-surface p-6">
        <p class="text-sm shell-text-muted">
          Open {{ t('modules.intake.navLabel') }}
        </p>
        <p class="text-3xl font-bold">
          {{ stats.intakeOpen }}
        </p>
      </div>
    </div>
  </div>
</template>
