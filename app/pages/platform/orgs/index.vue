<script setup lang="ts">
definePageMeta({ layout: 'platform' })

const platform = usePlatformStore()

const loading = ref(true)
const error = ref('')
const resetting = ref(false)

const orgs = computed(() => platform.organizations)

onMounted(async () => {
  loading.value = true
  error.value = ''
  try {
    await platform.fetchOrganizations()
  } catch {
    error.value = 'Failed to load organizations.'
  } finally {
    loading.value = false
  }
})

async function resetDemo() {
  resetting.value = true
  error.value = ''
  try {
    await platform.resetDemoData()
    await platform.fetchOrganizations()
  } catch (e: unknown) {
    const err = e as { data?: { statusMessage?: string }, statusMessage?: string }
    error.value = err?.data?.statusMessage
      || err?.statusMessage
      || 'Failed to reset demo data. Local only: set ALLOW_DEMO_RESET=true and use pnpm db:seed.'
  } finally {
    resetting.value = false
  }
}
</script>

<template>
  <div>
    <div class="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="display-title text-3xl">
          Organizations
        </h1>
        <p class="mt-1 text-sm text-[var(--text-muted)]">
          Register and manage homeowners association tenants.
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="btn-quiet text-sm"
          :disabled="resetting"
          title="Requires ALLOW_DEMO_RESET=true locally; disabled in production"
          @click="resetDemo"
        >
          {{ resetting ? 'Resetting…' : 'Reset demo' }}
        </button>
        <NuxtLink to="/platform/orgs/new" class="btn-brand text-sm">
          Add HOA
        </NuxtLink>
      </div>
    </div>

    <p v-if="error" class="mb-4 text-sm text-[var(--color-danger)]" role="alert">
      {{ error }}
    </p>

    <div v-if="loading" class="grid gap-3" aria-busy="true" aria-label="Loading organizations">
      <div class="platform-skeleton" />
      <div class="platform-skeleton" />
      <div class="platform-skeleton" />
    </div>

    <div v-else class="grid gap-3">
      <PlatformOrgRow
        v-for="org in orgs"
        :key="org.id"
        :org="org"
      />
      <div
        v-if="!orgs.length"
        class="shell-surface flex min-h-48 flex-col items-center justify-center gap-3 p-10 text-center"
      >
        <UIcon name="i-lucide-building-2" class="size-8 text-[var(--text-muted)]" />
        <p class="font-semibold">
          No organizations registered yet
        </p>
        <p class="max-w-[36ch] text-sm text-[var(--text-muted)]">
          Add the first HOA tenant to create a host, plan, and feature set.
        </p>
        <NuxtLink to="/platform/orgs/new" class="btn-brand text-sm">
          Add HOA
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
