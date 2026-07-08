<script setup lang="ts">
import type { IntakeCase } from '~/core/types'
import { sanitizeText } from '~/core/utils/sanitize'

definePageMeta({ layout: 'impact' })

const { organization } = useTenant()
const { t } = useTerminology()
const platform = usePlatformStore()

const description = ref('')
const unit = ref('')
const submitError = ref('')
const submitted = ref(false)

// Demo member identity for POC portal submissions
const demoMember = computed(() => {
  if (!organization.value) return null
  const members = platform.getOrgUsers(organization.value.id).filter(u => u.role === 'member')
  return members[0] ?? null
})

const myCases = computed(() => {
  if (!organization.value || !demoMember.value) return []
  return platform.getIntakeCases(organization.value.id).filter(
    c => c.memberId === demoMember.value!.id
  )
})

function submit() {
  if (!organization.value || !demoMember.value) return
  if (!description.value.trim()) {
    submitError.value = 'Please describe your request.'
    return
  }
  const caseItem: IntakeCase = {
    id: `case-${crypto.randomUUID().slice(0, 8)}`,
    organizationId: organization.value.id,
    memberId: demoMember.value.id,
    memberName: demoMember.value.name,
    unit: sanitizeText(unit.value || demoMember.value.unit || '', 100),
    description: sanitizeText(description.value),
    category: 'General',
    sentiment: 'neutral',
    status: 'open',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  platform.upsertIntakeCase(caseItem)
  description.value = ''
  unit.value = ''
  submitError.value = ''
  submitted.value = true
}
</script>

<template>
  <div class="mx-auto max-w-2xl space-y-8">
    <div>
      <NuxtLink to="/" class="text-sm text-[var(--bg-accent)] hover:underline">
        ← Back home
      </NuxtLink>
      <h2 class="mt-4 text-2xl font-bold">
        {{ t('modules.intake.label') }}
      </h2>
      <p class="shell-text-muted">
        {{ t('modules.intake.description') }}
      </p>
    </div>

    <form class="shell-surface space-y-4 p-6" @submit.prevent="submit">
      <UFormField :label="t('fields.unit.label', 'Unit / Lot')">
        <UInput v-model="unit" :placeholder="demoMember?.unit" class="w-full" />
      </UFormField>
      <UFormField label="Describe your concern">
        <UTextarea
          v-model="description"
          :rows="5"
          placeholder="Tell us what happened in your own words..."
          class="w-full"
        />
      </UFormField>
      <p v-if="submitError" class="text-sm text-[var(--color-danger)]">
        {{ submitError }}
      </p>
      <p v-if="submitted" class="text-sm text-[var(--color-success)]">
        Request submitted. You can track status below.
      </p>
      <UButton type="submit" block size="lg">
        Submit request
      </UButton>
    </form>

    <section>
      <h3 class="text-lg font-semibold">
        Your requests
      </h3>
      <ul v-if="myCases.length" class="mt-4 space-y-3">
        <li v-for="item in myCases" :key="item.id" class="shell-surface p-4">
          <div class="flex justify-between gap-2">
            <p class="font-medium">
              {{ item.description }}
            </p>
            <span class="shrink-0 text-sm capitalize shell-text-muted">
              {{ item.status.replace('_', ' ') }}
            </span>
          </div>
          <p class="mt-1 text-xs shell-text-muted">
            {{ new Date(item.createdAt).toLocaleString() }}
          </p>
        </li>
      </ul>
      <p v-else class="mt-4 shell-text-muted">
        No requests yet.
      </p>
    </section>
  </div>
</template>
