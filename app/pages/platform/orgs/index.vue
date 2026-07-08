<script setup lang="ts">
definePageMeta({ layout: 'platform' })

const platform = usePlatformStore()

onMounted(() => platform.hydrate())

const orgs = computed(() => platform.organizations)
const { buildTenantUrl, formatTenantHost } = useTenantDomain()

function resetDemo() {
  platform.resetDemoData()
  window.location.reload()
}
</script>

<template>
  <div>
    <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-semibold">
          HOA Organizations
        </h2>
        <p class="text-sm shell-text-muted">
          Register and manage homeowners association tenants.
        </p>
      </div>
      <div class="flex gap-2">
        <UButton variant="outline" @click="resetDemo">
          Reset demo data
        </UButton>
        <UButton to="/platform/orgs/new">
          Add HOA
        </UButton>
      </div>
    </div>

    <div class="grid gap-4">
      <div
        v-for="org in orgs"
        :key="org.id"
        class="shell-surface p-6"
      >
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 class="text-lg font-semibold">
              {{ org.name }}
            </h3>
            <p class="text-sm shell-text-muted">
              <a
                :href="buildTenantUrl(org.slug)"
                class="text-[var(--bg-accent)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bg-accent)] focus-visible:ring-offset-2"
                target="_blank"
                rel="noopener noreferrer"
              >{{ formatTenantHost(org.slug) }}</a>
              · {{ org.planTier }} · {{ org.status }}
            </p>
            <p class="mt-1 text-sm">
              {{ org.address }}
            </p>
          </div>
          <div class="flex gap-2">
            <UButton variant="outline" size="sm" :to="`/platform/orgs/${org.slug}`">
              Edit
            </UButton>
            <UButton variant="outline" size="sm" :to="`/platform/orgs/${org.slug}/features`">
              Features
            </UButton>
          </div>
        </div>
      </div>
      <p v-if="!orgs.length" class="shell-text-muted py-8 text-center">
        No organizations registered yet.
      </p>
    </div>
  </div>
</template>
