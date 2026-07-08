<script setup lang="ts">
definePageMeta({ layout: 'impact' })

const { organization } = useTenant()
const platform = usePlatformStore()

const announcements = computed(() => {
  if (!organization.value) return []
  return platform.getAnnouncements(organization.value.id)
})
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold">
      Announcements
    </h2>
    <ul v-if="announcements.length" class="mt-6 space-y-4">
      <li v-for="item in announcements" :key="item.id" class="shell-surface p-6">
        <h3 class="text-lg font-semibold">
          {{ item.title }}
        </h3>
        <p class="mt-2 whitespace-pre-wrap">
          {{ item.body }}
        </p>
        <p class="mt-2 text-xs shell-text-muted">
          {{ new Date(item.publishedAt).toLocaleDateString() }}
        </p>
      </li>
    </ul>
    <p v-else class="mt-8 text-center shell-text-muted">
      No announcements yet.
    </p>
  </div>
</template>
