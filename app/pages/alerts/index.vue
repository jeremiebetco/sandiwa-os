<script setup lang="ts">
import type { Broadcast, BroadcastSeverity } from '~/core/types'

definePageMeta({ layout: 'impact' })

const { slug } = useTenant()
const { t } = useTerminology()
const { isEnabled } = useFeatures()
const { to: tenantPath } = useTenantPath()

const broadcasts = ref<Broadcast[]>([])
const loading = ref(true)
const error = ref('')

function apiError(e: unknown): string {
  const err = e as { data?: { statusMessage?: string }, statusMessage?: string }
  return err?.data?.statusMessage || err?.statusMessage || 'Something went wrong. Try again.'
}

function panelClass(severity: BroadcastSeverity) {
  if (severity === 'emergency') return 'impact-action-panel impact-action-panel--emergency !items-start !justify-start text-left'
  if (severity === 'warning') {
    return 'shell-surface border-2 border-[var(--color-warning)] bg-[var(--color-warning-muted)]'
  }
  return 'shell-surface'
}

async function load() {
  if (!slug.value) return
  loading.value = true
  error.value = ''
  try {
    const res = await $fetch<{ broadcasts: Broadcast[] }>(`/api/tenants/${slug.value}/broadcasts`)
    broadcasts.value = res.broadcasts
  } catch (e) {
    error.value = apiError(e)
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="mx-auto max-w-2xl space-y-8">
    <div>
      <NuxtLink :to="tenantPath('/portal')" class="text-sm text-[var(--bg-accent)] hover:underline">
        ← Member home
      </NuxtLink>
      <h2 class="mt-4 text-2xl font-bold">
        {{ t('modules.broadcasts.label') }} feed
      </h2>
      <p class="shell-text-muted">
        {{ t('modules.broadcasts.description') }}
      </p>
    </div>

    <div v-if="!isEnabled('broadcasts')" class="shell-surface p-8 text-center shell-text-muted">
      Alerts are not enabled for this community.
    </div>

    <div v-else-if="loading" class="space-y-3" aria-busy="true">
      <div v-for="n in 3" :key="n" class="shell-surface h-28 animate-pulse bg-[var(--bg-muted)]" />
    </div>

    <div v-else-if="error" class="shell-surface p-8 text-center" role="alert">
      <p class="text-[var(--color-danger)]">
        {{ error }}
      </p>
      <UButton class="mt-4" @click="load">
        Retry
      </UButton>
    </div>

    <ul v-else class="space-y-4">
      <li
        v-for="item in broadcasts"
        :key="item.id"
        class="p-6"
        :class="panelClass(item.severity)"
      >
        <div class="flex items-start justify-between gap-3">
          <h3 class="text-lg font-semibold">
            {{ item.title }}
          </h3>
          <div class="flex shrink-0 items-center gap-2">
            <ListenButton :text="`${item.title}. ${item.body}`" />
            <span class="text-xs font-semibold uppercase tracking-wide">
              {{ item.severity }}
            </span>
          </div>
        </div>
        <p class="mt-3 whitespace-pre-wrap text-base font-normal">
          {{ item.body }}
        </p>
        <p class="mt-3 text-xs opacity-80">
          {{ item.sentAt ? new Date(item.sentAt).toLocaleString() : new Date(item.createdAt).toLocaleString() }}
          <template v-if="item.audiencePhase">
            · {{ item.audiencePhase }}
          </template>
        </p>
      </li>
      <li v-if="!broadcasts.length" class="shell-surface p-12 text-center shell-text-muted">
        No alerts right now. You are all caught up.
      </li>
    </ul>
  </div>
</template>
