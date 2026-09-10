<script setup lang="ts">
import type { PlanTier } from '~/core/types'

definePageMeta({ layout: 'platform' })

const platform = usePlatformStore()
const { formatTenantHost } = useTenantDomain()

const saving = ref(false)
const formError = ref('')

const form = reactive({
  name: '',
  slug: '',
  address: '',
  contactEmail: '',
  contactPhone: '',
  planTier: 'standard' as PlanTier
})

watch(() => form.name, (name) => {
  if (!form.slug) {
    form.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  }
})

async function create() {
  if (!form.slug || !form.name) {
    formError.value = 'Name and slug are required.'
    return
  }
  saving.value = true
  formError.value = ''
  try {
    await platform.createOrganization({
      slug: form.slug,
      name: form.name,
      address: form.address,
      contactEmail: form.contactEmail,
      contactPhone: form.contactPhone,
      planTier: form.planTier
    })
    await navigateTo('/platform/orgs')
  } catch (e: unknown) {
    const err = e as { data?: { statusMessage?: string }, statusMessage?: string }
    formError.value = err?.data?.statusMessage || err?.statusMessage || 'Failed to create organization.'
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
        Register new HOA
      </h1>
      <p class="mt-1 text-sm text-[var(--text-muted)]">
        Creates a tenant host and default feature set for the selected plan.
      </p>
    </div>

    <form class="shell-surface grid gap-6 p-6 md:grid-cols-2" @submit.prevent="create">
      <div class="space-y-4">
        <div>
          <label class="mb-1 block text-sm font-medium" for="hoa-name">HOA name</label>
          <input id="hoa-name" v-model="form.name" required class="field-input">
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium" for="hoa-slug">Subdomain slug</label>
          <input id="hoa-slug" v-model="form.slug" required class="field-input">
          <p class="mt-1 text-xs text-[var(--text-muted)]">
            {{ formatTenantHost(form.slug || 'slug') }}
          </p>
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium" for="hoa-address">Address</label>
          <textarea id="hoa-address" v-model="form.address" class="field-textarea" />
        </div>
      </div>

      <div class="space-y-4">
        <div>
          <label class="mb-1 block text-sm font-medium" for="hoa-email">Contact email</label>
          <input id="hoa-email" v-model="form.contactEmail" type="email" class="field-input">
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium" for="hoa-phone">Contact phone</label>
          <input id="hoa-phone" v-model="form.contactPhone" type="tel" class="field-input">
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium" for="hoa-plan">Plan</label>
          <select id="hoa-plan" v-model="form.planTier" class="field-input">
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
        <p v-if="formError" class="text-sm text-[var(--color-danger)]" role="alert">
          {{ formError }}
        </p>
        <div class="flex flex-wrap gap-2 pt-2">
          <button type="submit" class="btn-brand" :disabled="saving">
            {{ saving ? 'Creating…' : 'Create HOA' }}
          </button>
          <NuxtLink to="/platform/orgs" class="btn-quiet">
            Cancel
          </NuxtLink>
        </div>
      </div>
    </form>
  </div>
</template>
