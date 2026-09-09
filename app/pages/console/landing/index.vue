<script setup lang="ts">
import { BRAND_OPTIONS } from '~/core/branding/registry'
import type { BrandId } from '~/core/branding/registry'
import { sanitizeText } from '~/core/utils/sanitize'

definePageMeta({ layout: 'console' })

const { organization, slug } = useTenant()
const platform = usePlatformStore()

const saving = ref(false)
const error = ref('')
const saved = ref(false)

const brandOptions = BRAND_OPTIONS.filter(b => b.id !== 'sandiwa')

const form = reactive({
  heroTitle: '',
  heroSubtitle: '',
  welcomeMessage: '',
  contactAddress: '',
  contactPhone: '',
  contactEmail: '',
  officeHours: '',
  brandId: 'tenant' as BrandId,
  accentColor: '#1f6b3a'
})

watch(
  () => organization.value,
  (org) => {
    if (!org) return
    Object.assign(form, org.landing)
  },
  { immediate: true }
)

const showAccentPicker = computed(() => form.brandId === 'tenant')

async function save() {
  if (!organization.value || !slug.value) return
  saving.value = true
  error.value = ''
  saved.value = false
  try {
    await platform.updateLanding(slug.value, {
      ...organization.value.landing,
      heroTitle: sanitizeText(form.heroTitle, 200),
      heroSubtitle: sanitizeText(form.heroSubtitle, 200),
      welcomeMessage: sanitizeText(form.welcomeMessage, 1000),
      contactAddress: sanitizeText(form.contactAddress, 300),
      contactPhone: sanitizeText(form.contactPhone, 50),
      contactEmail: sanitizeText(form.contactEmail, 100),
      officeHours: sanitizeText(form.officeHours, 100),
      brandId: form.brandId,
      accentColor: form.accentColor
    })
    saved.value = true
  } catch (e: unknown) {
    const err = e as { data?: { statusMessage?: string }, statusMessage?: string }
    error.value = err?.data?.statusMessage || err?.statusMessage || 'Failed to save landing content.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="max-w-2xl">
    <h2 class="display-title text-2xl">
      Landing page
    </h2>
    <p class="text-sm text-[var(--text-muted)]">
      Public copy and brand pack for the member-facing site.
    </p>
    <form class="shell-surface mt-6 space-y-5 p-6" @submit.prevent="save">
      <fieldset class="space-y-3">
        <legend class="text-sm font-semibold">
          Brand pack
        </legend>
        <p class="text-xs text-[var(--text-muted)]">
          Named packs ship fixed palettes. Tenant default uses your accent color below.
        </p>
        <div class="grid gap-2 sm:grid-cols-2">
          <label
            v-for="brand in brandOptions"
            :key="brand.id"
            class="flex cursor-pointer gap-3 rounded-lg border p-3 transition-colors"
            :class="form.brandId === brand.id
              ? 'border-[var(--bg-accent)] bg-[var(--brand-accent-muted)]'
              : 'border-[var(--border-default)] hover:border-[var(--border-strong)]'"
          >
            <input
              v-model="form.brandId"
              type="radio"
              name="brandId"
              :value="brand.id"
              class="mt-1"
            >
            <span>
              <span class="block text-sm font-medium">{{ brand.label }}</span>
              <span class="block text-xs text-[var(--text-muted)]">{{ brand.summary }}</span>
            </span>
          </label>
        </div>
        <div v-if="showAccentPicker">
          <label class="mb-1 block text-sm font-medium" for="accentColor">Accent color</label>
          <div class="flex items-center gap-3">
            <input
              id="accentColor"
              v-model="form.accentColor"
              type="color"
              class="h-10 w-14 cursor-pointer rounded border border-[var(--border-default)]"
            >
            <input
              v-model="form.accentColor"
              type="text"
              pattern="^#[0-9a-fA-F]{6}$"
              class="field-input max-w-[8rem] font-mono text-sm"
              aria-label="Accent hex value"
            >
          </div>
        </div>
      </fieldset>

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
      <p v-if="error" class="text-sm text-[var(--color-danger)]" role="alert">
        {{ error }}
      </p>
      <p v-if="saved" class="text-sm text-[var(--color-success)]">
        Landing content saved. Refresh the public site to preview the new brand.
      </p>
      <button type="submit" class="btn-brand" :disabled="saving">
        {{ saving ? 'Saving…' : 'Save landing' }}
      </button>
    </form>
  </div>
</template>
