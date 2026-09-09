<script setup lang="ts">
definePageMeta({ layout: 'impact' })

const { slug } = useTenant()
const { to: tenantPath } = useTenantPath()
const platform = usePlatformStore()

const loading = ref(true)
const error = ref('')
const announcements = computed(() => platform.announcements)

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
</script>

<template>
  <div>
    <NuxtLink :to="tenantPath('/')" class="text-sm font-medium text-[var(--bg-accent)] hover:underline">
      Home
    </NuxtLink>
    <h2 class="display-title mt-4 text-3xl">
      Announcements
    </h2>
    <p v-if="error" class="mt-4 text-sm text-[var(--color-danger)]" role="alert">
      {{ error }}
    </p>
    <div v-if="loading" class="mt-8 shell-surface p-10 text-center text-[var(--text-muted)]">
      Loading announcements…
    </div>
    <ul v-else-if="announcements.length" class="mt-8 divide-y divide-[var(--border-default)] border-t border-[var(--border-default)]">
      <li v-for="item in announcements" :key="item.id" class="py-6">
        <div class="flex items-start justify-between gap-3">
          <h3 class="text-lg font-semibold">
            {{ item.title }}
          </h3>
          <ListenButton :text="`${item.title}. ${item.body}`" />
        </div>
        <p class="mt-2 whitespace-pre-wrap text-[var(--text-secondary)]">
          {{ item.body }}
        </p>
        <p class="mt-3 text-xs text-[var(--text-muted)]">
          {{ new Date(item.publishedAt).toLocaleDateString() }}
        </p>
      </li>
    </ul>
    <p v-else class="mt-12 text-center text-[var(--text-muted)]">
      No announcements yet.
    </p>
  </div>
</template>
