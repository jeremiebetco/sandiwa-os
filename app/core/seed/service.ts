import type { AppDatabase } from '~/core/types'
import { createSeedDatabase } from '~/core/seed/data'
import { DB_STORAGE_KEY, SEED_RESET_FLAG_KEY, SEED_VERSION } from '~/core/seed/constants'

export function loadDatabase(): AppDatabase {
  if (!import.meta.client) {
    return createSeedDatabase()
  }

  const resetFlag = localStorage.getItem(SEED_RESET_FLAG_KEY)
  if (resetFlag === '1') {
    localStorage.removeItem(SEED_RESET_FLAG_KEY)
    localStorage.removeItem(DB_STORAGE_KEY)
  }

  const raw = localStorage.getItem(DB_STORAGE_KEY)
  if (!raw) {
    const seed = createSeedDatabase()
    saveDatabase(seed)
    return seed
  }

  try {
    const parsed = JSON.parse(raw) as AppDatabase
    if (parsed.seedVersion !== SEED_VERSION) {
      const seed = createSeedDatabase()
      saveDatabase(seed)
      return seed
    }
    return parsed
  } catch {
    const seed = createSeedDatabase()
    saveDatabase(seed)
    return seed
  }
}

export function saveDatabase(db: AppDatabase): void {
  if (!import.meta.client) return
  localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(db))
}

export function requestSeedReset(): void {
  if (!import.meta.client) return
  localStorage.setItem(SEED_RESET_FLAG_KEY, '1')
}
