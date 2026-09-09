<script setup lang="ts">
import type { PlanTier } from '~/core/types'

definePageMeta({ layout: 'platform' })

const platform = usePlatformStore()
const route = useRoute()
const slug = computed(() => route.params.slug as string)

const loading = ref(true)
const saving = ref(false)
const error = ref('')
const notFound = ref(false)

const org = computed(() => platform.getOrganizationBySlug(slug.value))

const form = reactive({
  name: '',
  slug: '',
  address: '',
  contactEmail: '',
  contactPhone: '',
  planTier: 'standard' as PlanTier,
  status: 'active' as 'active' | 'inactive'
})

function syncForm() {
  const value = org.value
  if (!value) return
  Object.assign(form, {
    name: value.name,
    slug: value.slug,
    address: value.address,
    contactEmail: value.contactEmail,
    contactPhone: value.contactPhone,
    planTier: value.planTier,
    status: value.status
  })
}

onMounted(async () => {
  loading.value = true
  error.value = ''
  notFound.value = false
  try {
    if (!org.value) {
      await platform.fetchOrganizations()
    }
    if (!org.value) {
      notFound.value = true
    } else {
      syncForm()
    }
  } catch {
    error.value = 'Failed to load organization.'
  } finally {
    loading.value = false
  }
})

watch(org, () => syncForm())

async function save() {
  if (!org.value) return
  saving.value = true
  error.value = ''
  try {
    await platform.updateOrganization(slug.value, {
      name: form.name,
      address: form.address,
      contactEmail: form.contactEmail,
      contactPhone: form.contactPhone,
      planTier: form.planTier,
      status: form.status
    })
    await navigateTo('/platform/orgs')
  } catch (e: unknown) {
    const err = e as { data?: { statusMessage?: string }, statusMessage?: string }
    error.value = err?.data?.statusMessage || err?.statusMessage || 'Failed to save organization.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div v-if="loading" class="shell-surface max-w-2xl p-6 shell-text-muted">
    Loading organization…
  </div>
  <div v-else-if="org" class="shell-surface max-w-2xl p-6">
    <h2 class="text-xl font-semibold">
      Edit {{ org.name }}
    </h2>
    <form class="mt-6 space-y-4" @submit.prevent="save">
      <UFormField label="Name">
        <UInput v-model="form.name" class="w-full" />
      </UFormField>
      <UFormField label="Slug">
        <UInput v-model="form.slug" disabled class="w-full" />
      </UFormField>
      <UFormField label="Address">
        <UTextarea v-model="form.address" class="w-full" />
      </UFormField>
      <UFormField label="Contact email">
        <UInput v-model="form.contactEmail" type="email" class="w-full" />
      </UFormField>
      <UFormField label="Contact phone">
        <UInput v-model="form.contactPhone" class="w-full" />
      </UFormField>
      <UFormField label="Plan tier">
        <USelect v-model="form.planTier" :items="['basic', 'standard', 'premium']" class="w-full" />
      </UFormField>
      <UFormField label="Status">
        <USelect v-model="form.status" :items="['active', 'inactive']" class="w-full" />
      </UFormField>
      <p v-if="error" class="text-sm text-[var(--color-danger)]" role="alert">
        {{ error }}
      </p>
      <div class="flex gap-2 pt-4">
        <UButton type="submit" :loading="saving">
          Save
        </UButton>
        <UButton variant="ghost" to="/platform/orgs">
          Cancel
        </UButton>
      </div>
    </form>
  </div>
  <div v-else class="shell-text-muted">
    {{ error || (notFound ? 'Organization not found.' : 'Organization not found.') }}
  </div>
</template>
