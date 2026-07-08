<script setup lang="ts">
import type { FeatureFlags, PlanTier } from '~/core/types'

definePageMeta({ layout: 'platform' })

const platform = usePlatformStore()

const form = reactive({
  name: '',
  slug: '',
  address: '',
  contactEmail: '',
  contactPhone: '',
  planTier: 'standard' as PlanTier,
  status: 'active' as const,
  features: {
    intake: true,
    payments: false,
    ledger: false,
    polls: false,
    broadcasts: false,
    landing_editor: true,
    staff_management: true,
    announcements: true
  } as FeatureFlags,
  landing: {
    heroTitle: '',
    heroSubtitle: 'Your HOA digital hub',
    welcomeMessage: '',
    contactAddress: '',
    contactPhone: '',
    contactEmail: '',
    officeHours: 'Mon–Fri 9:00 AM – 5:00 PM',
    accentColor: '#0f766e'
  },
  officers: []
})

watch(() => form.name, (name) => {
  if (!form.slug) {
    form.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  }
  form.landing.heroTitle = form.landing.heroTitle || `Welcome to ${name}`
})

function create() {
  if (!form.slug || !form.name) return
  platform.createOrganization({
    slug: form.slug,
    name: form.name,
    address: form.address,
    contactEmail: form.contactEmail,
    contactPhone: form.contactPhone,
    planTier: form.planTier,
    status: form.status,
    features: { ...form.features },
    landing: { ...form.landing, contactAddress: form.address, contactPhone: form.contactPhone, contactEmail: form.contactEmail },
    officers: []
  })
  navigateTo('/platform/orgs')
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
          {{ form.slug || 'slug' }}.sandiwa.localhost
        </p>
      </UFormField>
      <UFormField label="Address">
        <UTextarea v-model="form.address" class="w-full" />
      </UFormField>
      <UFormField label="Plan">
        <USelect v-model="form.planTier" :items="['basic', 'standard', 'premium']" class="w-full" />
      </UFormField>
      <div class="flex gap-2">
        <UButton type="submit">
          Create HOA
        </UButton>
        <UButton variant="ghost" to="/platform/orgs">
          Cancel
        </UButton>
      </div>
    </form>
  </div>
</template>
