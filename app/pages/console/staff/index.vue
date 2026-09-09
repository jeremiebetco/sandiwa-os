<script setup lang="ts">
import type { OrgRole, OrgUser } from '~/core/types'
import { sanitizeText } from '~/core/utils/sanitize'

definePageMeta({ layout: 'console' })

const { organization, slug } = useTenant()
const { t } = useTerminology()
const platform = usePlatformStore()

const loading = ref(true)
const error = ref('')
const saving = ref(false)

const staff = computed(() =>
  platform.orgUsers.filter(u => u.role !== 'member')
)

const roles: OrgRole[] = ['org_admin', 'manager', 'committee_lead', 'staff']

const showForm = ref(false)
const editing = ref<OrgUser | null>(null)
const form = reactive({
  name: '',
  email: '',
  password: '',
  role: 'staff' as OrgRole
})

onMounted(async () => {
  if (!slug.value) return
  loading.value = true
  error.value = ''
  try {
    await platform.fetchOrgUsers(slug.value)
  } catch {
    error.value = 'Failed to load staff.'
  } finally {
    loading.value = false
  }
})

function openCreate() {
  editing.value = null
  form.name = ''
  form.email = ''
  form.password = ''
  form.role = 'staff'
  showForm.value = true
}

function openEdit(user: OrgUser) {
  editing.value = user
  form.name = user.name
  form.email = user.email
  form.password = ''
  form.role = user.role
  showForm.value = true
}

async function save() {
  if (!slug.value || !organization.value) return
  if (!editing.value && (!form.password || form.password.length < 8)) {
    error.value = 'Password required (min 8 characters) for new staff.'
    return
  }
  saving.value = true
  error.value = ''
  try {
    const payload: OrgUser & { password?: string } = {
      id: editing.value?.id ?? `user-${crypto.randomUUID().slice(0, 8)}`,
      organizationId: organization.value.id,
      name: sanitizeText(form.name, 100),
      email: form.email.trim().toLowerCase(),
      role: form.role,
      status: editing.value?.status ?? 'active'
    }
    if (form.password) {
      payload.password = form.password
    }
    await platform.upsertOrgUser(slug.value, payload)
    showForm.value = false
  } catch (e: unknown) {
    const err = e as { data?: { statusMessage?: string }, statusMessage?: string }
    error.value = err?.data?.statusMessage || err?.statusMessage || 'Failed to save staff user.'
  } finally {
    saving.value = false
  }
}

async function remove(id: string) {
  if (!slug.value) return
  try {
    await platform.deleteOrgUser(slug.value, id)
  } catch {
    error.value = 'Failed to remove staff user.'
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h2 class="display-title text-3xl">
          Staff management
        </h2>
        <p class="mt-1 text-sm text-[var(--text-muted)]">
          Roles and access for {{ organization?.name }}.
        </p>
      </div>
      <button type="button" class="btn-brand" @click="openCreate">
        Add staff
      </button>
    </div>

    <p v-if="error" class="mb-4 text-sm text-[var(--color-danger)]" role="alert">
      {{ error }}
    </p>

    <div v-if="showForm" class="shell-surface mb-6 p-6">
      <form class="space-y-4" @submit.prevent="save">
        <UFormField label="Name">
          <UInput v-model="form.name" class="w-full" />
        </UFormField>
        <UFormField label="Email">
          <UInput v-model="form.email" type="email" class="w-full" />
        </UFormField>
        <UFormField :label="editing ? 'Password (leave blank to keep)' : 'Password'">
          <UInput v-model="form.password" type="password" class="w-full" :required="!editing" />
        </UFormField>
        <UFormField label="Role">
          <USelect
            v-model="form.role"
            :items="roles.map(r => ({ label: t(`roles.${r}.label`, r), value: r }))"
            class="w-full"
          />
        </UFormField>
        <div class="flex gap-2">
          <button type="submit" class="btn-brand" :disabled="saving">
            {{ saving ? 'Saving…' : 'Save' }}
          </button>
          <button type="button" class="btn-quiet" @click="showForm = false">
            Cancel
          </button>
        </div>
      </form>
    </div>

    <div v-if="loading" class="shell-surface p-8 text-center shell-text-muted">
      Loading staff…
    </div>

    <div v-else class="shell-surface overflow-hidden">
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
              <button type="button" class="btn-quiet btn-sm mr-1" @click="openEdit(user)">
                Edit
              </button>
              <button type="button" class="btn-danger btn-sm" @click="remove(user.id)">
                Remove
              </button>
            </td>
          </tr>
          <tr v-if="!staff.length">
            <td colspan="4" class="px-4 py-12 text-center shell-text-muted">
              No staff users yet.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
