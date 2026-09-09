import defaultTerminology from '~~/data/terminology/default.json'
import type { TerminologyFile } from '~/core/types'
import { useTenantStore } from '~/stores/tenant'

const overrideModules = import.meta.glob('~~/data/terminology/overrides/*.json', { eager: true })

function loadOverrides(): Record<string, Partial<TerminologyFile>> {
  const map: Record<string, Partial<TerminologyFile>> = {}
  for (const [path, mod] of Object.entries(overrideModules)) {
    const slug = path.split('/').pop()?.replace(/\.json$/, '')
    if (!slug) continue
    const data = (mod as { default?: Partial<TerminologyFile> }).default ?? (mod as Partial<TerminologyFile>)
    map[slug] = data
  }
  return map
}

const OVERRIDES = loadOverrides()

function getByPath(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key]
    }
    return undefined
  }, obj)
}

function deepMerge<T extends Record<string, unknown>>(base: T, override: Partial<T>): T {
  const result = { ...base } as T
  for (const key of Object.keys(override) as (keyof T)[]) {
    const baseVal = base[key]
    const overrideVal = override[key]
    if (
      baseVal
      && overrideVal
      && typeof baseVal === 'object'
      && typeof overrideVal === 'object'
      && !Array.isArray(baseVal)
    ) {
      result[key] = deepMerge(
        baseVal as Record<string, unknown>,
        overrideVal as Record<string, unknown>
      ) as T[keyof T]
    } else if (overrideVal !== undefined) {
      result[key] = overrideVal as T[keyof T]
    }
  }
  return result
}

export function useTerminology() {
  const tenant = useTenantStore()
  const { locale } = useI18n()

  const merged = computed(() => {
    const overrideSlug = tenant.organization?.terminologyOverrideSlug
    const base = defaultTerminology as unknown as Record<string, unknown>
    let result = defaultTerminology as TerminologyFile
    if (overrideSlug && OVERRIDES[overrideSlug]) {
      result = deepMerge(base, OVERRIDES[overrideSlug] as Record<string, unknown>) as unknown as TerminologyFile
    }
    // Locale-aware: prefer modules.{key}.label_{locale} if present in override/default
    return { ...result, _locale: locale.value }
  })

  function t(key: string, fallback?: string): string {
    const localeKey = `${key}_${locale.value}`
    const localized = getByPath(merged.value as unknown as Record<string, unknown>, localeKey)
    if (typeof localized === 'string') return localized

    const value = getByPath(merged.value as unknown as Record<string, unknown>, key)
    if (typeof value === 'string') return value
    if (value && typeof value === 'object' && 'label' in (value as object)) {
      const labelObj = value as { label: string, label_tl?: string }
      if (locale.value === 'tl' && labelObj.label_tl) return labelObj.label_tl
      return String(labelObj.label)
    }
    return fallback ?? key.split('.').pop() ?? key
  }

  return { t, terminology: merged, locale }
}
