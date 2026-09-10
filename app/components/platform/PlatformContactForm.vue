<script setup lang="ts">
const form = reactive({
  name: '',
  email: '',
  hoa: '',
  message: ''
})

const errors = reactive({
  name: '',
  email: '',
  hoa: '',
  message: ''
})

const submitting = ref(false)
const submitted = ref(false)

function validate() {
  errors.name = form.name.trim() ? '' : 'Name is required.'
  errors.email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
    ? ''
    : 'Enter a valid email.'
  errors.hoa = form.hoa.trim() ? '' : 'HOA or community name is required.'
  errors.message = form.message.trim().length >= 12
    ? ''
    : 'Tell us a bit more (at least 12 characters).'
  return !errors.name && !errors.email && !errors.hoa && !errors.message
}

async function onSubmit() {
  if (!validate()) return
  submitting.value = true
  // Demo-only: no network write, no PII storage.
  await new Promise(resolve => setTimeout(resolve, 450))
  submitting.value = false
  submitted.value = true
}
</script>

<template>
  <div class="shell-surface p-6 md:p-8">
    <div v-if="submitted" class="space-y-3" role="status">
      <h3 class="display-title text-2xl">
        Request recorded locally
      </h3>
      <p class="text-sm text-[var(--text-secondary)]">
        This public demo does not store walkthrough requests. Use the live HOA demos or platform sign-in to explore Sandiwa now.
      </p>
      <div class="flex flex-wrap gap-2 pt-2">
        <NuxtLink to="/stories" class="btn-brand">
          Open live stories
        </NuxtLink>
        <button type="button" class="btn-quiet" @click="submitted = false">
          Send another
        </button>
      </div>
    </div>

    <form v-else class="space-y-4" novalidate @submit.prevent="onSubmit">
      <div>
        <label class="mb-1 block text-sm font-medium" for="contact-name">Your name</label>
        <input
          id="contact-name"
          v-model="form.name"
          type="text"
          autocomplete="name"
          class="field-input"
          :aria-invalid="!!errors.name"
        >
        <p v-if="errors.name" class="mt-1 text-sm text-[var(--color-danger)]" role="alert">
          {{ errors.name }}
        </p>
      </div>
      <div>
        <label class="mb-1 block text-sm font-medium" for="contact-email">Work email</label>
        <input
          id="contact-email"
          v-model="form.email"
          type="email"
          autocomplete="email"
          class="field-input"
          :aria-invalid="!!errors.email"
        >
        <p v-if="errors.email" class="mt-1 text-sm text-[var(--color-danger)]" role="alert">
          {{ errors.email }}
        </p>
      </div>
      <div>
        <label class="mb-1 block text-sm font-medium" for="contact-hoa">HOA or community</label>
        <input
          id="contact-hoa"
          v-model="form.hoa"
          type="text"
          class="field-input"
          :aria-invalid="!!errors.hoa"
        >
        <p v-if="errors.hoa" class="mt-1 text-sm text-[var(--color-danger)]" role="alert">
          {{ errors.hoa }}
        </p>
      </div>
      <div>
        <label class="mb-1 block text-sm font-medium" for="contact-message">What do you want to walk through?</label>
        <textarea
          id="contact-message"
          v-model="form.message"
          class="field-textarea"
          :aria-invalid="!!errors.message"
        />
        <p v-if="errors.message" class="mt-1 text-sm text-[var(--color-danger)]" role="alert">
          {{ errors.message }}
        </p>
      </div>
      <p class="text-xs text-[var(--text-muted)]">
        Demo form only. Nothing is emailed or saved on this public site.
      </p>
      <button type="submit" class="btn-brand" :disabled="submitting">
        {{ submitting ? 'Submitting…' : 'Request a walkthrough' }}
      </button>
    </form>
  </div>
</template>
