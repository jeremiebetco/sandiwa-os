<script setup lang="ts">
import type { Invoice, Payment, PaymentMethod, Unit } from '~/core/types'

definePageMeta({ layout: 'impact' })

const { slug } = useTenant()
const { t } = useTerminology()
const { to: tenantPath } = useTenantPath()

const units = ref<Unit[]>([])
const invoices = ref<Invoice[]>([])
const payments = ref<Payment[]>([])
const loading = ref(true)
const error = ref('')
const submitError = ref('')
const submitSuccess = ref('')
const submitting = ref(false)

const form = reactive({
  unitId: '',
  invoiceId: '',
  amount: '',
  method: 'gcash' as PaymentMethod,
  reference: ''
})

const openInvoices = computed(() =>
  invoices.value.filter(i => ['open', 'partial', 'overdue'].includes(i.status))
)

const balance = computed(() =>
  openInvoices.value.reduce((sum, inv) => {
    return sum + Number(inv.amount) + Number(inv.penaltyAmount) - Number(inv.amountPaid)
  }, 0)
)

function apiError(e: unknown): string {
  const err = e as { data?: { statusMessage?: string }, statusMessage?: string }
  return err?.data?.statusMessage || err?.statusMessage || 'Something went wrong. Try again.'
}

function formatMoney(value: string | number) {
  const n = Number(value)
  if (!Number.isFinite(n)) return String(value)
  return n.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })
}

async function loadStatement() {
  if (!slug.value) return
  loading.value = true
  error.value = ''
  try {
    const res = await $fetch<{
      units: Unit[]
      invoices: Invoice[]
      payments: Payment[]
    }>(`/api/tenants/${slug.value}/me/statement`)
    units.value = res.units
    invoices.value = res.invoices
    payments.value = res.payments
    if (!form.unitId && res.units[0]) form.unitId = res.units[0].id
  } catch (e) {
    error.value = apiError(e)
  } finally {
    loading.value = false
  }
}

watch(() => form.invoiceId, (id) => {
  if (!id) return
  const inv = invoices.value.find(i => i.id === id)
  if (!inv) return
  const remaining = Number(inv.amount) + Number(inv.penaltyAmount) - Number(inv.amountPaid)
  if (remaining > 0) form.amount = remaining.toFixed(2)
  form.unitId = inv.unitId
})

async function submitPayment() {
  if (!slug.value) return
  submitError.value = ''
  submitSuccess.value = ''
  if (!form.unitId || !form.amount || !form.method) {
    submitError.value = 'Unit, amount, and payment method are required.'
    return
  }
  submitting.value = true
  try {
    await $fetch(`/api/tenants/${slug.value}/payments`, {
      method: 'POST',
      body: {
        unitId: form.unitId,
        invoiceId: form.invoiceId || undefined,
        amount: form.amount,
        method: form.method,
        reference: form.reference || undefined
      }
    })
    submitSuccess.value = 'Payment submitted for verification.'
    form.reference = ''
    form.invoiceId = ''
    await loadStatement()
  } catch (e) {
    submitError.value = apiError(e)
  } finally {
    submitting.value = false
  }
}

onMounted(loadStatement)
</script>

<template>
  <div class="mx-auto max-w-2xl space-y-8">
    <div>
      <NuxtLink :to="tenantPath('/portal')" class="text-sm text-[var(--bg-accent)] hover:underline">
        ← Member home
      </NuxtLink>
      <h2 class="display-title mt-4 text-3xl">
        Statement of account
      </h2>
      <p class="shell-text-muted">
        {{ t('modules.payments.description') }}
      </p>
      <div class="mt-3">
        <ListenButton
          :text="`Open balance ${formatMoney(balance)}. ${openInvoices.length} open invoices.`"
        />
      </div>
    </div>

    <div v-if="loading" class="space-y-3" aria-busy="true">
      <div class="shell-surface h-24 animate-pulse bg-[var(--bg-muted)]" />
      <div class="shell-surface h-40 animate-pulse bg-[var(--bg-muted)]" />
    </div>

    <div v-else-if="error" class="shell-surface p-8 text-center" role="alert">
      <p class="text-[var(--color-danger)]">
        {{ error }}
      </p>
      <button type="button" class="btn-brand mt-4" @click="loadStatement">
        Retry
      </button>
    </div>

    <template v-else>
      <div class="stat-card">
        <p class="text-sm shell-text-muted">
          Open balance
        </p>
        <p class="display-title relative z-[1] mt-1 text-3xl tabular-nums text-[var(--action-payments)] md:text-4xl">
          {{ formatMoney(balance) }}
        </p>
        <p v-if="units.length" class="mt-2 text-sm shell-text-muted">
          Unit{{ units.length > 1 ? 's' : '' }}: {{ units.map(u => u.code).join(', ') }}
        </p>
        <p v-else class="mt-2 text-sm shell-text-muted">
          No unit is linked to your account yet.
        </p>
      </div>

      <section>
        <h3 class="text-lg font-semibold">
          Invoices
        </h3>
        <ul v-if="invoices.length" class="mt-3 space-y-2">
          <li
            v-for="inv in invoices"
            :key="inv.id"
            class="shell-surface shell-float flex flex-wrap items-center justify-between gap-2 p-4"
          >
            <div>
              <p class="font-medium">
                {{ inv.description }}
              </p>
              <p class="flex flex-wrap items-center gap-2 text-xs shell-text-muted">
                <span>{{ inv.period }} · Due {{ inv.dueDate }}</span>
                <span
                  class="status-badge capitalize"
                  :class="`status-badge--invoice-${inv.status}`"
                >
                  {{ inv.status }}
                </span>
              </p>
            </div>
            <p class="tabular-nums font-semibold">
              {{ formatMoney(Number(inv.amount) + Number(inv.penaltyAmount) - Number(inv.amountPaid)) }}
            </p>
          </li>
        </ul>
        <p v-else class="mt-3 shell-text-muted">
          No invoices on your statement.
        </p>
      </section>

      <form class="shell-glass shell-glass--strong shell-float space-y-4 p-6" @submit.prevent="submitPayment">
        <h3 class="font-semibold">
          Submit payment
        </h3>
        <UFormField label="Invoice (optional)">
          <USelect
            v-model="form.invoiceId"
            :items="[
              { label: 'No specific invoice', value: '' },
              ...openInvoices.map(i => ({
                label: `${i.description} — ${formatMoney(Number(i.amount) + Number(i.penaltyAmount) - Number(i.amountPaid))}`,
                value: i.id
              }))
            ]"
            class="w-full"
          />
        </UFormField>
        <UFormField v-if="units.length > 1" :label="t('fields.unit.label', 'Unit')">
          <USelect
            v-model="form.unitId"
            :items="units.map(u => ({ label: u.code, value: u.id }))"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Amount">
          <UInput v-model="form.amount" type="number" min="0" step="0.01" class="w-full" />
        </UFormField>
        <UFormField label="Method">
          <USelect
            v-model="form.method"
            :items="[
              { label: 'GCash', value: 'gcash' },
              { label: 'Maya', value: 'maya' },
              { label: 'Bank transfer', value: 'bank_transfer' }
            ]"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Reference number">
          <UInput v-model="form.reference" placeholder="Transaction / reference ID" class="w-full" />
        </UFormField>
        <p v-if="submitError" class="text-sm text-[var(--color-danger)]" role="alert">
          {{ submitError }}
        </p>
        <p v-if="submitSuccess" class="text-sm text-[var(--color-success)]" role="status">
          {{ submitSuccess }}
        </p>
        <button type="submit" class="btn-brand w-full" :disabled="submitting || !units.length">
          {{ submitting ? 'Submitting…' : 'Submit payment' }}
        </button>
      </form>

      <section>
        <h3 class="text-lg font-semibold">
          Recent payments
        </h3>
        <ul v-if="payments.length" class="mt-3 space-y-2">
          <li v-for="pay in payments" :key="pay.id" class="shell-surface p-4">
            <div class="flex justify-between gap-2">
              <p class="font-medium tabular-nums">
                {{ formatMoney(pay.amount) }}
              </p>
              <span
                class="status-badge capitalize"
                :class="`status-badge--payment-${pay.status}`"
              >
                {{ pay.status }}
              </span>
            </div>
            <p class="mt-1 text-xs shell-text-muted capitalize">
              {{ pay.method.replace('_', ' ') }}
              <template v-if="pay.reference">
                · {{ pay.reference }}
              </template>
              · {{ new Date(pay.paidAt).toLocaleString() }}
            </p>
          </li>
        </ul>
        <p v-else class="mt-3 shell-text-muted">
          No payments submitted yet.
        </p>
      </section>
    </template>
  </div>
</template>
