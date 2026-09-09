<script setup lang="ts">
import type { OrgRole, Poll } from '~/core/types'
import { canPerformAction } from '~/core/rbac/permissions'

definePageMeta({ layout: 'console' })

const { slug } = useTenant()
const { user } = useAuth()
const { t } = useTerminology()

const polls = ref<Poll[]>([])
const talliesByPoll = ref<Record<string, { options: string[], tallies: number[], voteCount: number }>>({})
const loading = ref(true)
const error = ref('')
const actionError = ref('')
const actionSuccess = ref('')
const busyId = ref<string | null>(null)
const creating = ref(false)
const showForm = ref(false)

const form = reactive({
  title: '',
  description: '',
  eligibility: 'per_unit' as 'per_unit' | 'per_member',
  quorumPercent: 50,
  optionsText: 'Yes\nNo\nAbstain',
  status: 'open' as 'draft' | 'open'
})

const canCreate = computed(() =>
  user.value ? canPerformAction(user.value.role as OrgRole, 'poll.create') : false
)
const canClose = computed(() =>
  user.value ? canPerformAction(user.value.role as OrgRole, 'poll.close') : false
)

function apiError(e: unknown): string {
  const err = e as { data?: { statusMessage?: string }, statusMessage?: string }
  return err?.data?.statusMessage || err?.statusMessage || 'Something went wrong. Try again.'
}

async function loadPolls() {
  if (!slug.value) return
  loading.value = true
  error.value = ''
  try {
    const res = await $fetch<{ polls: Poll[] }>(`/api/tenants/${slug.value}/polls`)
    polls.value = res.polls
    await Promise.all(res.polls.map(p => loadTallies(p.id)))
  } catch (e) {
    error.value = apiError(e)
  } finally {
    loading.value = false
  }
}

async function loadTallies(pollId: string) {
  if (!slug.value) return
  try {
    const res = await $fetch<{
      options: string[]
      tallies: number[]
      voteCount: number
    }>(`/api/tenants/${slug.value}/polls/${pollId}/tallies`)
    talliesByPoll.value = {
      ...talliesByPoll.value,
      [pollId]: res
    }
  } catch {
    // tallies optional on list
  }
}

async function createPoll() {
  if (!slug.value || !canCreate.value) return
  actionError.value = ''
  actionSuccess.value = ''
  const options = form.optionsText.split('\n').map(o => o.trim()).filter(Boolean)
  if (!form.title.trim() || options.length < 2) {
    actionError.value = 'Title and at least two options are required.'
    return
  }
  creating.value = true
  try {
    await $fetch(`/api/tenants/${slug.value}/polls`, {
      method: 'POST',
      body: {
        title: form.title,
        description: form.description,
        eligibility: form.eligibility,
        quorumPercent: form.quorumPercent,
        options,
        status: form.status
      }
    })
    actionSuccess.value = 'Poll created.'
    showForm.value = false
    form.title = ''
    form.description = ''
    form.optionsText = 'Yes\nNo\nAbstain'
    await loadPolls()
  } catch (e) {
    actionError.value = apiError(e)
  } finally {
    creating.value = false
  }
}

async function setStatus(poll: Poll, status: 'open' | 'closed') {
  if (!slug.value) return
  if (status === 'closed' && !canClose.value) return
  actionError.value = ''
  actionSuccess.value = ''
  busyId.value = poll.id
  try {
    await $fetch(`/api/tenants/${slug.value}/polls/${poll.id}`, {
      method: 'PATCH',
      body: { status }
    })
    actionSuccess.value = status === 'open' ? 'Poll opened.' : 'Poll closed.'
    await loadPolls()
  } catch (e) {
    actionError.value = apiError(e)
  } finally {
    busyId.value = null
  }
}

onMounted(loadPolls)
</script>

<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h2 class="display-title text-3xl">
          {{ t('modules.polls.navLabel') }}
        </h2>
        <p class="mt-1 text-sm shell-text-muted">
          {{ t('modules.polls.description') }}
        </p>
      </div>
      <button v-if="canCreate" type="button" class="btn-brand" @click="showForm = !showForm">
        {{ showForm ? 'Cancel' : 'New poll' }}
      </button>
    </div>

    <div
      v-if="actionError"
      class="mt-4 rounded-lg border border-[var(--color-danger)] bg-[var(--color-danger-muted)] px-4 py-3 text-sm text-[var(--color-danger)]"
      role="alert"
    >
      {{ actionError }}
    </div>
    <div
      v-if="actionSuccess"
      class="mt-4 rounded-lg border border-[var(--color-success)] bg-[var(--color-success-muted)] px-4 py-3 text-sm text-[var(--color-success)]"
      role="status"
    >
      {{ actionSuccess }}
    </div>

    <div v-if="showForm" class="shell-surface mt-6 p-6">
      <h3 class="font-semibold">
        Create poll
      </h3>
      <form class="mt-4 grid gap-4 sm:grid-cols-2" @submit.prevent="createPoll">
        <UFormField label="Title" class="sm:col-span-2">
          <UInput v-model="form.title" class="w-full" />
        </UFormField>
        <UFormField label="Description" class="sm:col-span-2">
          <UTextarea v-model="form.description" :rows="3" class="w-full" />
        </UFormField>
        <UFormField label="Eligibility">
          <USelect
            v-model="form.eligibility"
            :items="[
              { label: 'Per unit', value: 'per_unit' },
              { label: 'Per member', value: 'per_member' }
            ]"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Quorum %">
          <UInput v-model.number="form.quorumPercent" type="number" min="0" max="100" class="w-full" />
        </UFormField>
        <UFormField label="Options (one per line)" class="sm:col-span-2">
          <UTextarea v-model="form.optionsText" :rows="4" class="w-full" />
        </UFormField>
        <UFormField label="Initial status">
          <USelect
            v-model="form.status"
            :items="[
              { label: 'Open', value: 'open' },
              { label: 'Draft', value: 'draft' }
            ]"
            class="w-full"
          />
        </UFormField>
        <div class="flex items-end">
          <button type="submit" class="btn-brand" :disabled="creating">
            {{ creating ? 'Creating…' : 'Create poll' }}
          </button>
        </div>
      </form>
    </div>

    <div v-if="loading" class="mt-6 space-y-3" aria-busy="true">
      <div v-for="n in 3" :key="n" class="shell-surface h-24 animate-pulse bg-[var(--bg-muted)]" />
    </div>

    <div v-else-if="error" class="mt-6 shell-surface p-8 text-center" role="alert">
      <p class="text-[var(--color-danger)]">
        {{ error }}
      </p>
      <button type="button" class="btn-brand mt-4" @click="loadPolls">
        Retry
      </button>
    </div>

    <ul v-else class="mt-6 space-y-4">
      <li v-for="poll in polls" :key="poll.id" class="shell-surface p-6">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 class="text-lg font-semibold">
              {{ poll.title }}
            </h3>
            <p class="mt-1 text-sm shell-text-muted">
              {{ poll.description }}
            </p>
            <p class="mt-2 flex flex-wrap items-center gap-2 text-xs shell-text-muted">
              <span
                class="status-badge capitalize"
                :class="`status-badge--poll-${poll.status}`"
              >
                {{ poll.status }}
              </span>
              <span>{{ poll.eligibility.replace('_', ' ') }} · Quorum {{ poll.quorumPercent }}%</span>
            </p>
          </div>
          <div class="flex flex-wrap gap-2">
            <button
              v-if="poll.status === 'draft'"
              type="button"
              class="btn-brand btn-sm"
              :disabled="busyId === poll.id"
              @click="setStatus(poll, 'open')"
            >
              {{ busyId === poll.id ? '…' : 'Open' }}
            </button>
            <button
              v-if="poll.status === 'open' && canClose"
              type="button"
              class="btn-quiet btn-sm"
              :disabled="busyId === poll.id"
              @click="setStatus(poll, 'closed')"
            >
              Close
            </button>
          </div>
        </div>

        <div v-if="talliesByPoll[poll.id]" class="mt-4 space-y-2">
          <p class="text-sm font-medium">
            Tallies ({{ talliesByPoll[poll.id]!.voteCount }} vote{{ talliesByPoll[poll.id]!.voteCount === 1 ? '' : 's' }})
          </p>
          <div
            v-for="(opt, idx) in talliesByPoll[poll.id]!.options"
            :key="`${poll.id}-${idx}`"
            class="flex items-center justify-between rounded-lg bg-[var(--bg-muted)] px-3 py-2 text-sm"
          >
            <span>{{ opt }}</span>
            <span class="tabular-nums font-medium">
              {{ talliesByPoll[poll.id]!.tallies[idx] ?? 0 }}
            </span>
          </div>
        </div>
        <p v-if="poll.summary" class="mt-3 text-sm">
          {{ poll.summary }}
        </p>
      </li>
      <li v-if="!polls.length" class="shell-surface p-12 text-center shell-text-muted">
        No polls yet. Create one to gather homeowner votes.
      </li>
    </ul>
  </div>
</template>
