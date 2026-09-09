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
  <div class="shell-surface max-w-2xl p-6">
    <h2 class="text-xl font-semibold">
      Register new HOA
    </h2>
    <form class="mt-6 space-y-4" @submit.prevent="create">
      <UFormField label="HOA name" required>
        <UInput v-model="form.name" class="w-full" />
      </UFormField>
      <UFormField label="Subdomain slug" required>
        <UInput v-model="form.slug" class="w-full" />
        <p class="mt-1 text-xs shell-text-muted">
          {{ formatTenantHost(form.slug || 'slug') }}
        </p>
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
      <UFormField label="Plan">
        <USelect v-model="form.planTier" :items="['basic', 'standard', 'premium']" class="w-full" />
      </UFormField>
      <p v-if="formError" class="text-sm text-[var(--color-danger)]" role="alert">
        {{ formError }}
      </p>
      <div class="flex gap-2">
        <UButton type="submit" :loading="saving">
          Create HOA
        </UButton>
        <UButton variant="ghost" to="/platform/orgs">
          Cancel
        </UButton>
      </div>
    </form>
  </div>
</template>
