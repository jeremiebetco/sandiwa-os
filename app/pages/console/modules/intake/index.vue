<script setup lang="ts">
import type { IntakeCase, IntakeStatus, OrgRole } from '~/core/types'
import { canManageIntakeCase, canViewAllIntakeCases } from '~/core/rbac/permissions'
import { sanitizeText } from '~/core/utils/sanitize'

definePageMeta({ layout: 'console' })

const { slug } = useTenant()
const { user } = useAuth()
const { t } = useTerminology()
const platform = usePlatformStore()

const loading = ref(true)
const error = ref('')
const statusFilter = ref<IntakeStatus | 'all'>('all')
const selectedCase = ref<IntakeCase | null>(null)
const resolutionNotes = ref('')

const allCases = computed(() => platform.intakeCases)

const visibleCases = computed(() => {
  const role = user.value?.role as OrgRole
  const uid = user.value?.id
  let list = allCases.value
  if (!canViewAllIntakeCases(role)) {
    list = list.filter(c => c.assignedToId === uid || c.status === 'open')
  }
  if (statusFilter.value !== 'all') {
    list = list.filter(c => c.status === statusFilter.value)
  }
  return list
})

const staffOptions = computed(() =>
  platform.orgUsers.filter(u => u.role !== 'member')
)

onMounted(async () => {
  if (!slug.value) return
  loading.value = true
  error.value = ''
  try {
    await Promise.all([
      platform.fetchIntakeCases(slug.value),
      platform.fetchOrgUsers(slug.value)
    ])
  } catch {
    error.value = 'Failed to load intake queue.'
  } finally {
    loading.value = false
  }
})

function openCase(item: IntakeCase) {
  const role = user.value?.role as OrgRole
  if (!canManageIntakeCase(role, item.assignedToId, user.value?.id)) return
  selectedCase.value = item
  resolutionNotes.value = item.resolutionNotes ?? ''
}

async function assignTo(staffId: string) {
  if (!selectedCase.value || !slug.value) return
  const staff = staffOptions.value.find(s => s.id === staffId)
  try {
    const updated = await platform.upsertIntakeCase(slug.value, {
      id: selectedCase.value.id,
      description: selectedCase.value.description,
      category: selectedCase.value.category,
      assignedToId: staffId,
      assignedToName: staff?.name,
      status: 'in_progress'
    })
    selectedCase.value = updated
  } catch {
    error.value = 'Failed to assign case.'
  }
}

async function updateStatus(status: IntakeStatus) {
  if (!selectedCase.value || !slug.value) return
  try {
    const updated = await platform.upsertIntakeCase(slug.value, {
      id: selectedCase.value.id,
      description: selectedCase.value.description,
      category: selectedCase.value.category,
      status,
      resolutionNotes: sanitizeText(resolutionNotes.value)
    })
    selectedCase.value = updated
  } catch {
    error.value = 'Failed to update case status.'
  }
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h2 class="display-title text-3xl">
        {{ t('modules.intake.navLabel') }} queue
      </h2>
      <p class="mt-1 text-sm text-[var(--text-muted)]">
        Triage member requests and assign staff.
      </p>
    </div>
    <p v-if="error" class="text-sm text-[var(--color-danger)]" role="alert">
      {{ error }}
    </p>
    <div class="flex gap-2">
      <USelect
        v-model="statusFilter"
        :items="[
          { label: 'All', value: 'all' },
          { label: 'Open', value: 'open' },
          { label: 'In progress', value: 'in_progress' },
          { label: 'Resolved', value: 'resolved' }
        ]"
        class="w-40"
      />
    </div>

    <div v-if="loading" class="mt-6 shell-surface p-8 text-center shell-text-muted">
      Loading intake queue…
    </div>

    <div v-else class="mt-6 grid gap-6 lg:grid-cols-2">
      <div class="shell-surface overflow-hidden">
        <table class="w-full text-left text-sm">
          <thead class="bg-[var(--bg-muted)]">
            <tr>
              <th class="px-4 py-3">
                Member
              </th>
              <th class="px-4 py-3">
                Status
              </th>
              <th class="px-4 py-3">
                Sentiment
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in visibleCases"
              :key="item.id"
              class="cursor-pointer border-t border-[var(--border-default)] hover:bg-[var(--bg-surface-raised)]"
              :class="{ 'bg-[var(--bg-surface-raised)]': selectedCase?.id === item.id }"
              @click="openCase(item)"
            >
              <td class="px-4 py-3">
                <p class="font-medium">
                  {{ item.memberName }}
                </p>
                <p class="text-xs shell-text-muted line-clamp-1">
                  {{ item.description }}
                </p>
              </td>
              <td class="px-4 py-3">
                <span
                  class="status-badge capitalize"
                  :class="`status-badge--${item.status === 'in_progress' ? 'pending' : item.status}`"
                >
                  {{ item.status.replace('_', ' ') }}
                </span>
              </td>
              <td class="px-4 py-3 capitalize">
                {{ item.sentiment }}
              </td>
            </tr>
            <tr v-if="!visibleCases.length">
              <td colspan="3" class="px-4 py-12 text-center shell-text-muted">
                No cases in queue.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="selectedCase" class="shell-surface p-6">
        <h3 class="font-semibold">
          Case detail
        </h3>
        <p class="mt-2 text-sm shell-text-muted">
          {{ selectedCase.memberName }} · {{ selectedCase.unit }}
        </p>
        <p class="mt-4 whitespace-pre-wrap">
          {{ selectedCase.description }}
        </p>
        <div class="mt-4 space-y-3">
          <UFormField label="Assign to">
            <USelect
              :model-value="selectedCase.assignedToId"
              :items="staffOptions.map(s => ({ label: s.name, value: s.id }))"
              class="w-full"
              @update:model-value="assignTo($event as string)"
            />
          </UFormField>
          <UFormField label="Resolution notes">
            <UTextarea v-model="resolutionNotes" :rows="3" class="w-full" />
          </UFormField>
          <div class="flex flex-wrap gap-2">
            <button type="button" class="btn-brand btn-sm" @click="updateStatus('in_progress')">
              In progress
            </button>
            <button type="button" class="btn-quiet btn-sm" @click="updateStatus('resolved')">
              Resolved
            </button>
            <button type="button" class="btn-quiet btn-sm" @click="updateStatus('closed')">
              Close
            </button>
          </div>
        </div>
      </div>
      <div v-else class="shell-surface flex items-center justify-center p-12 shell-text-muted">
        Select a case to manage
      </div>
    </div>
  </div>
</template>
