<script setup lang="ts">
import { PLUGIN_MARKETING, ALL_PLUGIN_KEYS } from '~/core/platform/marketing'

definePageMeta({ layout: 'platform' })

useSeoMeta({
  title: 'Product - Sandiwa OS',
  description: 'Modules for announcements, requests, dues, ledger, votes, alerts, staff roles, and branded landings.'
})

const { buildTenantUrl } = useTenantDomain()
const liveDemoUrl = computed(() => buildTenantUrl('greenfield-hoa'))
</script>

<template>
  <div class="space-y-12">
    <header class="max-w-3xl">
      <h1 class="display-title text-4xl md:text-5xl">
        The HOA stack boards can operate daily.
      </h1>
      <p class="mt-4 max-w-[52ch] text-base text-[var(--text-secondary)]">
        Sandiwa splits member-facing Impact, staff Console, and platform admin so each audience gets the right surface without sharing one cluttered app.
      </p>
      <div class="mt-6 flex flex-wrap gap-3">
        <a
          :href="liveDemoUrl"
          class="btn-brand"
          target="_blank"
          rel="noopener noreferrer"
        >
          See a live HOA
        </a>
        <NuxtLink to="/pricing" class="btn-quiet">
          View plans
        </NuxtLink>
      </div>
    </header>

    <section class="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
      <div class="platform-hero-media min-h-64">
        <img
          src="/assets/platform/product.png"
          alt="Condominium lobby interior"
          width="960"
          height="720"
        >
      </div>
      <div>
        <h2 class="display-title text-3xl">
          Three surfaces, one tenant
        </h2>
        <ul class="mt-5 space-y-4 text-sm text-[var(--text-secondary)]">
          <li>
            <strong class="text-[var(--text-primary)]">Impact</strong>
            - public landing and member portal with EN/TL and Listen.
          </li>
          <li>
            <strong class="text-[var(--text-primary)]">Console</strong>
            - staff queue for announcements, requests, dues, votes, and more.
          </li>
          <li>
            <strong class="text-[var(--text-primary)]">Platform</strong>
            - register HOAs, set plans, and toggle modules on the main domain.
          </li>
        </ul>
      </div>
    </section>

    <section>
      <h2 class="display-title text-3xl">
        Modules
      </h2>
      <div class="mt-6 grid gap-4 md:grid-cols-2">
        <article
          v-for="plugin in ALL_PLUGIN_KEYS"
          :key="plugin"
          class="shell-surface p-5"
        >
          <UIcon :name="PLUGIN_MARKETING[plugin].icon" class="size-5 text-[var(--bg-accent)]" />
          <h3 class="display-title mt-3 text-xl">
            {{ PLUGIN_MARKETING[plugin].title }}
          </h3>
          <p class="mt-2 text-sm text-[var(--text-muted)]">
            {{ PLUGIN_MARKETING[plugin].blurb }}
          </p>
        </article>
      </div>
    </section>
  </div>
</template>
