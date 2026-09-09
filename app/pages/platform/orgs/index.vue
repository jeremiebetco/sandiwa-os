<script setup lang="ts">
import { BRANDS } from '~/core/branding/registry'

definePageMeta({ layout: 'platform' })

const platform = usePlatformStore()

const loading = ref(true)
const error = ref('')
const resetting = ref(false)

const orgs = computed(() => platform.organizations)
const { buildTenantUrl, formatTenantHost } = useTenantDomain()

function brandLabel(brandId: string) {
  return BRANDS[brandId as keyof typeof BRANDS]?.label ?? brandId
}

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
        <h2 class="display-title text-3xl">
          Organizations
        </h2>
        <p class="mt-1 text-sm text-[var(--text-muted)]">
          Register and manage homeowners association tenants.
        </p>
      </div>
      <div class="flex gap-2">
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

    <div v-if="loading" class="shell-surface p-10 text-center text-[var(--text-muted)]">
      Loading organizations…
    </div>

    <div v-else class="grid gap-4">
      <article
        v-for="org in orgs"
        :key="org.id"
        class="shell-surface p-6"
      >
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div class="flex min-w-0 gap-4">
            <BrandMark :name="org.name" :src="org.logoUrl" />
            <div class="min-w-0">
              <h3 class="display-title text-lg">
                {{ org.name }}
              </h3>
              <p class="mt-1 text-sm text-[var(--text-muted)]">
                <a
                  :href="buildTenantUrl(org.slug)"
                  class="font-medium text-[var(--bg-accent)] hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >{{ formatTenantHost(org.slug) }}</a>
                <span class="text-[var(--text-muted)]"> / {{ org.planTier }} / {{ org.status }}</span>
              </p>
              <p class="mt-2 text-sm">
                {{ org.address }}
              </p>
              <p class="mt-2 text-xs text-[var(--text-muted)]">
                Brand: {{ brandLabel(org.landing.brandId) }}
              </p>
            </div>
          </div>
          <div class="flex gap-2">
            <NuxtLink :to="`/platform/orgs/${org.slug}`" class="btn-quiet text-sm">
              Edit
            </NuxtLink>
            <NuxtLink :to="`/platform/orgs/${org.slug}/features`" class="btn-quiet text-sm">
              Features
            </NuxtLink>
          </div>
        </div>
      </article>
      <p v-if="!orgs.length" class="py-12 text-center text-[var(--text-muted)]">
        No organizations registered yet.
      </p>
    </div>
  </div>
</template>
