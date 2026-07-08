<script setup lang="ts">
import type { IntakeCase, IntakeStatus, OrgRole } from '~/core/types'
import { canManageIntakeCase, canViewAllIntakeCases } from '~/core/rbac/permissions'
import { sanitizeText } from '~/core/utils/sanitize'

definePageMeta({ layout: 'console' })

const { organization } = useTenant()
const { user } = useAuth()
const { t } = useTerminology()
const platform = usePlatformStore()

const statusFilter = ref<IntakeStatus | 'all'>('all')
const selectedCase = ref<IntakeCase | null>(null)
const resolutionNotes = ref('')

const allCases = computed(() => {
  if (!organization.value) return []
  return platform.getIntakeCases(organization.value.id)
})

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

const staffOptions = computed(() => {
  if (!organization.value) return []
  return platform.getOrgUsers(organization.value.id).filter(u => u.role !== 'member')
})

function openCase(item: IntakeCase) {
  const role = user.value?.role as OrgRole
  if (!canManageIntakeCase(role, item.assignedToId, user.value?.id)) return
  selectedCase.value = item
  resolutionNotes.value = item.resolutionNotes ?? ''
}

function assignTo(staffId: string) {
  if (!selectedCase.value) return
  const staff = staffOptions.value.find(s => s.id === staffId)
  const updated: IntakeCase = {
    ...selectedCase.value,
    assignedToId: staffId,
    assignedToName: staff?.name,
    status: 'in_progress',
    updatedAt: new Date().toISOString()
  }
  platform.upsertIntakeCase(updated)
  selectedCase.value = updated
}

function updateStatus(status: IntakeStatus) {
  if (!selectedCase.value) return
  const updated: IntakeCase = {
    ...selectedCase.value,
    status,
    resolutionNotes: sanitizeText(resolutionNotes.value),
    updatedAt: new Date().toISOString()
  }
  platform.upsertIntakeCase(updated)
  selectedCase.value = updated
}
</script>

<template>
  <div>
    <h2 class="text-2xl font-semibold">
      {{ t('modules.intake.navLabel') }} queue
    </h2>
    <div class="mt-4 flex gap-2">
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

    <div class="mt-6 grid gap-6 lg:grid-cols-2">
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
              <td class="px-4 py-3 capitalize">
                {{ item.status.replace('_', ' ') }}
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
            <UButton size="sm" @click="updateStatus('in_progress')">
              In progress
            </UButton>
            <UButton size="sm" @click="updateStatus('resolved')">
              Resolved
            </UButton>
            <UButton size="sm" variant="outline" @click="updateStatus('closed')">
              Close
            </UButton>
          </div>
        </div>
      </div>
      <div v-else class="shell-surface flex items-center justify-center p-12 shell-text-muted">
        Select a case to manage
      </div>
    </div>
  </div>
</template>
