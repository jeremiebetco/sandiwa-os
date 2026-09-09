/**
 * Generates SQL files for Supabase SQL Editor.
 * Run: pnpm db:export-supabase
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { defaultLandingFor } from '../../app/core/branding/landing'
import { hashPassword } from '../utils/password'

const outDir = join(process.cwd(), 'server/db/supabase')
const DEMO_PASSWORD = 'demo1234'
const greenfieldId = 'org-greenfield-hoa'
const sunriseId = 'org-sunrise-condo'

const defaultFeatures = {
  intake: true,
  payments: true,
  ledger: false,
  polls: true,
  broadcasts: true,
  landing_editor: true,
  staff_management: true,
  announcements: true
}

function sqlString(value: string): string {
  return `'${value.replace(/'/g, '\'\'')}'`
}

function sqlJson(value: unknown): string {
  return `'${JSON.stringify(value).replace(/'/g, '\'\'')}'::jsonb`
}

function cleanMigration(sql: string): string {
  return sql
    .split('--> statement-breakpoint')
    .map(chunk => chunk.trim())
    .filter(Boolean)
    .join('\n\n')
}

async function main() {
  mkdirSync(outDir, { recursive: true })

  const migration = readFileSync(
    join(process.cwd(), 'server/db/migrations/0000_nasty_trauma.sql'),
    'utf8'
  )

  const rlsFiles = readdirSync(join(process.cwd(), 'server/db/rls'))
    .filter(f => f.endsWith('.sql'))
    .sort()
    .map(f => readFileSync(join(process.cwd(), 'server/db/rls', f), 'utf8'))
    .join('\n\n')

  const passwordHash = await hashPassword(DEMO_PASSWORD)

  const greenfieldLanding = defaultLandingFor('Greenfield Village HOA', {
    heroTitle: 'Welcome to Greenfield Village',
    heroSubtitle: 'Your homeowners association digital hub',
    welcomeMessage: 'Pay dues, file requests, and stay updated on community news in one place.',
    contactAddress: 'Greenfield Clubhouse, Greenfield Ave, Sta. Rosa, Laguna',
    contactPhone: '+63 49 123 4567',
    contactEmail: 'info@greenfield-hoa.local',
    officeHours: 'Mon-Fri 9:00 AM - 5:00 PM',
    brandId: 'greenfield',
    accentColor: '#1f6b3a'
  }, 'greenfield-hoa')

  const sunriseLanding = defaultLandingFor('Sunrise Condominium HOA', {
    heroTitle: 'Sunrise Condominium',
    heroSubtitle: 'Tower living, simplified',
    welcomeMessage: 'Manage your unit fees and community updates from your phone.',
    contactAddress: 'Tower A Lobby, Sunrise Blvd, Makati City',
    contactPhone: '+63 2 876 5432',
    contactEmail: 'admin@sunrise-condo.local',
    officeHours: 'Daily 8:00 AM - 6:00 PM',
    brandId: 'sunrise',
    accentColor: '#8b5429'
  }, 'sunrise-condo')

  const schemaSql = `-- Sandiwa OS — schema (run first in Supabase SQL Editor)
-- Safe to re-run on empty database only.

${cleanMigration(migration)}
`

  const rlsSql = `-- Sandiwa OS — RLS + app role (run second)
-- Change the password on the line marked CHANGE_ME, then run.

${rlsFiles.replaceAll('__SANDIWA_APP_PASSWORD__', 'CHANGE_ME')}
`

  const seedSql = `-- Sandiwa OS — demo seed (run third)
-- Demo login password for all accounts: ${DEMO_PASSWORD}

TRUNCATE TABLE
  broadcast_deliveries, broadcasts, poll_votes, polls,
  ledger_entries, disbursement_vouchers, ledger_accounts,
  clearance_requests, payments, invoices, assessment_types,
  units, intake_cases, announcements, sessions, officers,
  org_users, platform_admins, organizations
CASCADE;

INSERT INTO organizations (id, slug, name, address, contact_email, contact_phone, plan_tier, status, terminology_override_slug, features, landing, logo_url, hero_image_url) VALUES
  (${sqlString(greenfieldId)}, ${sqlString('greenfield-hoa')}, ${sqlString('Greenfield Village HOA')}, ${sqlString('Greenfield Ave, Sta. Rosa, Laguna')}, ${sqlString('info@greenfield-hoa.local')}, ${sqlString('+63 49 123 4567')}, 'premium', 'active', ${sqlString('greenfield-hoa')}, ${sqlJson({ ...defaultFeatures, ledger: false })}, ${sqlJson(greenfieldLanding)}, ${sqlString('/assets/orgs/greenfield-logo.png')}, ${sqlString('/assets/orgs/greenfield-hero.png')}),
  (${sqlString(sunriseId)}, ${sqlString('sunrise-condo')}, ${sqlString('Sunrise Condominium HOA')}, ${sqlString('Sunrise Blvd, Makati City')}, ${sqlString('admin@sunrise-condo.local')}, ${sqlString('+63 2 876 5432')}, 'standard', 'active', NULL, ${sqlJson({ ...defaultFeatures, ledger: true, broadcasts: false })}, ${sqlJson(sunriseLanding)}, ${sqlString('/assets/orgs/sunrise-logo.png')}, ${sqlString('/assets/orgs/sunrise-hero.png')});

INSERT INTO platform_admins (id, email, password_hash, name, status) VALUES
  (${sqlString('plat-1')}, ${sqlString('admin@sandiwa.local')}, ${sqlString(passwordHash)}, ${sqlString('Platform Administrator')}, 'active');

INSERT INTO org_users (id, organization_id, email, password_hash, name, role, unit_label, member_no, status) VALUES
  (${sqlString('user-gf-admin')}, ${sqlString(greenfieldId)}, ${sqlString('admin@greenfield-hoa.local')}, ${sqlString(passwordHash)}, ${sqlString('Elena Garcia')}, 'org_admin', NULL, NULL, 'active'),
  (${sqlString('user-gf-member')}, ${sqlString(greenfieldId)}, ${sqlString('member@greenfield-hoa.local')}, ${sqlString(passwordHash)}, ${sqlString('Pedro Ramos')}, 'member', ${sqlString('Block 3 Lot 12')}, ${sqlString('GF-0312')}, 'active'),
  (${sqlString('user-sc-admin')}, ${sqlString(sunriseId)}, ${sqlString('admin@sunrise-condo.local')}, ${sqlString(passwordHash)}, ${sqlString('Grace Tan')}, 'org_admin', NULL, NULL, 'active');

INSERT INTO units (id, organization_id, code, phase, block, lot, tower, floor, unit_type, occupancy, owner_user_id, area_sqm, status) VALUES
  (${sqlString('unit-gf-0312')}, ${sqlString(greenfieldId)}, ${sqlString('B3-L12')}, ${sqlString('Phase 1')}, ${sqlString('3')}, ${sqlString('12')}, NULL, NULL, 'house', 'owner_occupied', ${sqlString('user-gf-member')}, 120.00, 'active'),
  (${sqlString('unit-sc-a12b')}, ${sqlString(sunriseId)}, ${sqlString('A-12B')}, NULL, NULL, NULL, ${sqlString('A')}, ${sqlString('12')}, 'condo', 'owner_occupied', ${sqlString('user-sc-member')}, 48.00, 'active');

INSERT INTO announcements (id, organization_id, title, body, published_at, author_id) VALUES
  (${sqlString('ann-1')}, ${sqlString(greenfieldId)}, ${sqlString('Annual General Meeting — March 15')}, ${sqlString('All homeowners are invited to the AGM at the clubhouse on March 15, 2:00 PM.')}, '2026-03-01T08:00:00Z', ${sqlString('user-gf-admin')});
`

  const readme = `# Supabase setup (SQL Editor)

Run these **in order** in Supabase → **SQL Editor** → **New query**:

1. \`01_schema.sql\` — creates tables
2. \`02_rls.sql\` — edit \`CHANGE_ME\` to a password you choose, then run
3. \`03_seed.sql\` — demo data (login password: \`${DEMO_PASSWORD}\`)

## Vercel

Set \`DATABASE_URL\` to your Supabase **transaction pooler** URL (port 6543), with:

- user: \`sandiwa_app.YOUR_PROJECT_REF\`
- password: same value you used instead of \`CHANGE_ME\` in \`02_rls.sql\`

Also set \`SESSION_SECRET\` and \`NUXT_PUBLIC_PLATFORM_DOMAIN\`.

Regenerate these files after schema changes: \`pnpm db:export-supabase\`
`

  writeFileSync(join(outDir, '01_schema.sql'), schemaSql)
  writeFileSync(join(outDir, '02_rls.sql'), rlsSql)
  writeFileSync(join(outDir, '03_seed.sql'), seedSql)
  writeFileSync(join(outDir, 'README.md'), readme)

  console.log('Wrote server/db/supabase/')
  console.log('  01_schema.sql')
  console.log('  02_rls.sql')
  console.log('  03_seed.sql')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
