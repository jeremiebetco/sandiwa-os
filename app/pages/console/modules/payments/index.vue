<script setup lang="ts">
import type {
  AssessmentType,
  ClearanceRequest,
  ClearanceStatus,
  Invoice,
  OrgRole,
  Payment
} from '~/core/types'
import { canPerformAction } from '~/core/rbac/permissions'

definePageMeta({ layout: 'console' })

const { slug } = useTenant()
const { user } = useAuth()
const { t } = useTerminology()

type Tab = 'invoices' | 'payments' | 'aging' | 'clearances'
const tab = ref<Tab>('invoices')

const invoices = ref<Invoice[]>([])
const payments = ref<Payment[]>([])
const clearances = ref<ClearanceRequest[]>([])
const assessmentTypes = ref<AssessmentType[]>([])
const aging = ref<{
  current: { count: number, amount: string }
  days30: { count: number, amount: string }
  days60: { count: number, amount: string }
  days90Plus: { count: number, amount: string }
} | null>(null)

const loading = ref(true)
const error = ref('')
const actionError = ref('')
const actionSuccess = ref('')
const busyId = ref<string | null>(null)

const generateForm = reactive({
  assessmentTypeId: '',
  period: new Date().toISOString().slice(0, 7),
  dueDate: ''
})
const generating = ref(false)

const canGenerate = computed(() =>
  user.value ? canPerformAction(user.value.role as OrgRole, 'invoice.generate') : false
)
const canVerify = computed(() =>
  user.value ? canPerformAction(user.value.role as OrgRole, 'payment.verify') : false
)
const canReviewClearance = computed(() =>
  user.value ? canPerformAction(user.value.role as OrgRole, 'clearance.review') : false
)

const pendingPayments = computed(() => payments.value.filter(p => p.status === 'pending'))

function apiError(e: unknown): string {
  const err = e as { data?: { statusMessage?: string }, statusMessage?: string }
  return err?.data?.statusMessage || err?.statusMessage || 'Something went wrong. Try again.'
}

function formatMoney(value: string | number) {
  const n = Number(value)
  if (!Number.isFinite(n)) return String(value)
  return n.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })
}

async function loadAll() {
  if (!slug.value) return
  loading.value = true
  error.value = ''
  try {
    const base = `/api/tenants/${slug.value}`
    const [invRes, payRes, clrRes, ageRes, astRes] = await Promise.all([
      $fetch<{ invoices: Invoice[] }>(`${base}/invoices`),
      $fetch<{ payments: Payment[] }>(`${base}/payments`),
      $fetch<{ clearances: ClearanceRequest[] }>(`${base}/clearances`),
      $fetch<{ aging: NonNullable<typeof aging.value> }>(`${base}/aging`),
      $fetch<{ assessmentTypes: AssessmentType[] }>(`${base}/assessment-types`)
    ])
    invoices.value = invRes.invoices
    payments.value = payRes.payments
    clearances.value = clrRes.clearances
    aging.value = ageRes.aging
    assessmentTypes.value = astRes.assessmentTypes.filter(a => a.active)
    if (!generateForm.assessmentTypeId && assessmentTypes.value[0]) {
      generateForm.assessmentTypeId = assessmentTypes.value[0].id
    }
    if (!generateForm.dueDate) {
      const d = new Date()
      d.setDate(10)
      generateForm.dueDate = d.toISOString().slice(0, 10)
    }
  } catch (e) {
    error.value = apiError(e)
  } finally {
    loading.value = false
  }
}

async function generateInvoices() {
  if (!slug.value || !canGenerate.value) return
  actionError.value = ''
  actionSuccess.value = ''
  generating.value = true
  try {
    const res = await $fetch<{ generated: number }>(`/api/tenants/${slug.value}/invoices/generate`, {
      method: 'POST',
      body: {
        assessmentTypeId: generateForm.assessmentTypeId,
        period: generateForm.period,
        dueDate: generateForm.dueDate
      }
    })
    actionSuccess.value = `Generated ${res.generated} invoice${res.generated === 1 ? '' : 's'}.`
    await loadAll()
  } catch (e) {
    actionError.value = apiError(e)
  } finally {
    generating.value = false
  }
}

async function verifyPayment(id: string, action: 'verify' | 'reject') {
  if (!slug.value || !canVerify.value) return
  actionError.value = ''
  actionSuccess.value = ''
  busyId.value = id
  try {
    await $fetch(`/api/tenants/${slug.value}/payments/${id}/verify`, {
      method: 'POST',
      body: { action }
    })
    actionSuccess.value = action === 'verify' ? 'Payment verified.' : 'Payment rejected.'
    await loadAll()
  } catch (e) {
    actionError.value = apiError(e)
  } finally {
    busyId.value = null
  }
}

async function reviewClearance(id: string, status: ClearanceStatus) {
  if (!slug.value || !canReviewClearance.value) return
  actionError.value = ''
  actionSuccess.value = ''
  busyId.value = id
  try {
    await $fetch(`/api/tenants/${slug.value}/clearances/${id}`, {
      method: 'PATCH',
      body: { status }
    })
    actionSuccess.value = `Clearance ${status}.`
    await loadAll()
  } catch (e) {
    actionError.value = apiError(e)
  } finally {
    busyId.value = null
  }
}

onMounted(loadAll)

const tabs: { key: Tab, label: string }[] = [
  { key: 'invoices', label: 'Invoices' },
  { key: 'payments', label: 'Payments queue' },
  { key: 'aging', label: 'Aging' },
  { key: 'clearances', label: 'Clearances' }
]
</script>

<template>
  <div class="space-y-6">
    <div>
      <h2 class="display-title text-3xl">
        {{ t('modules.payments.navLabel') }}
      </h2>
      <p class="mt-1 text-sm text-[var(--text-muted)]">
        Invoices, payment verification, aging, and clearance requests.
      </p>
    </div>

    <div class="mt-6 flex flex-wrap gap-2" role="tablist" aria-label="Payments sections">
      <button
        v-for="item in tabs"
        :key="item.key"
        type="button"
        role="tab"
        class="interactive-states rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
        :class="tab === item.key
          ? 'border-[var(--bg-accent)] bg-[var(--bg-accent)] text-[var(--text-on-accent)]'
          : 'border-[var(--border-default)] text-[var(--text-muted)] hover:bg-[var(--bg-surface-raised)] hover:text-[var(--text-primary)]'"
        :aria-selected="tab === item.key"
        @click="tab = item.key"
      >
        {{ item.label }}
        <span v-if="item.key === 'payments' && pendingPayments.length" class="ml-1 opacity-80">
          ({{ pendingPayments.length }})
        </span>
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

    <div v-if="loading" class="mt-6 space-y-3" aria-busy="true" aria-live="polite">
      <div v-for="n in 4" :key="n" class="shell-surface h-14 animate-pulse bg-[var(--bg-muted)]" />
    </div>

    <div
      v-else-if="error"
      class="mt-6 shell-surface p-8 text-center"
      role="alert"
    >
      <p class="text-[var(--color-danger)]">
        {{ error }}
      </p>
      <button type="button" class="btn-brand mt-4" @click="loadAll">
        Retry
      </button>
    </div>

    <template v-else>
      <!-- Invoices -->
      <section v-show="tab === 'invoices'" class="mt-6 space-y-6">
        <div v-if="canGenerate" class="shell-surface p-6">
          <h3 class="font-semibold">
            Generate invoice run
          </h3>
          <form class="mt-4 grid gap-4 sm:grid-cols-3" @submit.prevent="generateInvoices">
            <UFormField label="Assessment type">
              <USelect
                v-model="generateForm.assessmentTypeId"
                :items="assessmentTypes.map(a => ({ label: `${a.name} (${formatMoney(a.defaultAmount)})`, value: a.id }))"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Period (YYYY-MM)">
              <UInput v-model="generateForm.period" placeholder="2026-04" class="w-full" />
            </UFormField>
            <UFormField label="Due date">
              <UInput v-model="generateForm.dueDate" type="date" class="w-full" />
            </UFormField>
            <div class="sm:col-span-3">
              <button type="submit" class="btn-brand" :disabled="generating || !generateForm.assessmentTypeId">
                {{ generating ? 'Generating…' : 'Generate for active units' }}
              </button>
            </div>
          </form>
        </div>

        <div class="shell-surface overflow-x-auto">
          <table class="w-full min-w-[40rem] text-left text-sm">
            <thead class="bg-[var(--bg-muted)]">
              <tr>
                <th class="px-4 py-3 font-medium">
                  Unit
                </th>
                <th class="px-4 py-3 font-medium">
                  Description
                </th>
                <th class="px-4 py-3 font-medium">
                  Period
                </th>
                <th class="px-4 py-3 font-medium">
                  Amount
                </th>
                <th class="px-4 py-3 font-medium">
                  Status
                </th>
                <th class="px-4 py-3 font-medium">
                  Due
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="inv in invoices"
                :key="inv.id"
                class="border-t border-[var(--border-default)] hover:bg-[var(--bg-surface-raised)]"
              >
                <td class="px-4 py-3">
                  {{ inv.unitCode || inv.unitId }}
                </td>
                <td class="px-4 py-3">
                  {{ inv.description }}
                </td>
                <td class="px-4 py-3 shell-text-muted">
                  {{ inv.period }}
                </td>
                <td class="px-4 py-3 tabular-nums">
                  {{ formatMoney(inv.amount) }}
                </td>
                <td class="px-4 py-3">
                  <span
                    class="status-badge capitalize"
                    :class="`status-badge--invoice-${inv.status}`"
                  >
                    {{ inv.status }}
                  </span>
                </td>
                <td class="px-4 py-3 shell-text-muted">
                  {{ inv.dueDate }}
                </td>
              </tr>
              <tr v-if="!invoices.length">
                <td colspan="6" class="px-4 py-12 text-center shell-text-muted">
                  No invoices yet. Generate a run to bill active units.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Payments queue -->
      <section v-show="tab === 'payments'" class="mt-6">
        <div class="shell-surface overflow-x-auto">
          <table class="w-full min-w-[44rem] text-left text-sm">
            <thead class="bg-[var(--bg-muted)]">
              <tr>
                <th class="px-4 py-3 font-medium">
                  Amount
                </th>
                <th class="px-4 py-3 font-medium">
                  Method
                </th>
                <th class="px-4 py-3 font-medium">
                  Reference
                </th>
                <th class="px-4 py-3 font-medium">
                  Status
                </th>
                <th class="px-4 py-3 font-medium">
                  Submitted
                </th>
                <th class="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="pay in payments"
                :key="pay.id"
                class="border-t border-[var(--border-default)] hover:bg-[var(--bg-surface-raised)]"
              >
                <td class="px-4 py-3 tabular-nums font-medium">
                  {{ formatMoney(pay.amount) }}
                </td>
                <td class="px-4 py-3 capitalize">
                  {{ pay.method.replace('_', ' ') }}
                </td>
                <td class="px-4 py-3 shell-text-muted">
                  {{ pay.reference || '—' }}
                </td>
                <td class="px-4 py-3">
                  <span
                    class="status-badge capitalize"
                    :class="`status-badge--payment-${pay.status}`"
                  >
                    {{ pay.status }}
                  </span>
                </td>
                <td class="px-4 py-3 shell-text-muted">
                  {{ new Date(pay.paidAt).toLocaleString() }}
                </td>
                <td class="px-4 py-3 text-right">
                  <template v-if="pay.status === 'pending' && canVerify">
                    <button
                      type="button"
                      class="btn-brand btn-sm mr-1"
                      :disabled="busyId === pay.id"
                      @click="verifyPayment(pay.id, 'verify')"
                    >
                      {{ busyId === pay.id ? '…' : 'Verify' }}
                    </button>
                    <button
                      type="button"
                      class="btn-danger btn-sm"
                      :disabled="busyId === pay.id"
                      @click="verifyPayment(pay.id, 'reject')"
                    >
                      Reject
                    </button>
                  </template>
                </td>
              </tr>
              <tr v-if="!payments.length">
                <td colspan="6" class="px-4 py-12 text-center shell-text-muted">
                  No payments in the queue.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Aging -->
      <section v-show="tab === 'aging'" class="mt-6">
        <div v-if="aging" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div class="shell-surface p-6">
            <p class="text-sm shell-text-muted">
              Current
            </p>
            <p class="display-title mt-2 text-2xl tabular-nums">
              {{ formatMoney(aging.current.amount) }}
            </p>
            <p class="mt-1 text-xs shell-text-muted">
              {{ aging.current.count }} invoice{{ aging.current.count === 1 ? '' : 's' }}
            </p>
          </div>
          <div class="shell-surface p-6">
            <p class="text-sm shell-text-muted">
              1–30 days
            </p>
            <p class="mt-2 text-2xl font-semibold tabular-nums">
              {{ formatMoney(aging.days30.amount) }}
            </p>
            <p class="mt-1 text-xs shell-text-muted">
              {{ aging.days30.count }} invoice{{ aging.days30.count === 1 ? '' : 's' }}
            </p>
          </div>
          <div class="shell-surface p-6">
            <p class="text-sm shell-text-muted">
              31–60 days
            </p>
            <p class="mt-2 text-2xl font-semibold tabular-nums">
              {{ formatMoney(aging.days60.amount) }}
            </p>
            <p class="mt-1 text-xs shell-text-muted">
              {{ aging.days60.count }} invoice{{ aging.days60.count === 1 ? '' : 's' }}
            </p>
          </div>
          <div class="shell-surface p-6">
            <p class="text-sm shell-text-muted">
              90+ days
            </p>
            <p class="mt-2 text-2xl font-semibold tabular-nums text-[var(--color-danger)]">
              {{ formatMoney(aging.days90Plus.amount) }}
            </p>
            <p class="mt-1 text-xs shell-text-muted">
              {{ aging.days90Plus.count }} invoice{{ aging.days90Plus.count === 1 ? '' : 's' }}
            </p>
          </div>
        </div>
        <div v-else class="shell-surface p-12 text-center shell-text-muted">
          Aging report unavailable.
        </div>
      </section>

      <!-- Clearances -->
      <section v-show="tab === 'clearances'" class="mt-6">
        <div class="shell-surface overflow-x-auto">
          <table class="w-full min-w-[40rem] text-left text-sm">
            <thead class="bg-[var(--bg-muted)]">
              <tr>
                <th class="px-4 py-3 font-medium">
                  Requester
                </th>
                <th class="px-4 py-3 font-medium">
                  Type
                </th>
                <th class="px-4 py-3 font-medium">
                  Purpose
                </th>
                <th class="px-4 py-3 font-medium">
                  Status
                </th>
                <th class="px-4 py-3 font-medium">
                  Requested
                </th>
                <th class="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="clr in clearances"
                :key="clr.id"
                class="border-t border-[var(--border-default)] hover:bg-[var(--bg-surface-raised)]"
              >
                <td class="px-4 py-3">
                  {{ clr.requesterName }}
                </td>
                <td class="px-4 py-3 capitalize">
                  {{ clr.type.replace(/_/g, ' ') }}
                </td>
                <td class="px-4 py-3 shell-text-muted">
                  {{ clr.purpose || '—' }}
                </td>
                <td class="px-4 py-3">
                  <span
                    class="status-badge capitalize"
                    :class="`status-badge--${clr.status === 'pending' ? 'pending' : clr.status}`"
                  >
                    {{ clr.status }}
                  </span>
                </td>
                <td class="px-4 py-3 shell-text-muted">
                  {{ new Date(clr.createdAt).toLocaleDateString() }}
                </td>
                <td class="px-4 py-3 text-right">
                  <template v-if="clr.status === 'pending' && canReviewClearance">
                    <button
                      type="button"
                      class="btn-brand btn-sm mr-1"
                      :disabled="busyId === clr.id"
                      @click="reviewClearance(clr.id, 'approved')"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      class="btn-quiet btn-sm mr-1"
                      :disabled="busyId === clr.id"
                      @click="reviewClearance(clr.id, 'issued')"
                    >
                      Issue
                    </button>
                    <button
                      type="button"
                      class="btn-danger btn-sm"
                      :disabled="busyId === clr.id"
                      @click="reviewClearance(clr.id, 'rejected')"
                    >
                      Reject
                    </button>
                  </template>
                </td>
              </tr>
              <tr v-if="!clearances.length">
                <td colspan="6" class="px-4 py-12 text-center shell-text-muted">
                  No clearance requests.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>
  </div>
</template>
