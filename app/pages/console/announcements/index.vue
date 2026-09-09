<script setup lang="ts">
import type { Announcement } from '~/core/types'
import { sanitizeText } from '~/core/utils/sanitize'

definePageMeta({ layout: 'console' })

const { slug } = useTenant()
const { user } = useAuth()
const platform = usePlatformStore()

const loading = ref(true)
const error = ref('')
const saving = ref(false)

const announcements = computed(() => platform.announcements)

const showForm = ref(false)
const editing = ref<Announcement | null>(null)
const form = reactive({ title: '', body: '' })
const formError = ref('')

onMounted(async () => {
  if (!slug.value) return
  loading.value = true
  error.value = ''
  try {
    await platform.fetchAnnouncements(slug.value)
  } catch {
    error.value = 'Failed to load announcements.'
  } finally {
    loading.value = false
  }
})

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

async function save() {
  if (!slug.value || !user.value) return
  if (!form.title.trim() || !form.body.trim()) {
    formError.value = 'Title and body are required.'
    return
  }
  saving.value = true
  formError.value = ''
  try {
    await platform.upsertAnnouncement(slug.value, {
      id: editing.value?.id,
      title: sanitizeText(form.title, 200),
      body: sanitizeText(form.body)
    })
    showForm.value = false
  } catch (e: unknown) {
    const err = e as { data?: { statusMessage?: string }, statusMessage?: string }
    formError.value = err?.data?.statusMessage || err?.statusMessage || 'Failed to save announcement.'
  } finally {
    saving.value = false
  }
}

async function remove(id: string) {
  if (!slug.value) return
  try {
    await platform.deleteAnnouncement(slug.value, id)
  } catch {
    error.value = 'Failed to delete announcement.'
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h2 class="display-title text-3xl">
          Announcements
        </h2>
        <p class="mt-1 text-sm text-[var(--text-muted)]">
          Publish updates to the public community site.
        </p>
      </div>
      <button type="button" class="btn-brand" @click="openCreate">
        New announcement
      </button>
    </div>

    <p v-if="error" class="mb-4 text-sm text-[var(--color-danger)]" role="alert">
      {{ error }}
    </p>

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
      Loading announcements…
    </div>

    <div v-else class="shell-surface overflow-hidden">
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
              <button type="button" class="btn-quiet btn-sm mr-1" @click="openEdit(item)">
                Edit
              </button>
              <button type="button" class="btn-danger btn-sm" @click="remove(item.id)">
                Delete
              </button>
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
