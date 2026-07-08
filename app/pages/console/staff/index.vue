<script setup lang="ts">
import type { OrgRole, OrgUser } from '~/core/types'
import { sanitizeText } from '~/core/utils/sanitize'

definePageMeta({ layout: 'console' })

const { organization } = useTenant()
const { t } = useTerminology()
const platform = usePlatformStore()

const staff = computed(() => {
  if (!organization.value) return []
  return platform.getOrgUsers(organization.value.id).filter(u => u.role !== 'member')
})

const roles: OrgRole[] = ['org_admin', 'manager', 'committee_lead', 'staff']

const showForm = ref(false)
const editing = ref<OrgUser | null>(null)
const form = reactive({
  name: '',
  email: '',
  password: 'demo1234',
  role: 'staff' as OrgRole
})

function openCreate() {
  editing.value = null
  form.name = ''
  form.email = ''
  form.password = 'demo1234'
  form.role = 'staff'
  showForm.value = true
}

function openEdit(user: OrgUser) {
  editing.value = user
  form.name = user.name
  form.email = user.email
  form.password = user.password
  form.role = user.role
  showForm.value = true
}

function save() {
  if (!organization.value) return
  const user: OrgUser = {
    id: editing.value?.id ?? `user-${crypto.randomUUID().slice(0, 8)}`,
    organizationId: organization.value.id,
    name: sanitizeText(form.name, 100),
    email: form.email.trim().toLowerCase(),
    password: form.password,
    role: form.role,
    status: 'active'
  }
  platform.upsertOrgUser(user)
  showForm.value = false
}

function remove(id: string) {
  platform.deleteOrgUser(id)
}
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <h2 class="text-2xl font-semibold">
        Staff management
      </h2>
      <UButton @click="openCreate">
        Add staff
      </UButton>
    </div>

    <div v-if="showForm" class="shell-surface mb-6 p-6">
      <form class="space-y-4" @submit.prevent="save">
        <UFormField label="Name">
          <UInput v-model="form.name" class="w-full" />
        </UFormField>
        <UFormField label="Email">
          <UInput v-model="form.email" type="email" class="w-full" />
        </UFormField>
        <UFormField label="Password">
          <UInput v-model="form.password" type="password" class="w-full" />
        </UFormField>
        <UFormField label="Role">
          <USelect
            v-model="form.role"
            :items="roles.map(r => ({ label: t(`roles.${r}.label`, r), value: r }))"
            class="w-full"
          />
        </UFormField>
        <div class="flex gap-2">
          <UButton type="submit">
            Save
          </UButton>
          <UButton variant="ghost" @click="showForm = false">
            Cancel
          </UButton>
        </div>
      </form>
    </div>

    <div class="shell-surface overflow-hidden">
      <table class="w-full text-left text-sm">
        <thead class="bg-[var(--bg-muted)]">
          <tr>
            <th class="px-4 py-3">
              Name
            </th>
            <th class="px-4 py-3">
              Email
            </th>
            <th class="px-4 py-3">
              Role
            </th>
            <th class="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="user in staff"
            :key="user.id"
            class="border-t border-[var(--border-default)]"
          >
            <td class="px-4 py-3">
              {{ user.name }}
            </td>
            <td class="px-4 py-3 shell-text-muted">
              {{ user.email }}
            </td>
            <td class="px-4 py-3">
              {{ t(`roles.${user.role}.label`, user.role) }}
            </td>
            <td class="px-4 py-3 text-right">
              <UButton size="xs" variant="ghost" @click="openEdit(user)">
                Edit
              </UButton>
              <UButton size="xs" variant="ghost" color="error" @click="remove(user.id)">
                Remove
              </UButton>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
