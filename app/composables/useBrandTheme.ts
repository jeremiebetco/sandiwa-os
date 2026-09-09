import { accentOverrideFor, resolveBrandId } from '~/core/branding/registry'

export function useBrandTheme() {
  const { isPlatform, organization, slug } = useTenant()

  const brandId = computed(() => resolveBrandId({
    isPlatform: isPlatform.value,
    slug: slug.value,
    brandId: organization.value?.landing?.brandId
  }))

  const accentOverride = computed(() =>
    accentOverrideFor(brandId.value, organization.value?.landing?.accentColor)
  )

  useHead({
    htmlAttrs: {
      'data-brand': brandId,
      'class': 'light'
    }
  })

  watch([brandId, accentOverride], ([id, accent]) => {
    if (!import.meta.client) return
    const root = document.documentElement
    root.dataset.brand = id
    root.classList.remove('dark')
    root.classList.add('light')
    root.style.colorScheme = 'light'
    if (accent) root.style.setProperty('--brand-accent-override', accent)
    else root.style.removeProperty('--brand-accent-override')
  }, { immediate: true })

  return { brandId, accentOverride }
}
