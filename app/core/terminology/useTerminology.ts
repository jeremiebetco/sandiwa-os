import defaultTerminology from '~~/data/terminology/default.json'
import greenfieldOverride from '~~/data/terminology/overrides/greenfield-hoa.json'
import type { TerminologyFile } from '~/core/types'
import { useTenantStore } from '~/stores/tenant'

const OVERRIDES: Record<string, Partial<TerminologyFile>> = {
  'greenfield-hoa': greenfieldOverride as Partial<TerminologyFile>
}

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

  const merged = computed(() => {
    const overrideSlug = tenant.organization?.terminologyOverrideSlug
    const base = defaultTerminology as unknown as Record<string, unknown>
    if (overrideSlug && OVERRIDES[overrideSlug]) {
      return deepMerge(base, OVERRIDES[overrideSlug] as Record<string, unknown>) as unknown as TerminologyFile
    }
    return defaultTerminology as TerminologyFile
  })

  function t(key: string, fallback?: string): string {
    const value = getByPath(merged.value as unknown as Record<string, unknown>, key)
    if (typeof value === 'string') return value
    if (value && typeof value === 'object' && 'label' in (value as object)) {
      return String((value as { label: string }).label)
    }
    return fallback ?? key.split('.').pop() ?? key
  }

  return { t, terminology: merged }
}
