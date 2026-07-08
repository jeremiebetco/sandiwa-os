<script setup lang="ts">
import type { Announcement } from '~/core/types'
import { sanitizeText } from '~/core/utils/sanitize'

definePageMeta({ layout: 'console' })

const { organization } = useTenant()
const { user } = useAuth()
const platform = usePlatformStore()

const announcements = computed(() => {
  if (!organization.value) return []
  return platform.getAnnouncements(organization.value.id)
})

const showForm = ref(false)
const editing = ref<Announcement | null>(null)
const form = reactive({ title: '', body: '' })
const formError = ref('')

function openCreate() {
  editing.value = null
  form.title = ''
  form.body = ''
  formError.value = ''
  showForm.value = true
}

function openEdit(item: Announcement) {
  editing.value = item
  form.title = item.title
  form.body = item.body
  formError.value = ''
  showForm.value = true
}

function save() {
  if (!organization.value || !user.value) return
  if (!form.title.trim() || !form.body.trim()) {
    formError.value = 'Title and body are required.'
    return
  }
  const item: Announcement = {
    id: editing.value?.id ?? `ann-${crypto.randomUUID().slice(0, 8)}`,
    organizationId: organization.value.id,
    title: sanitizeText(form.title, 200),
    body: sanitizeText(form.body),
    publishedAt: editing.value?.publishedAt ?? new Date().toISOString(),
    authorId: user.value.id
  }
  platform.upsertAnnouncement(item)
  showForm.value = false
}

function remove(id: string) {
  platform.deleteAnnouncement(id)
}
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <h2 class="text-2xl font-semibold">
        Announcements
      </h2>
      <UButton @click="openCreate">
        New announcement
      </UButton>
    </div>

    <div v-if="showForm" class="shell-surface mb-6 p-6">
      <h3 class="font-semibold">
        {{ editing ? 'Edit' : 'Create' }} announcement
      </h3>
      <form class="mt-4 space-y-4" @submit.prevent="save">
        <UFormField label="Title">
          <UInput v-model="form.title" class="w-full" />
        </UFormField>
        <UFormField label="Body">
          <UTextarea v-model="form.body" :rows="4" class="w-full" />
        </UFormField>
        <p v-if="formError" class="text-sm text-[var(--color-danger)]">
          {{ formError }}
        </p>
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
            <th class="px-4 py-3 font-medium">
              Title
            </th>
            <th class="px-4 py-3 font-medium">
              Published
            </th>
            <th class="px-4 py-3 font-medium" />
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in announcements"
            :key="item.id"
            class="border-t border-[var(--border-default)] hover:bg-[var(--bg-surface-raised)]"
          >
            <td class="px-4 py-3">
              {{ item.title }}
            </td>
            <td class="px-4 py-3 shell-text-muted">
              {{ new Date(item.publishedAt).toLocaleDateString() }}
            </td>
            <td class="px-4 py-3 text-right">
              <UButton size="xs" variant="ghost" @click="openEdit(item)">
                Edit
              </UButton>
              <UButton size="xs" variant="ghost" color="error" @click="remove(item.id)">
                Delete
              </UButton>
            </td>
          </tr>
          <tr v-if="!announcements.length">
            <td colspan="3" class="px-4 py-12 text-center shell-text-muted">
              No announcements yet.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
