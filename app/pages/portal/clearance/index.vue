<script setup lang="ts">
import type { ClearanceRequest, ClearanceType, Unit } from '~/core/types'

definePageMeta({ layout: 'impact' })

const { slug } = useTenant()
const { t } = useTerminology()
const { to: tenantPath } = useTenantPath()

const clearances = ref<ClearanceRequest[]>([])
const units = ref<Unit[]>([])
const loading = ref(true)
const error = ref('')
const submitError = ref('')
const submitSuccess = ref('')
const submitting = ref(false)

const form = reactive({
  unitId: '',
  type: 'hoa_clearance' as ClearanceType,
  purpose: ''
})

function apiError(e: unknown): string {
  const err = e as { data?: { statusMessage?: string }, statusMessage?: string }
  return err?.data?.statusMessage || err?.statusMessage || 'Something went wrong. Try again.'
}

async function load() {
  if (!slug.value) return
  loading.value = true
  error.value = ''
  try {
    const [clrRes, unitRes] = await Promise.all([
      $fetch<{ clearances: ClearanceRequest[] }>(`/api/tenants/${slug.value}/clearances`),
      $fetch<{ units: Unit[] }>(`/api/tenants/${slug.value}/me/unit`)
    ])
    clearances.value = clrRes.clearances
    units.value = unitRes.units
    if (!form.unitId && unitRes.units[0]) form.unitId = unitRes.units[0].id
  } catch (e) {
    error.value = apiError(e)
  } finally {
    loading.value = false
  }
}

async function submit() {
  if (!slug.value) return
  submitError.value = ''
  submitSuccess.value = ''
  if (!form.unitId) {
    submitError.value = 'Select a unit for this clearance request.'
    return
  }
  submitting.value = true
  try {
    await $fetch(`/api/tenants/${slug.value}/clearances`, {
      method: 'POST',
      body: {
        unitId: form.unitId,
        type: form.type,
        purpose: form.purpose || undefined
      }
    })
    submitSuccess.value = 'Clearance request submitted.'
    form.purpose = ''
    await load()
  } catch (e) {
    submitError.value = apiError(e)
  } finally {
    submitting.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="mx-auto max-w-2xl space-y-8">
    <div>
      <NuxtLink :to="tenantPath('/portal')" class="text-sm text-[var(--bg-accent)] hover:underline">
        ← Member home
      </NuxtLink>
      <h2 class="display-title mt-4 text-3xl">
        Clearance requests
      </h2>
      <p class="shell-text-muted">
        Request HOA clearance for move-in, move-out, resale, or certificates.
      </p>
    </div>

    <div v-if="loading" class="space-y-3" aria-busy="true">
      <div class="shell-surface h-40 animate-pulse bg-[var(--bg-muted)]" />
      <div class="shell-surface h-24 animate-pulse bg-[var(--bg-muted)]" />
    </div>

    <div v-else-if="error" class="shell-surface p-8 text-center" role="alert">
      <p class="text-[var(--color-danger)]">
        {{ error }}
      </p>
      <button type="button" class="btn-brand mt-4" @click="load">
        Retry
      </button>
    </div>

    <template v-else>
      <form class="shell-surface space-y-4 p-6" @submit.prevent="submit">
        <UFormField :label="t('fields.unit.label', 'Unit')">
          <USelect
            v-model="form.unitId"
            :items="units.map(u => ({ label: u.code, value: u.id }))"
            class="w-full"
            :disabled="!units.length"
          />
        </UFormField>
        <UFormField label="Clearance type">
          <USelect
            v-model="form.type"
            :items="[
              { label: 'HOA clearance', value: 'hoa_clearance' },
              { label: 'Move in', value: 'move_in' },
              { label: 'Move out', value: 'move_out' },
              { label: 'Resale', value: 'resale' },
              { label: 'Certificate', value: 'certificate' }
            ]"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Purpose">
          <UTextarea
            v-model="form.purpose"
            :rows="3"
            placeholder="e.g. Bank loan requirement"
            class="w-full"
          />
        </UFormField>
        <p v-if="!units.length" class="text-sm shell-text-muted">
          No unit is linked to your account. Contact the association office.
        </p>
        <p v-if="submitError" class="text-sm text-[var(--color-danger)]" role="alert">
          {{ submitError }}
        </p>
        <p v-if="submitSuccess" class="text-sm text-[var(--color-success)]" role="status">
          {{ submitSuccess }}
        </p>
        <button type="submit" class="btn-brand w-full" :disabled="submitting || !units.length">
          {{ submitting ? 'Submitting…' : 'Submit request' }}
        </button>
      </form>

      <section>
        <h3 class="text-lg font-semibold">
          Your requests
        </h3>
        <ul v-if="clearances.length" class="mt-4 space-y-3">
          <li v-for="item in clearances" :key="item.id" class="shell-surface p-4">
            <div class="flex justify-between gap-2">
              <p class="font-medium capitalize">
                {{ item.type.replace(/_/g, ' ') }}
              </p>
              <span
                class="status-badge shrink-0 capitalize"
                :class="`status-badge--${item.status === 'pending' ? 'pending' : item.status}`"
              >
                {{ item.status }}
              </span>
            </div>
            <p v-if="item.purpose" class="mt-1 text-sm shell-text-muted">
              {{ item.purpose }}
            </p>
            <p class="mt-1 text-xs shell-text-muted">
              {{ new Date(item.createdAt).toLocaleString() }}
            </p>
          </li>
        </ul>
        <p v-else class="mt-4 shell-text-muted">
          No clearance requests yet.
        </p>
      </section>
    </template>
  </div>
</template>
