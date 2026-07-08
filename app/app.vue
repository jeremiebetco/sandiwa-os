<script setup lang="ts">
const tenant = useTenant()
const auth = useAuth()
const route = useRoute()

const layoutName = computed(() => {
  if (tenant.isPlatform.value) return 'platform'
  if (tenant.isOrganization.value && auth.isOrgStaff.value && route.path.startsWith('/console')) {
    return 'console'
  }
  if (tenant.isOrganization.value) return 'impact'
  return 'platform'
})
</script>

<template>
  <UApp>
    <NuxtLayout :name="layoutName">
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
