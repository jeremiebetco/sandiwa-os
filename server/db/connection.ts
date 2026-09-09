import postgres from 'postgres'
import { isProductionRuntime } from '../utils/session-secret'

const LOCAL_APP_URL = 'postgresql://sandiwa_app:sandiwa@localhost:5433/sandiwa_os'
const LOCAL_ADMIN_URL = 'postgresql://sandiwa:sandiwa@localhost:5433/sandiwa_os'

export function getDatabaseUrl(kind: 'app' | 'admin' = 'app'): string {
  if (kind === 'admin') {
    const admin = process.env.DATABASE_URL_ADMIN || process.env.DATABASE_URL
    if (admin) return admin
    if (isProductionRuntime()) {
      throw new Error('DATABASE_URL_ADMIN (or DATABASE_URL) must be set in production')
    }
    return LOCAL_ADMIN_URL
  }

  const app = process.env.DATABASE_URL
  if (app) return app
  if (isProductionRuntime()) {
    throw new Error('DATABASE_URL must be set in production (no localhost fallback)')
  }
  return LOCAL_APP_URL
}

/** Password for the sandiwa_app role (created/updated by db:migrate). */
export function getAppRolePassword(): string {
  return process.env.SANDIWA_APP_DB_PASSWORD || 'sandiwa'
}

export function isSupabaseUrl(url: string): boolean {
  return url.includes('supabase.co')
}

export function postgresOptions(url: string, max?: number) {
  return {
    max: max ?? (process.env.NODE_ENV === 'production' ? 1 : 10),
    prepare: false,
    idle_timeout: 20,
    connect_timeout: 10,
    ssl: isSupabaseUrl(url) ? ('require' as const) : undefined
  }
}

export function createPostgresClient(url: string, max?: number) {
  return postgres(url, postgresOptions(url, max))
}

/** Substitute secrets into RLS SQL before execution. */
export function applyRlsSubstitutions(sqlText: string): string {
  const escapedPassword = getAppRolePassword().replace(/'/g, '\'\'')
  return sqlText.replaceAll('__SANDIWA_APP_PASSWORD__', escapedPassword)
}
