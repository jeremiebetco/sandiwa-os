<script setup lang="ts">
import { sanitizeText } from '~/core/utils/sanitize'

definePageMeta({ layout: 'console' })

const { organization } = useTenant()
const platform = usePlatformStore()

const form = reactive({
  heroTitle: '',
  heroSubtitle: '',
  welcomeMessage: '',
  contactAddress: '',
  contactPhone: '',
  contactEmail: '',
  officeHours: ''
})

watch(
  () => organization.value,
  (org) => {
    if (org) Object.assign(form, org.landing)
  },
  { immediate: true }
)

function save() {
  if (!organization.value) return
  platform.updateOrganization(organization.value.id, {
    landing: {
      ...organization.value.landing,
      heroTitle: sanitizeText(form.heroTitle, 200),
      heroSubtitle: sanitizeText(form.heroSubtitle, 200),
      welcomeMessage: sanitizeText(form.welcomeMessage, 1000),
      contactAddress: sanitizeText(form.contactAddress, 300),
      contactPhone: sanitizeText(form.contactPhone, 50),
      contactEmail: sanitizeText(form.contactEmail, 100),
      officeHours: sanitizeText(form.officeHours, 100)
    }
  })
}
</script>

<template>
  <div class="max-w-2xl">
    <h2 class="text-2xl font-semibold">
      Landing page content
    </h2>
    <p class="text-sm shell-text-muted">
      Edit public Impact portal copy (structured fields only).
    </p>
    <form class="shell-surface mt-6 space-y-4 p-6" @submit.prevent="save">
      <UFormField label="Hero title">
        <UInput v-model="form.heroTitle" class="w-full" />
      </UFormField>
      <UFormField label="Hero subtitle">
        <UInput v-model="form.heroSubtitle" class="w-full" />
      </UFormField>
      <UFormField label="Welcome message">
        <UTextarea v-model="form.welcomeMessage" class="w-full" />
      </UFormField>
      <UFormField label="Contact address">
        <UTextarea v-model="form.contactAddress" class="w-full" />
      </UFormField>
      <UFormField label="Phone">
        <UInput v-model="form.contactPhone" class="w-full" />
      </UFormField>
      <UFormField label="Email">
        <UInput v-model="form.contactEmail" type="email" class="w-full" />
      </UFormField>
      <UFormField label="Office hours">
        <UInput v-model="form.officeHours" class="w-full" />
      </UFormField>
      <UButton type="submit">
        Save landing content
      </UButton>
    </form>
  </div>
</template>
