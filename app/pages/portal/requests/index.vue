<script setup lang="ts">
import { sanitizeText } from '~/core/utils/sanitize'

definePageMeta({ layout: 'impact' })

const { slug } = useTenant()
const { user, isAuthenticated, isMember, hydrated } = useAuth()
const { t } = useTerminology()
const { to: tenantPath } = useTenantPath()
const platform = usePlatformStore()

const description = ref('')
const unit = ref('')
const submitError = ref('')
const submitted = ref(false)
const loading = ref(true)
const error = ref('')
const saving = ref(false)
const fetched = ref(false)

const myCases = computed(() => platform.intakeCases)

async function loadCases() {
  if (!slug.value || fetched.value) return
  loading.value = true
  error.value = ''
  try {
    await platform.fetchIntakeCases(slug.value)
    fetched.value = true
  } catch {
    error.value = 'Failed to load your requests.'
  } finally {
    loading.value = false
  }
}

watchEffect(() => {
  if (!hydrated.value) return
  if (!isAuthenticated.value || !isMember.value) {
    loading.value = false
    navigateTo(tenantPath('/login?member=1'))
    return
  }
  loadCases()
})

async function submit() {
  if (!slug.value || !user.value) return
  if (!description.value.trim()) {
    submitError.value = 'Please describe your request.'
    return
  }
  saving.value = true
  submitError.value = ''
  try {
    await platform.upsertIntakeCase(slug.value, {
      description: sanitizeText(description.value),
      category: 'other',
      unit: sanitizeText(unit.value, 100) || undefined,
      sentiment: 'neutral'
    })
    description.value = ''
    unit.value = ''
    submitted.value = true
  } catch (e: unknown) {
    const err = e as { data?: { statusMessage?: string }, statusMessage?: string }
    submitError.value = err?.data?.statusMessage || err?.statusMessage || 'Failed to submit request.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-2xl space-y-8">
    <div>
      <NuxtLink :to="tenantPath('/portal')" class="text-sm font-medium text-[var(--bg-accent)] hover:underline">
        ← Member home
      </NuxtLink>
      <h2 class="display-title mt-4 text-3xl">
        {{ t('modules.intake.label') }}
      </h2>
      <p class="shell-text-muted">
        {{ t('modules.intake.description') }}
      </p>
      <p v-if="user" class="mt-2 text-sm shell-text-muted">
        Signed in as {{ user.name }} ({{ user.email }})
      </p>
    </div>

    <p v-if="error" class="text-sm text-[var(--color-danger)]" role="alert">
      {{ error }}
    </p>

    <form class="shell-surface space-y-4 p-6" @submit.prevent="submit">
      <UFormField :label="t('fields.unit.label', 'Unit / Lot')">
        <UInput v-model="unit" class="w-full" />
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
      <button type="submit" class="btn-brand w-full" :disabled="saving || !isMember">
        {{ saving ? 'Submitting…' : 'Submit request' }}
      </button>
    </form>

    <section>
      <h3 class="text-lg font-semibold">
        Your requests
      </h3>
      <div v-if="loading" class="mt-4 shell-surface p-6 text-center shell-text-muted">
        Loading requests…
      </div>
      <ul v-else-if="myCases.length" class="mt-4 space-y-3">
        <li v-for="item in myCases" :key="item.id" class="shell-surface p-4">
          <div class="flex justify-between gap-2">
            <p class="font-medium">
              {{ item.description }}
            </p>
            <span
              class="status-badge shrink-0 capitalize"
              :class="`status-badge--${item.status === 'in_progress' ? 'pending' : item.status}`"
            >
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
