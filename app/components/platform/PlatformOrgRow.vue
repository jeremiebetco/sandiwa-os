<script setup lang="ts">
import type { Organization } from '~/core/types'
import { BRANDS } from '~/core/branding/registry'

const props = defineProps<{
  org: Organization
}>()

const { buildTenantUrl, formatTenantHost } = useTenantDomain()

function brandLabel(brandId: string) {
  return BRANDS[brandId as keyof typeof BRANDS]?.label ?? brandId
}

const host = computed(() => formatTenantHost(props.org.slug))
const href = computed(() => buildTenantUrl(props.org.slug))
</script>

<template>
  <article class="platform-org-row">
    <div class="flex min-w-0 gap-4">
      <BrandMark :name="org.name" :src="org.logoUrl" />
      <div class="min-w-0">
        <div class="flex flex-wrap items-center gap-2">
          <h3 class="display-title text-lg">
            {{ org.name }}
          </h3>
          <span
            class="platform-badge"
            :class="org.status === 'active' ? 'platform-badge--success' : 'platform-badge--muted'"
          >
            {{ org.status }}
          </span>
          <span class="platform-badge">
            {{ org.planTier }}
          </span>
        </div>
        <p class="mt-1 text-sm text-[var(--text-muted)]">
          <a
            :href="href"
            class="font-medium text-[var(--bg-accent)] hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >{{ host }}</a>
          <span> · Brand: {{ brandLabel(org.landing.brandId) }}</span>
        </p>
        <p class="mt-2 text-sm text-[var(--text-secondary)]">
          {{ org.address || 'No address on file.' }}
        </p>
      </div>
    </div>
    <div class="flex flex-wrap gap-2">
      <NuxtLink :to="`/platform/orgs/${org.slug}`" class="btn-quiet text-sm">
        Edit
      </NuxtLink>
      <NuxtLink :to="`/platform/orgs/${org.slug}/features`" class="btn-quiet text-sm">
        Features
      </NuxtLink>
    </div>
  </article>
</template>
