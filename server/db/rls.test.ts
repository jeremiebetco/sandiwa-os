/**
 * RLS integration tests — requires DATABASE_URL pointing at a migrated DB.
 * Skips automatically when Postgres is unreachable.
 */
import { describe, expect, it, beforeAll } from 'vitest'
import postgres from 'postgres'

const url = process.env.DATABASE_URL || 'postgresql://sandiwa_app:sandiwa@localhost:5433/sandiwa_os'

let available = false
let sql: ReturnType<typeof postgres>

beforeAll(async () => {
  try {
    sql = postgres(url, { max: 1, connect_timeout: 3 })
    await sql`SELECT 1`
    available = true
  } catch {
    available = false
  }
})

describe('Postgres RLS tenant isolation', () => {
  it('org A context cannot read org B intake cases', async ({ skip }) => {
    if (!available) skip()

    await sql.begin(async (tx) => {
      await tx`SELECT set_config('app.current_org_id', 'org-greenfield-hoa', true)`
      await tx`SELECT set_config('app.is_platform_admin', 'false', true)`
      const rows = await tx`
        SELECT organization_id FROM intake_cases
      `
      expect(rows.every(r => r.organization_id === 'org-greenfield-hoa')).toBe(true)
      expect(rows.some(r => r.organization_id === 'org-sunrise-condo')).toBe(false)
    })
  })

  it('platform admin can list all organizations', async ({ skip }) => {
    if (!available) skip()

    await sql.begin(async (tx) => {
      await tx`SELECT set_config('app.is_platform_admin', 'true', true)`
      const rows = await tx`SELECT slug FROM organizations ORDER BY slug`
      const slugs = rows.map(r => r.slug)
      expect(slugs).toContain('greenfield-hoa')
      expect(slugs).toContain('sunrise-condo')
    })
  })

  it('public_read only returns active orgs', async ({ skip }) => {
    if (!available) skip()

    await sql.begin(async (tx) => {
      await tx`SELECT set_config('app.public_read', 'true', true)`
      const rows = await tx`SELECT status FROM organizations`
      expect(rows.every(r => r.status === 'active')).toBe(true)
    })
  })
})
