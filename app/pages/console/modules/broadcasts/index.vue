<script setup lang="ts">
import type { Broadcast, BroadcastSeverity, OrgRole } from '~/core/types'
import { canPerformAction } from '~/core/rbac/permissions'

definePageMeta({ layout: 'console' })

const { slug } = useTenant()
const { user } = useAuth()
const { t } = useTerminology()

interface Delivery {
  id: string
  recipientId?: string
  channel: string
  status: string
  error?: string
  deliveredAt?: string
}

const broadcasts = ref<Broadcast[]>([])
const deliveries = ref<Delivery[]>([])
const selectedId = ref<string | null>(null)
const loading = ref(true)
const deliveriesLoading = ref(false)
const error = ref('')
const actionError = ref('')
const actionSuccess = ref('')
const sending = ref(false)
const showForm = ref(false)

const form = reactive({
  title: '',
  body: '',
  severity: 'info' as BroadcastSeverity,
  channel: 'portal' as 'portal' | 'sms' | 'both',
  audiencePhase: '',
  audienceUnitType: ''
})

const canSend = computed(() =>
  user.value ? canPerformAction(user.value.role as OrgRole, 'broadcast.send') : false
)

function apiError(e: unknown): string {
  const err = e as { data?: { statusMessage?: string }, statusMessage?: string }
  return err?.data?.statusMessage || err?.statusMessage || 'Something went wrong. Try again.'
}

async function loadBroadcasts() {
  if (!slug.value) return
  loading.value = true
  error.value = ''
  try {
    const res = await $fetch<{ broadcasts: Broadcast[] }>(`/api/tenants/${slug.value}/broadcasts`)
    broadcasts.value = res.broadcasts
  } catch (e) {
    error.value = apiError(e)
  } finally {
    loading.value = false
  }
}

async function viewDeliveries(id: string) {
  if (!slug.value) return
  selectedId.value = id
  deliveriesLoading.value = true
  deliveries.value = []
  try {
    const res = await $fetch<{ deliveries: Delivery[] }>(
      `/api/tenants/${slug.value}/broadcasts/${id}/deliveries`
    )
    deliveries.value = res.deliveries
  } catch (e) {
    actionError.value = apiError(e)
  } finally {
    deliveriesLoading.value = false
  }
}

async function sendBroadcast() {
  if (!slug.value || !canSend.value) return
  actionError.value = ''
  actionSuccess.value = ''
  if (!form.title.trim() || !form.body.trim()) {
    actionError.value = 'Title and body are required.'
    return
  }
  sending.value = true
  try {
    const res = await $fetch<{ deliveriesCreated: number }>(`/api/tenants/${slug.value}/broadcasts`, {
      method: 'POST',
      body: {
        title: form.title,
        body: form.body,
        severity: form.severity,
        channel: form.channel,
        audiencePhase: form.audiencePhase || undefined,
        audienceUnitType: form.audienceUnitType || undefined
      }
    })
    actionSuccess.value = `Broadcast sent to ${res.deliveriesCreated} recipient${res.deliveriesCreated === 1 ? '' : 's'}.`
    showForm.value = false
    form.title = ''
    form.body = ''
    form.severity = 'info'
    form.channel = 'portal'
    form.audiencePhase = ''
    form.audienceUnitType = ''
    await loadBroadcasts()
  } catch (e) {
    actionError.value = apiError(e)
  } finally {
    sending.value = false
  }
}

function severityBadgeClass(severity: BroadcastSeverity) {
  return `status-badge--broadcast-${severity}`
}

onMounted(loadBroadcasts)
</script>

<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h2 class="display-title text-3xl">
          {{ t('modules.broadcasts.navLabel') }}
        </h2>
        <p class="mt-1 text-sm shell-text-muted">
          Compose and review community alerts.
        </p>
      </div>
      <button v-if="canSend" type="button" class="btn-brand" @click="showForm = !showForm">
        {{ showForm ? 'Cancel' : 'Compose broadcast' }}
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
        Compose broadcast
      </h3>
      <form class="mt-4 grid gap-4 sm:grid-cols-2" @submit.prevent="sendBroadcast">
        <UFormField label="Title" class="sm:col-span-2">
          <UInput v-model="form.title" class="w-full" />
        </UFormField>
        <UFormField label="Message" class="sm:col-span-2">
          <UTextarea v-model="form.body" :rows="4" class="w-full" />
        </UFormField>
        <UFormField label="Severity">
          <USelect
            v-model="form.severity"
            :items="[
              { label: 'Info', value: 'info' },
              { label: 'Warning', value: 'warning' },
              { label: 'Emergency', value: 'emergency' }
            ]"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Channel">
          <USelect
            v-model="form.channel"
            :items="[
              { label: 'Portal', value: 'portal' },
              { label: 'SMS', value: 'sms' },
              { label: 'Portal + SMS', value: 'both' }
            ]"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Audience phase (optional)">
          <UInput v-model="form.audiencePhase" placeholder="e.g. Phase 1" class="w-full" />
        </UFormField>
        <UFormField label="Audience unit type (optional)">
          <UInput v-model="form.audienceUnitType" placeholder="e.g. townhouse" class="w-full" />
        </UFormField>
        <div class="sm:col-span-2">
          <button
            type="submit"
            class="btn-brand"
            :class="{ 'btn-danger': form.severity === 'emergency' }"
            :disabled="sending"
          >
            {{ sending ? 'Sending…' : 'Send broadcast' }}
          </button>
        </div>
      </form>
    </div>

    <div v-if="loading" class="mt-6 space-y-3" aria-busy="true">
      <div v-for="n in 3" :key="n" class="shell-surface h-20 animate-pulse bg-[var(--bg-muted)]" />
    </div>

    <div v-else-if="error" class="mt-6 shell-surface p-8 text-center" role="alert">
      <p class="text-[var(--color-danger)]">
        {{ error }}
      </p>
      <button type="button" class="btn-brand mt-4" @click="loadBroadcasts">
        Retry
      </button>
    </div>

    <div v-else class="mt-6 grid gap-6 lg:grid-cols-2">
      <ul class="space-y-3">
        <li
          v-for="item in broadcasts"
          :key="item.id"
          class="shell-surface cursor-pointer p-4 transition-colors hover:bg-[var(--bg-surface-raised)]"
          :class="{ 'ring-2 ring-[var(--bg-accent)]': selectedId === item.id }"
          @click="viewDeliveries(item.id)"
        >
          <div class="flex items-start justify-between gap-2">
            <h3 class="font-semibold">
              {{ item.title }}
            </h3>
            <span class="status-badge shrink-0 capitalize" :class="severityBadgeClass(item.severity)">
              {{ item.severity }}
            </span>
          </div>
          <p class="mt-1 text-sm shell-text-muted line-clamp-2">
            {{ item.body }}
          </p>
          <p class="mt-2 text-xs shell-text-muted">
            {{ item.channel }} · {{ item.sentAt ? new Date(item.sentAt).toLocaleString() : 'Unsent' }}
            <template v-if="item.audiencePhase">
              · {{ item.audiencePhase }}
            </template>
          </p>
        </li>
        <li v-if="!broadcasts.length" class="shell-surface p-12 text-center shell-text-muted">
          No broadcasts yet.
        </li>
      </ul>

      <div class="shell-surface p-6">
        <h3 class="font-semibold">
          Deliveries
        </h3>
        <div v-if="!selectedId" class="mt-8 text-center text-sm shell-text-muted">
          Select a broadcast to view deliveries.
        </div>
        <div v-else-if="deliveriesLoading" class="mt-4 space-y-2" aria-busy="true">
          <div v-for="n in 3" :key="n" class="h-10 animate-pulse rounded-lg bg-[var(--bg-muted)]" />
        </div>
        <ul v-else class="mt-4 space-y-2">
          <li
            v-for="d in deliveries"
            :key="d.id"
            class="flex items-center justify-between rounded-lg bg-[var(--bg-muted)] px-3 py-2 text-sm"
          >
            <span class="shell-text-muted">
              {{ d.recipientId || 'Unknown' }} · {{ d.channel }}
            </span>
            <span class="capitalize">
              {{ d.status }}
            </span>
          </li>
          <li v-if="!deliveries.length" class="py-8 text-center text-sm shell-text-muted">
            No delivery records for this broadcast.
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
