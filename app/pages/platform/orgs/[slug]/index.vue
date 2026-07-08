<script setup lang="ts">
import type { FeatureFlags, PlanTier } from '~/core/types'
import { PLUGIN_KEYS } from '~/core/types'

definePageMeta({ layout: 'platform' })

const platform = usePlatformStore()
const route = useRoute()
const slug = computed(() => route.params.slug as string)

const org = computed(() => platform.getOrganizationBySlug(slug.value))

const form = reactive({
  name: '',
  slug: '',
  address: '',
  contactEmail: '',
  contactPhone: '',
  planTier: 'standard' as PlanTier,
  status: 'active' as 'active' | 'inactive',
  features: {
    intake: true,
    payments: true,
    ledger: false,
    polls: true,
    broadcasts: false,
    landing_editor: true,
    staff_management: true,
    announcements: true
  } as FeatureFlags,
  landing: {
    heroTitle: '',
    heroSubtitle: '',
    welcomeMessage: '',
    contactAddress: '',
    contactPhone: '',
    contactEmail: '',
    officeHours: 'Mon–Fri 9:00 AM – 5:00 PM',
    accentColor: '#0f766e'
  },
  officers: [] as { id: string, name: string, position: string }[]
})

watch(org, (value) => {
  if (value) {
    Object.assign(form, {
      name: value.name,
      slug: value.slug,
      address: value.address,
      contactEmail: value.contactEmail,
      contactPhone: value.contactPhone,
      planTier: value.planTier,
      status: value.status,
      features: { ...value.features },
      landing: { ...value.landing },
      officers: [...value.officers]
    })
  }
}, { immediate: true })

function save() {
  if (org.value) {
    platform.updateOrganization(org.value.id, {
      name: form.name,
      address: form.address,
      contactEmail: form.contactEmail,
      contactPhone: form.contactPhone,
      planTier: form.planTier,
      status: form.status,
      landing: { ...form.landing },
      officers: [...form.officers]
    })
    navigateTo('/platform/orgs')
  }
}
</script>

<template>
  <div v-if="org" class="shell-surface max-w-2xl p-6">
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
      <UFormField label="Plan tier">
        <USelect v-model="form.planTier" :items="['basic', 'standard', 'premium']" class="w-full" />
      </UFormField>
      <UFormField label="Status">
        <USelect v-model="form.status" :items="['active', 'inactive']" class="w-full" />
      </UFormField>
      <div class="flex gap-2 pt-4">
        <UButton type="submit">
          Save
        </UButton>
        <UButton variant="ghost" to="/platform/orgs">
          Cancel
        </UButton>
      </div>
    </form>
  </div>
  <div v-else class="shell-text-muted">
    Organization not found.
  </div>
</template>
