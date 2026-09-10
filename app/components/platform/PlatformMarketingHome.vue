<script setup lang="ts">
import {
  HOME_FAQS,
  LIVE_DEMO_STORIES,
  PLUGIN_MARKETING,
  ALL_PLUGIN_KEYS
} from '~/core/platform/marketing'

const { buildTenantUrl } = useTenantDomain()
const liveDemoUrl = computed(() => buildTenantUrl('greenfield-hoa'))

const bentoPlugins = ALL_PLUGIN_KEYS
</script>

<template>
  <div>
    <section class="platform-split-hero">
      <div>
        <h1 class="display-title max-w-[14ch] text-4xl md:text-5xl lg:text-6xl">
          Run the village without the group-chat scramble.
        </h1>
        <p class="mt-5 max-w-[36ch] text-base text-[var(--text-secondary)] md:text-lg">
          Sandiwa OS gives Filipino HOAs a branded member site and a staff console in one platform.
        </p>
        <div class="mt-7 flex flex-wrap gap-3">
          <a
            :href="liveDemoUrl"
            class="btn-brand"
            target="_blank"
            rel="noopener noreferrer"
          >
            See a live HOA
          </a>
          <NuxtLink to="/platform/login" class="btn-quiet">
            Sign in
          </NuxtLink>
        </div>
      </div>
      <div class="platform-hero-media">
        <img
          src="/assets/platform/hero.png"
          alt="Philippine subdivision street at late afternoon"
          width="1280"
          height="720"
          fetchpriority="high"
        >
      </div>
    </section>

    <PlatformReveal>
      <section class="platform-section pt-0">
        <div class="mb-6 flex flex-wrap items-end justify-between gap-4">
          <h2 class="display-title text-2xl md:text-3xl">
            Open a live community
          </h2>
          <NuxtLink to="/stories" class="text-sm font-medium text-[var(--bg-accent)] hover:underline">
            All stories
          </NuxtLink>
        </div>
        <div class="grid gap-4 md:grid-cols-2">
          <a
            v-for="story in LIVE_DEMO_STORIES"
            :key="story.slug"
            :href="buildTenantUrl(story.slug)"
            class="shell-surface flex items-center gap-4 p-4 transition hover:shadow-[var(--shadow-md)]"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              :src="story.logoUrl"
              alt=""
              class="h-12 w-12 rounded-md object-cover"
              width="48"
              height="48"
            >
            <div class="min-w-0">
              <p class="font-semibold">
                {{ story.name }}
              </p>
              <p class="text-sm text-[var(--text-muted)]">
                {{ story.kind }} · open demo
              </p>
            </div>
          </a>
        </div>
      </section>
    </PlatformReveal>

    <PlatformReveal>
      <section class="platform-section">
        <h2 class="display-title max-w-[18ch] text-3xl md:text-4xl">
          Boards still run the village in Messenger and spreadsheets.
        </h2>
        <div class="platform-problem mt-8">
          <div class="platform-problem__pane">
            <p class="text-sm font-semibold text-[var(--bg-accent)]">
              Status quo
            </p>
            <ul class="mt-4 space-y-3 text-sm text-[var(--text-secondary)]">
              <li>Dues reminders disappear in group chats.</li>
              <li>Clearance depends on whose spreadsheet is newest.</li>
              <li>Member requests live as screenshots and side messages.</li>
              <li>Board turnover means starting over.</li>
            </ul>
          </div>
          <div class="platform-problem__pane platform-problem__pane--muted">
            <p class="text-sm font-semibold text-[var(--bg-accent)]">
              With Sandiwa
            </p>
            <ul class="mt-4 space-y-3 text-sm text-[var(--text-secondary)]">
              <li>Each HOA gets a branded public site and member portal.</li>
              <li>Staff work a console with roles and module toggles.</li>
              <li>EN/TL and Listen help members who prefer Tagalog or audio.</li>
              <li>Platform operators register tenants, plans, and features.</li>
            </ul>
          </div>
        </div>
      </section>
    </PlatformReveal>

    <PlatformReveal>
      <section class="platform-section">
        <h2 class="display-title text-3xl md:text-4xl">
          Modules the board actually uses
        </h2>
        <p class="mt-3 max-w-[52ch] text-sm text-[var(--text-secondary)]">
          Announcements, requests, dues, ledger, votes, alerts, staff roles, and landing brand packs, gated by plan.
        </p>
        <div class="platform-bento mt-8">
          <div
            v-for="(plugin, index) in bentoPlugins"
            :key="plugin"
            class="platform-bento__cell relative"
            :class="{
              'platform-bento__cell--tall platform-bento__cell--photo': index === 0,
              'platform-bento__cell--wide platform-bento__cell--tint': index === 1,
              'platform-bento__cell--wide': index === 2
            }"
          >
            <img
              v-if="index === 0"
              src="/assets/platform/product.png"
              alt=""
              class="absolute inset-0 h-full w-full object-cover"
              width="800"
              height="600"
              loading="lazy"
              aria-hidden="true"
            >
            <div :class="index === 0 ? 'platform-bento__overlay' : 'relative'">
              <UIcon
                :name="PLUGIN_MARKETING[plugin].icon"
                class="size-5"
                :class="index === 0 ? 'text-[var(--text-on-accent)]' : 'text-[var(--bg-accent)]'"
              />
              <h3 class="display-title mt-3 text-lg">
                {{ PLUGIN_MARKETING[plugin].title }}
              </h3>
              <p
                class="mt-2 text-sm"
                :class="index === 0 ? 'platform-bento__muted' : 'text-[var(--text-muted)]'"
              >
                {{ PLUGIN_MARKETING[plugin].blurb }}
              </p>
            </div>
          </div>
        </div>
        <p class="mt-4">
          <NuxtLink to="/product" class="text-sm font-medium text-[var(--bg-accent)] hover:underline">
            Explore the full product
          </NuxtLink>
        </p>
      </section>
    </PlatformReveal>

    <PlatformReveal>
      <section class="platform-section">
        <h2 class="display-title text-3xl">
          Register. Brand. Operate.
        </h2>
        <div class="platform-steps mt-8">
          <div class="platform-step">
            <h3 class="display-title text-xl">
              Register
            </h3>
            <p class="mt-2 text-sm text-[var(--text-secondary)]">
              Create the HOA tenant, plan tier, and host so the village has a stable home.
            </p>
          </div>
          <div class="platform-step">
            <h3 class="display-title text-xl">
              Brand
            </h3>
            <p class="mt-2 text-sm text-[var(--text-secondary)]">
              Apply a brand pack and landing copy so members recognize their community, not a generic portal.
            </p>
          </div>
          <div class="platform-step">
            <h3 class="display-title text-xl">
              Operate
            </h3>
            <p class="mt-2 text-sm text-[var(--text-secondary)]">
              Staff run the console. Members use the portal. Platform admins toggle modules as needs change.
            </p>
          </div>
        </div>
      </section>
    </PlatformReveal>

    <PlatformReveal>
      <section class="platform-section">
        <div class="mb-6 flex flex-wrap items-end justify-between gap-4">
          <h2 class="display-title text-3xl">
            Live stories
          </h2>
          <NuxtLink to="/stories" class="text-sm font-medium text-[var(--bg-accent)] hover:underline">
            View stories
          </NuxtLink>
        </div>
        <div class="grid gap-6">
          <PlatformStoryCard
            v-for="story in LIVE_DEMO_STORIES"
            :key="story.slug"
            :story="story"
          />
        </div>
      </section>
    </PlatformReveal>

    <PlatformReveal>
      <section class="platform-section">
        <h2 class="display-title text-3xl">
          Plans that match real modules
        </h2>
        <p class="mt-3 max-w-[48ch] text-sm text-[var(--text-secondary)]">
          Basic, Standard, and Premium map to the same plugin caps the platform Features screen uses.
        </p>
        <div class="mt-8">
          <PlatformPricingTable compact />
        </div>
      </section>
    </PlatformReveal>

    <PlatformReveal>
      <section class="platform-section">
        <div class="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <h2 class="display-title text-3xl">
              Questions boards ask first
            </h2>
            <p class="mt-3 text-sm text-[var(--text-secondary)]">
              Straight answers for Tagalog members, dues workflows, and this public demo.
            </p>
          </div>
          <div class="platform-faq">
            <details v-for="item in HOME_FAQS" :key="item.q">
              <summary>{{ item.q }}</summary>
              <p class="mt-2 max-w-[56ch] text-sm text-[var(--text-secondary)]">
                {{ item.a }}
              </p>
            </details>
          </div>
        </div>
      </section>
    </PlatformReveal>

    <PlatformReveal>
      <section class="platform-section pb-4">
        <div class="shell-surface shell-float overflow-hidden p-8 md:p-10">
          <h2 class="display-title max-w-[16ch] text-3xl md:text-4xl">
            Walk a village before you decide.
          </h2>
          <p class="mt-4 max-w-[42ch] text-sm text-[var(--text-secondary)]">
            Open Greenfield or Sunrise, or sign in to the platform console that registers HOA tenants.
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
            <NuxtLink to="/contact" class="btn-quiet">
              Request a walkthrough
            </NuxtLink>
          </div>
        </div>
      </section>
    </PlatformReveal>
  </div>
</template>
