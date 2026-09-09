<script setup lang="ts">
import type { DisbursementVoucher, LedgerAccount, LedgerEntry, OrgRole } from '~/core/types'
import { canPerformAction } from '~/core/rbac/permissions'

definePageMeta({ layout: 'console' })

const { slug } = useTenant()
const { user } = useAuth()
const { t } = useTerminology()

type Tab = 'accounts' | 'entries' | 'vouchers'
const tab = ref<Tab>('accounts')

const accounts = ref<LedgerAccount[]>([])
const entries = ref<LedgerEntry[]>([])
const vouchers = ref<DisbursementVoucher[]>([])

const loading = ref(true)
const error = ref('')
const actionError = ref('')
const actionSuccess = ref('')
const busyId = ref<string | null>(null)
const creating = ref(false)

const voucherForm = reactive({
  accountId: '',
  payee: '',
  description: '',
  amount: '',
  status: 'pending_approval' as 'draft' | 'pending_approval'
})

const canApprove = computed(() =>
  user.value ? canPerformAction(user.value.role as OrgRole, 'voucher.approve') : false
)

const accountNameById = computed(() => {
  const map = new Map<string, string>()
  for (const a of accounts.value) map.set(a.id, `${a.code} — ${a.name}`)
  return map
})

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
    const base = `/api/tenants/${slug.value}/ledger`
    const [acctRes, entryRes, voucherRes] = await Promise.all([
      $fetch<{ accounts: LedgerAccount[] }>(`${base}/accounts`),
      $fetch<{ entries: LedgerEntry[] }>(`${base}/entries`),
      $fetch<{ vouchers: DisbursementVoucher[] }>(`${base}/vouchers`)
    ])
    accounts.value = acctRes.accounts
    entries.value = entryRes.entries
    vouchers.value = voucherRes.vouchers
    if (!voucherForm.accountId) {
      const expense = accounts.value.find(a => a.accountType === 'expense') || accounts.value[0]
      if (expense) voucherForm.accountId = expense.id
    }
  } catch (e) {
    error.value = apiError(e)
  } finally {
    loading.value = false
  }
}

async function createVoucher() {
  if (!slug.value) return
  actionError.value = ''
  actionSuccess.value = ''
  if (!voucherForm.payee.trim() || !voucherForm.description.trim() || !voucherForm.amount) {
    actionError.value = 'Payee, description, and amount are required.'
    return
  }
  creating.value = true
  try {
    await $fetch(`/api/tenants/${slug.value}/ledger/vouchers`, {
      method: 'POST',
      body: { ...voucherForm }
    })
    actionSuccess.value = 'Disbursement voucher created.'
    voucherForm.payee = ''
    voucherForm.description = ''
    voucherForm.amount = ''
    await loadAll()
    tab.value = 'vouchers'
  } catch (e) {
    actionError.value = apiError(e)
  } finally {
    creating.value = false
  }
}

async function approveVoucher(id: string) {
  if (!slug.value || !canApprove.value) return
  actionError.value = ''
  actionSuccess.value = ''
  busyId.value = id
  try {
    await $fetch(`/api/tenants/${slug.value}/ledger/vouchers/${id}/approve`, { method: 'POST' })
    actionSuccess.value = 'Voucher approved.'
    await loadAll()
  } catch (e) {
    actionError.value = apiError(e)
  } finally {
    busyId.value = null
  }
}

onMounted(loadAll)

const tabs: { key: Tab, label: string }[] = [
  { key: 'accounts', label: 'Chart of accounts' },
  { key: 'entries', label: 'Ledger entries' },
  { key: 'vouchers', label: 'Disbursements' }
]
</script>

<template>
  <div>
    <h2 class="display-title text-3xl">
      {{ t('modules.ledger.navLabel') }}
    </h2>
    <p class="mt-1 text-sm shell-text-muted">
      {{ t('modules.ledger.description') }}
    </p>

    <div class="mt-6 flex flex-wrap gap-2" role="tablist" aria-label="Ledger sections">
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

    <div v-if="loading" class="mt-6 space-y-3" aria-busy="true">
      <div v-for="n in 4" :key="n" class="shell-surface h-14 animate-pulse bg-[var(--bg-muted)]" />
    </div>

    <div v-else-if="error" class="mt-6 shell-surface p-8 text-center" role="alert">
      <p class="text-[var(--color-danger)]">
        {{ error }}
      </p>
      <button type="button" class="btn-brand mt-4" @click="loadAll">
        Retry
      </button>
    </div>

    <template v-else>
      <section v-show="tab === 'accounts'" class="mt-6">
        <div class="shell-surface overflow-x-auto">
          <table class="w-full min-w-[32rem] text-left text-sm">
            <thead class="bg-[var(--bg-muted)]">
              <tr>
                <th class="px-4 py-3 font-medium">
                  Code
                </th>
                <th class="px-4 py-3 font-medium">
                  Name
                </th>
                <th class="px-4 py-3 font-medium">
                  Type
                </th>
                <th class="px-4 py-3 font-medium">
                  Fund
                </th>
                <th class="px-4 py-3 font-medium">
                  Active
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="acct in accounts"
                :key="acct.id"
                class="border-t border-[var(--border-default)] hover:bg-[var(--bg-surface-raised)]"
              >
                <td class="px-4 py-3 tabular-nums font-medium">
                  {{ acct.code }}
                </td>
                <td class="px-4 py-3">
                  {{ acct.name }}
                </td>
                <td class="px-4 py-3 capitalize">
                  {{ acct.accountType }}
                </td>
                <td class="px-4 py-3 shell-text-muted">
                  {{ acct.fundCategory || '—' }}
                </td>
                <td class="px-4 py-3">
                  {{ acct.active ? 'Yes' : 'No' }}
                </td>
              </tr>
              <tr v-if="!accounts.length">
                <td colspan="5" class="px-4 py-12 text-center shell-text-muted">
                  No accounts configured.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section v-show="tab === 'entries'" class="mt-6">
        <div class="shell-surface overflow-x-auto">
          <table class="w-full min-w-[40rem] text-left text-sm">
            <thead class="bg-[var(--bg-muted)]">
              <tr>
                <th class="px-4 py-3 font-medium">
                  Date
                </th>
                <th class="px-4 py-3 font-medium">
                  Account
                </th>
                <th class="px-4 py-3 font-medium">
                  Description
                </th>
                <th class="px-4 py-3 font-medium">
                  Debit
                </th>
                <th class="px-4 py-3 font-medium">
                  Credit
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="entry in entries"
                :key="entry.id"
                class="border-t border-[var(--border-default)] hover:bg-[var(--bg-surface-raised)]"
              >
                <td class="px-4 py-3 shell-text-muted">
                  {{ entry.entryDate }}
                </td>
                <td class="px-4 py-3">
                  {{ accountNameById.get(entry.accountId) || entry.accountId }}
                </td>
                <td class="px-4 py-3">
                  {{ entry.description }}
                </td>
                <td class="px-4 py-3 tabular-nums">
                  {{ Number(entry.debit) > 0 ? formatMoney(entry.debit) : '—' }}
                </td>
                <td class="px-4 py-3 tabular-nums">
                  {{ Number(entry.credit) > 0 ? formatMoney(entry.credit) : '—' }}
                </td>
              </tr>
              <tr v-if="!entries.length">
                <td colspan="5" class="px-4 py-12 text-center shell-text-muted">
                  No ledger entries yet.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section v-show="tab === 'vouchers'" class="mt-6 space-y-6">
        <div class="shell-surface p-6">
          <h3 class="font-semibold">
            New disbursement voucher
          </h3>
          <form class="mt-4 grid gap-4 sm:grid-cols-2" @submit.prevent="createVoucher">
            <UFormField label="Expense account">
              <USelect
                v-model="voucherForm.accountId"
                :items="accounts.map(a => ({ label: `${a.code} — ${a.name}`, value: a.id }))"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Amount">
              <UInput v-model="voucherForm.amount" type="number" min="0" step="0.01" class="w-full" />
            </UFormField>
            <UFormField label="Payee">
              <UInput v-model="voucherForm.payee" class="w-full" />
            </UFormField>
            <UFormField label="Submit as">
              <USelect
                v-model="voucherForm.status"
                :items="[
                  { label: 'Pending approval', value: 'pending_approval' },
                  { label: 'Draft', value: 'draft' }
                ]"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Description" class="sm:col-span-2">
              <UTextarea v-model="voucherForm.description" :rows="2" class="w-full" />
            </UFormField>
            <div class="sm:col-span-2">
              <button type="submit" class="btn-brand" :disabled="creating">
                {{ creating ? 'Creating…' : 'Create voucher' }}
              </button>
            </div>
          </form>
        </div>

        <div class="shell-surface overflow-x-auto">
          <table class="w-full min-w-[40rem] text-left text-sm">
            <thead class="bg-[var(--bg-muted)]">
              <tr>
                <th class="px-4 py-3 font-medium">
                  Payee
                </th>
                <th class="px-4 py-3 font-medium">
                  Description
                </th>
                <th class="px-4 py-3 font-medium">
                  Amount
                </th>
                <th class="px-4 py-3 font-medium">
                  Status
                </th>
                <th class="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="voucher in vouchers"
                :key="voucher.id"
                class="border-t border-[var(--border-default)] hover:bg-[var(--bg-surface-raised)]"
              >
                <td class="px-4 py-3 font-medium">
                  {{ voucher.payee }}
                </td>
                <td class="px-4 py-3">
                  {{ voucher.description }}
                </td>
                <td class="px-4 py-3 tabular-nums">
                  {{ formatMoney(voucher.amount) }}
                </td>
                <td class="px-4 py-3">
                  <span
                    class="status-badge capitalize"
                    :class="`status-badge--voucher-${voucher.status === 'pending_approval' ? 'pending' : voucher.status}`"
                  >
                    {{ voucher.status.replace(/_/g, ' ') }}
                  </span>
                </td>
                <td class="px-4 py-3 text-right">
                  <button
                    v-if="canApprove && (voucher.status === 'pending_approval' || voucher.status === 'draft')"
                    type="button"
                    class="btn-brand btn-sm"
                    :disabled="busyId === voucher.id"
                    @click="approveVoucher(voucher.id)"
                  >
                    {{ busyId === voucher.id ? '…' : 'Approve' }}
                  </button>
                </td>
              </tr>
              <tr v-if="!vouchers.length">
                <td colspan="5" class="px-4 py-12 text-center shell-text-muted">
                  No disbursement vouchers yet.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>
  </div>
</template>
