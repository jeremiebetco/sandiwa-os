<script setup lang="ts">
import type { Poll, Unit } from '~/core/types'

definePageMeta({ layout: 'impact' })

const { slug } = useTenant()
const { t } = useTerminology()
const { to: tenantPath } = useTenantPath()

const polls = ref<Poll[]>([])
const units = ref<Unit[]>([])
const loading = ref(true)
const error = ref('')
const voteError = ref('')
const voteSuccess = ref('')
const busyId = ref<string | null>(null)

const voteForms = ref<Record<string, { optionIndex: number | null, comment: string, unitId: string }>>({})

const openPolls = computed(() => polls.value.filter(p => p.status === 'open'))

function apiError(e: unknown): string {
  const err = e as { data?: { statusMessage?: string }, statusMessage?: string }
  return err?.data?.statusMessage || err?.statusMessage || 'Something went wrong. Try again.'
}

function ensureForm(poll: Poll) {
  if (!voteForms.value[poll.id]) {
    voteForms.value[poll.id] = {
      optionIndex: null,
      comment: '',
      unitId: units.value[0]?.id || ''
    }
  }
}

async function load() {
  if (!slug.value) return
  loading.value = true
  error.value = ''
  try {
    const [pollRes, unitRes] = await Promise.all([
      $fetch<{ polls: Poll[] }>(`/api/tenants/${slug.value}/polls`),
      $fetch<{ units: Unit[] }>(`/api/tenants/${slug.value}/me/unit`)
    ])
    polls.value = pollRes.polls
    units.value = unitRes.units
    for (const poll of pollRes.polls) ensureForm(poll)
  } catch (e) {
    error.value = apiError(e)
  } finally {
    loading.value = false
  }
}

async function submitVote(poll: Poll) {
  if (!slug.value) return
  const form = voteForms.value[poll.id]
  voteError.value = ''
  voteSuccess.value = ''
  if (!form || form.optionIndex === null) {
    voteError.value = 'Select an option before voting.'
    return
  }
  busyId.value = poll.id
  try {
    await $fetch(`/api/tenants/${slug.value}/polls/${poll.id}/vote`, {
      method: 'POST',
      body: {
        optionIndex: form.optionIndex,
        comment: form.comment || undefined,
        unitId: poll.eligibility === 'per_unit' ? (form.unitId || undefined) : undefined
      }
    })
    voteSuccess.value = `Vote recorded for “${poll.title}”.`
    form.comment = ''
  } catch (e) {
    voteError.value = apiError(e)
  } finally {
    busyId.value = null
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
        {{ t('modules.polls.label') }}
      </h2>
      <p class="shell-text-muted">
        {{ t('modules.polls.description') }}
      </p>
    </div>

    <div
      v-if="voteError"
      class="rounded-lg border border-[var(--color-danger)] bg-[var(--color-danger-muted)] px-4 py-3 text-sm text-[var(--color-danger)]"
      role="alert"
    >
      {{ voteError }}
    </div>
    <div
      v-if="voteSuccess"
      class="rounded-lg border border-[var(--color-success)] bg-[var(--color-success-muted)] px-4 py-3 text-sm text-[var(--color-success)]"
      role="status"
    >
      {{ voteSuccess }}
    </div>

    <div v-if="loading" class="space-y-3" aria-busy="true">
      <div v-for="n in 2" :key="n" class="shell-surface h-40 animate-pulse bg-[var(--bg-muted)]" />
    </div>

    <div v-else-if="error" class="shell-surface p-8 text-center" role="alert">
      <p class="text-[var(--color-danger)]">
        {{ error }}
      </p>
      <button type="button" class="btn-brand mt-4" @click="load">
        Retry
      </button>
    </div>

    <ul v-else class="space-y-6">
      <li v-for="poll in openPolls" :key="poll.id" class="shell-surface p-6">
        <h3 class="text-lg font-semibold">
          {{ poll.title }}
        </h3>
        <p class="mt-1 text-sm shell-text-muted">
          {{ poll.description }}
        </p>
        <form class="mt-4 space-y-3" @submit.prevent="submitVote(poll)">
          <fieldset>
            <legend class="mb-2 text-sm font-medium">
              Your vote
            </legend>
            <label
              v-for="(opt, idx) in poll.options"
              :key="`${poll.id}-${idx}`"
              class="interactive-states mb-2 flex cursor-pointer items-center gap-3 rounded-lg border border-[var(--border-default)] px-3 py-3 hover:bg-[var(--bg-muted)]"
            >
              <input
                v-model="voteForms[poll.id]!.optionIndex"
                type="radio"
                class="size-4"
                :name="`poll-${poll.id}`"
                :value="idx"
              >
              <span>{{ opt }}</span>
            </label>
          </fieldset>
          <UFormField
            v-if="poll.eligibility === 'per_unit' && units.length > 1"
            :label="t('fields.unit.label', 'Unit')"
          >
            <USelect
              v-model="voteForms[poll.id]!.unitId"
              :items="units.map(u => ({ label: u.code, value: u.id }))"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Comment (optional)">
            <UTextarea v-model="voteForms[poll.id]!.comment" :rows="2" class="w-full" />
          </UFormField>
          <button type="submit" class="btn-brand" :disabled="busyId === poll.id">
            {{ busyId === poll.id ? 'Submitting…' : 'Submit vote' }}
          </button>
        </form>
      </li>
      <li v-if="!openPolls.length" class="shell-surface p-12 text-center shell-text-muted">
        No open polls right now. Check back when the board publishes a vote.
      </li>
    </ul>
  </div>
</template>
