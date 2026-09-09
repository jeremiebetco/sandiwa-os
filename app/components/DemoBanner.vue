<script setup lang="ts">
const STORAGE_KEY = 'sandiwa-demo-banner-dismissed'

const visible = ref(false)

onMounted(() => {
  try {
    visible.value = sessionStorage.getItem(STORAGE_KEY) !== '1'
  } catch {
    visible.value = true
  }
})

function dismiss() {
  visible.value = false
  try {
    sessionStorage.setItem(STORAGE_KEY, '1')
  } catch {
    // ignore
  }
}
</script>

<template>
  <div
    v-if="visible"
    class="demo-banner"
    role="status"
  >
    <p class="demo-banner__text">
      <strong>Public demo</strong>
      — shared sample accounts, not a live HOA. Do not enter real member or payment data.
      See the repository <code>SECURITY.md</code>.
    </p>
    <button
      type="button"
      class="demo-banner__dismiss interactive-states"
      aria-label="Dismiss demo notice"
      @click="dismiss"
    >
      Dismiss
    </button>
  </div>
</template>
