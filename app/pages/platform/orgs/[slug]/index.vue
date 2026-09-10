<script setup lang="ts">
import type { PlanTier } from '~/core/types'

definePageMeta({ layout: 'platform' })

const platform = usePlatformStore()
const route = useRoute()
const slug = computed(() => route.params.slug as string)
const { formatTenantHost } = useTenantDomain()

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
    error.value = err?.data?.statusMessage || err?.statusMessage || 'Failed to update organization.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <div class="mb-6">
      <NuxtLink to="/platform/orgs" class="text-sm font-medium text-[var(--bg-accent)] hover:underline">
        Back to organizations
      </NuxtLink>
      <h1 class="display-title mt-3 text-3xl">
        Edit organization
      </h1>
      <p class="mt-1 text-sm text-[var(--text-muted)]">
        Update tenant details, plan, and status.
      </p>
    </div>

    <div v-if="loading" class="platform-skeleton" aria-busy="true" />

    <form
      v-else-if="org"
      class="shell-surface grid gap-6 p-6 md:grid-cols-2"
      @submit.prevent="save"
    >
      <div class="space-y-4">
        <div>
          <label class="mb-1 block text-sm font-medium" for="edit-name">Name</label>
          <input id="edit-name" v-model="form.name" required class="field-input">
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium" for="edit-slug">Slug</label>
          <input id="edit-slug" v-model="form.slug" disabled class="field-input">
          <p class="mt-1 text-xs text-[var(--text-muted)]">
            {{ formatTenantHost(form.slug) }}
          </p>
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium" for="edit-address">Address</label>
          <textarea id="edit-address" v-model="form.address" class="field-textarea" />
        </div>
      </div>

      <div class="space-y-4">
        <div>
          <label class="mb-1 block text-sm font-medium" for="edit-email">Contact email</label>
          <input id="edit-email" v-model="form.contactEmail" type="email" class="field-input">
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium" for="edit-phone">Contact phone</label>
          <input id="edit-phone" v-model="form.contactPhone" type="tel" class="field-input">
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium" for="edit-plan">Plan tier</label>
          <select id="edit-plan" v-model="form.planTier" class="field-input">
            <option value="basic">
              basic
            </option>
            <option value="standard">
              standard
            </option>
            <option value="premium">
              premium
            </option>
          </select>
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium" for="edit-status">Status</label>
          <select id="edit-status" v-model="form.status" class="field-input">
            <option value="active">
              active
            </option>
            <option value="inactive">
              inactive
            </option>
          </select>
        </div>
        <p v-if="error" class="text-sm text-[var(--color-danger)]" role="alert">
          {{ error }}
        </p>
        <div class="flex flex-wrap gap-2 pt-2">
          <button type="submit" class="btn-brand" :disabled="saving">
            {{ saving ? 'Saving…' : 'Save changes' }}
          </button>
          <NuxtLink :to="`/platform/orgs/${slug}/features`" class="btn-quiet">
            Features
          </NuxtLink>
          <NuxtLink to="/platform/orgs" class="btn-quiet">
            Cancel
          </NuxtLink>
        </div>
      </div>
    </form>

    <div v-else class="shell-surface p-8 text-[var(--text-muted)]">
      {{ error || (notFound ? 'Organization not found.' : 'Organization not found.') }}
    </div>
  </div>
</template>
