import { config } from 'dotenv'
import { getDatabaseUrl } from './connection'

config()

// Seed as table owner (superuser). App runtime uses sandiwa_app which is subject to RLS.
process.env.DATABASE_URL = getDatabaseUrl('admin')

const { defaultLandingFor } = await import('../../app/core/branding/landing')
const { hashPassword } = await import('../utils/password')
const { db, sqlClient } = await import('./client')
const schema = await import('./schema')
const {
  announcements,
  assessmentTypes,
  broadcastDeliveries,
  broadcasts,
  clearanceRequests,
  disbursementVouchers,
  intakeCases,
  invoices,
  ledgerAccounts,
  ledgerEntries,
  officers,
  organizations,
  orgUsers,
  payments,
  platformAdmins,
  polls,
  pollVotes,
  units
} = schema

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

async function clearAll() {
  // Order matters for FKs when RLS is off during seed — use platform-like truncate
  await sqlClient.unsafe(`
    TRUNCATE TABLE
      broadcast_deliveries,
      broadcasts,
      poll_votes,
      polls,
      ledger_entries,
      disbursement_vouchers,
      ledger_accounts,
      clearance_requests,
      payments,
      invoices,
      assessment_types,
      units,
      intake_cases,
      announcements,
      sessions,
      officers,
      org_users,
      platform_admins,
      organizations
    CASCADE
  `)
}

async function seed() {
  console.log('Seeding database...')
  const passwordHash = await hashPassword(DEMO_PASSWORD)

  // Seed runs as app role with FORCE RLS — elevate to platform admin for writes
  await sqlClient.unsafe(`SELECT set_config('app.is_platform_admin', 'true', false)`)

  await clearAll()

  await db.insert(organizations).values([
    {
      id: greenfieldId,
      slug: 'greenfield-hoa',
      name: 'Greenfield Village HOA',
      address: 'Greenfield Ave, Sta. Rosa, Laguna',
      contactEmail: 'info@greenfield-hoa.local',
      contactPhone: '+63 49 123 4567',
      planTier: 'premium',
      status: 'active',
      terminologyOverrideSlug: 'greenfield-hoa',
      features: { ...defaultFeatures, ledger: false },
      landing: defaultLandingFor('Greenfield Village HOA', {
        heroTitle: 'Welcome to Greenfield Village',
        heroSubtitle: 'Your homeowners association digital hub',
        welcomeMessage: 'Pay dues, file requests, and stay updated on community news in one place.',
        contactAddress: 'Greenfield Clubhouse, Greenfield Ave, Sta. Rosa, Laguna',
        contactPhone: '+63 49 123 4567',
        contactEmail: 'info@greenfield-hoa.local',
        officeHours: 'Mon-Fri 9:00 AM - 5:00 PM',
        brandId: 'greenfield',
        accentColor: '#1f6b3a'
      }, 'greenfield-hoa'),
      logoUrl: '/assets/orgs/greenfield-logo.png',
      heroImageUrl: '/assets/orgs/greenfield-hero.png'
    },
    {
      id: sunriseId,
      slug: 'sunrise-condo',
      name: 'Sunrise Condominium HOA',
      address: 'Sunrise Blvd, Makati City',
      contactEmail: 'admin@sunrise-condo.local',
      contactPhone: '+63 2 876 5432',
      planTier: 'standard',
      status: 'active',
      features: {
        intake: true,
        payments: true,
        ledger: true,
        polls: true,
        broadcasts: false,
        landing_editor: true,
        staff_management: true,
        announcements: true
      },
      landing: defaultLandingFor('Sunrise Condominium HOA', {
        heroTitle: 'Sunrise Condominium',
        heroSubtitle: 'Tower living, simplified',
        welcomeMessage: 'Manage your unit fees and community updates from your phone.',
        contactAddress: 'Tower A Lobby, Sunrise Blvd, Makati City',
        contactPhone: '+63 2 876 5432',
        contactEmail: 'admin@sunrise-condo.local',
        officeHours: 'Daily 8:00 AM - 6:00 PM',
        brandId: 'sunrise',
        accentColor: '#8b5429'
      }, 'sunrise-condo'),
      logoUrl: '/assets/orgs/sunrise-logo.png',
      heroImageUrl: '/assets/orgs/sunrise-hero.png'
    }
  ])

  await db.insert(officers).values([
    { id: 'off-1', organizationId: greenfieldId, name: 'Maria Santos', position: 'HOA President', contact: 'president@greenfield-hoa.local', photoUrl: '/assets/officers/maria-santos.png', sortOrder: 1 },
    { id: 'off-2', organizationId: greenfieldId, name: 'Juan Dela Cruz', position: 'Treasurer', contact: 'treasurer@greenfield-hoa.local', photoUrl: '/assets/officers/juan-dela-cruz.png', sortOrder: 2 },
    { id: 'off-3', organizationId: greenfieldId, name: 'Ana Reyes', position: 'Secretary', contact: 'secretary@greenfield-hoa.local', photoUrl: '/assets/officers/ana-reyes.png', sortOrder: 3 },
    { id: 'off-s1', organizationId: sunriseId, name: 'Roberto Lim', position: 'Board President', contact: 'board@sunrise-condo.local', photoUrl: '/assets/officers/roberto-lim.png', sortOrder: 1 }
  ])

  await db.insert(platformAdmins).values({
    id: 'plat-1',
    email: 'admin@sandiwa.local',
    passwordHash,
    name: 'Platform Administrator',
    status: 'active'
  })

  await db.insert(orgUsers).values([
    { id: 'user-gf-admin', organizationId: greenfieldId, email: 'admin@greenfield-hoa.local', passwordHash, name: 'Elena Garcia', role: 'org_admin', status: 'active' },
    { id: 'user-gf-manager', organizationId: greenfieldId, email: 'manager@greenfield-hoa.local', passwordHash, name: 'Carlos Mendoza', role: 'manager', status: 'active' },
    { id: 'user-gf-chair', organizationId: greenfieldId, email: 'chair@greenfield-hoa.local', passwordHash, name: 'Liza Fernandez', role: 'committee_lead', status: 'active' },
    { id: 'user-gf-staff', organizationId: greenfieldId, email: 'staff@greenfield-hoa.local', passwordHash, name: 'Rico Santos', role: 'staff', status: 'active' },
    { id: 'user-gf-member', organizationId: greenfieldId, email: 'member@greenfield-hoa.local', passwordHash, name: 'Pedro Ramos', role: 'member', unitLabel: 'Block 3 Lot 12', memberNo: 'GF-0312', status: 'active' },
    { id: 'user-gf-member2', organizationId: greenfieldId, email: 'member2@greenfield-hoa.local', passwordHash, name: 'Sofia Cruz', role: 'member', unitLabel: 'Block 5 Lot 08', memberNo: 'GF-0508', status: 'active' },
    { id: 'user-sc-admin', organizationId: sunriseId, email: 'admin@sunrise-condo.local', passwordHash, name: 'Grace Tan', role: 'org_admin', status: 'active' },
    { id: 'user-sc-member', organizationId: sunriseId, email: 'member@sunrise-condo.local', passwordHash, name: 'Miguel Reyes', role: 'member', unitLabel: 'Tower A 12B', memberNo: 'SC-A12B', status: 'active' }
  ])

  await db.insert(units).values([
    { id: 'unit-gf-0312', organizationId: greenfieldId, code: 'B3-L12', phase: 'Phase 1', block: '3', lot: '12', unitType: 'house', occupancy: 'owner_occupied', ownerUserId: 'user-gf-member', areaSqm: '120.00' },
    { id: 'unit-gf-0508', organizationId: greenfieldId, code: 'B5-L08', phase: 'Phase 2', block: '5', lot: '08', unitType: 'house', occupancy: 'owner_occupied', ownerUserId: 'user-gf-member2', areaSqm: '95.00' },
    { id: 'unit-gf-0101', organizationId: greenfieldId, code: 'B1-L01', phase: 'Phase 1', block: '1', lot: '01', unitType: 'house', occupancy: 'tenant', areaSqm: '110.00' },
    { id: 'unit-sc-a12b', organizationId: sunriseId, code: 'A-12B', tower: 'A', floor: '12', unitType: 'condo', occupancy: 'owner_occupied', ownerUserId: 'user-sc-member', areaSqm: '48.00' },
    { id: 'unit-sc-b0504', organizationId: sunriseId, code: 'B-0504', tower: 'B', floor: '5', unitType: 'condo', occupancy: 'vacant', areaSqm: '52.00' }
  ])

  await db.insert(announcements).values([
    { id: 'ann-1', organizationId: greenfieldId, title: 'Annual General Meeting — March 15', body: 'All homeowners are invited to the AGM at the clubhouse on March 15, 2:00 PM. Please bring your homeowner ID.', publishedAt: new Date('2026-03-01T08:00:00.000Z'), authorId: 'user-gf-admin' },
    { id: 'ann-2', organizationId: greenfieldId, title: 'Water Interruption Advisory', body: 'Scheduled maintenance on March 10, 9 AM – 12 NN. Please store water in advance.', publishedAt: new Date('2026-03-05T10:00:00.000Z'), authorId: 'user-gf-manager' },
    { id: 'ann-3', organizationId: sunriseId, title: 'Elevator Maintenance', body: 'Tower B elevator maintenance on March 12. Use Tower A elevator during this period.', publishedAt: new Date('2026-03-04T09:00:00.000Z'), authorId: 'user-sc-admin' }
  ])

  await db.insert(intakeCases).values([
    { id: 'case-1', organizationId: greenfieldId, memberId: 'user-gf-member', memberName: 'Pedro Ramos', unit: 'Block 3 Lot 12', description: 'Streetlight near Block 3 has been out for a week. Madilim sa gabi, delikado.', category: 'street_lights', sentiment: 'concerned', status: 'in_progress', assignedToId: 'user-gf-chair', assignedToName: 'Liza Fernandez', createdAt: new Date('2026-03-02T14:30:00.000Z'), updatedAt: new Date('2026-03-03T09:00:00.000Z') },
    { id: 'case-2', organizationId: greenfieldId, memberId: 'user-gf-member', memberName: 'Pedro Ramos', unit: 'Block 3 Lot 12', description: 'Noise complaint — loud music past 10 PM from neighboring lot.', category: 'noise', sentiment: 'urgent', status: 'open', createdAt: new Date('2026-03-06T22:15:00.000Z'), updatedAt: new Date('2026-03-06T22:15:00.000Z') },
    { id: 'case-3', organizationId: sunriseId, memberId: 'user-sc-member', memberName: 'Miguel Reyes', unit: 'Tower A 12B', description: 'Leaking pipe in parking level P2 near slot 45.', category: 'water', sentiment: 'urgent', status: 'open', createdAt: new Date('2026-03-07T07:00:00.000Z'), updatedAt: new Date('2026-03-07T07:00:00.000Z') }
  ])

  await db.insert(assessmentTypes).values([
    { id: 'ast-gf-dues', organizationId: greenfieldId, code: 'MONTHLY_DUES', name: 'Monthly Association Dues', defaultAmount: '2500.00', frequency: 'monthly' },
    { id: 'ast-gf-garbage', organizationId: greenfieldId, code: 'GARBAGE', name: 'Garbage Collection', defaultAmount: '300.00', frequency: 'monthly' },
    { id: 'ast-gf-sticker', organizationId: greenfieldId, code: 'STICKER', name: 'Vehicle Sticker', defaultAmount: '500.00', frequency: 'yearly' },
    { id: 'ast-sc-dues', organizationId: sunriseId, code: 'MONTHLY_DUES', name: 'Monthly Condo Dues', defaultAmount: '4500.00', frequency: 'monthly' },
    { id: 'ast-sc-parking', organizationId: sunriseId, code: 'PARKING', name: 'Parking Slot Fee', defaultAmount: '1500.00', frequency: 'monthly' }
  ])

  await db.insert(invoices).values([
    { id: 'inv-gf-1', organizationId: greenfieldId, unitId: 'unit-gf-0312', assessmentTypeId: 'ast-gf-dues', period: '2026-03', description: 'Monthly Association Dues — March 2026', amount: '2500.00', penaltyAmount: '0', amountPaid: '2500.00', status: 'paid', dueDate: '2026-03-10', issuedAt: new Date('2026-03-01T00:00:00Z') },
    { id: 'inv-gf-2', organizationId: greenfieldId, unitId: 'unit-gf-0312', assessmentTypeId: 'ast-gf-dues', period: '2026-04', description: 'Monthly Association Dues — April 2026', amount: '2500.00', penaltyAmount: '0', amountPaid: '0', status: 'open', dueDate: '2026-04-10', issuedAt: new Date('2026-04-01T00:00:00Z') },
    { id: 'inv-gf-3', organizationId: greenfieldId, unitId: 'unit-gf-0312', assessmentTypeId: 'ast-gf-garbage', period: '2026-04', description: 'Garbage Collection — April 2026', amount: '300.00', penaltyAmount: '0', amountPaid: '0', status: 'open', dueDate: '2026-04-10', issuedAt: new Date('2026-04-01T00:00:00Z') },
    { id: 'inv-gf-4', organizationId: greenfieldId, unitId: 'unit-gf-0508', assessmentTypeId: 'ast-gf-dues', period: '2026-02', description: 'Monthly Association Dues — February 2026', amount: '2500.00', penaltyAmount: '125.00', amountPaid: '0', status: 'overdue', dueDate: '2026-02-10', issuedAt: new Date('2026-02-01T00:00:00Z') },
    { id: 'inv-sc-1', organizationId: sunriseId, unitId: 'unit-sc-a12b', assessmentTypeId: 'ast-sc-dues', period: '2026-04', description: 'Monthly Condo Dues — April 2026', amount: '4500.00', penaltyAmount: '0', amountPaid: '0', status: 'open', dueDate: '2026-04-15', issuedAt: new Date('2026-04-01T00:00:00Z') }
  ])

  await db.insert(payments).values([
    { id: 'pay-gf-1', organizationId: greenfieldId, unitId: 'unit-gf-0312', invoiceId: 'inv-gf-1', amount: '2500.00', method: 'gcash', reference: 'GCASH-884421', status: 'verified', submittedById: 'user-gf-member', verifiedById: 'user-gf-manager', paidAt: new Date('2026-03-08T10:00:00Z'), verifiedAt: new Date('2026-03-08T14:00:00Z') },
    { id: 'pay-gf-2', organizationId: greenfieldId, unitId: 'unit-gf-0312', invoiceId: 'inv-gf-2', amount: '2500.00', method: 'maya', reference: 'MAYA-112233', status: 'pending', submittedById: 'user-gf-member', paidAt: new Date('2026-04-05T09:30:00Z') }
  ])

  await db.insert(clearanceRequests).values([
    { id: 'clr-gf-1', organizationId: greenfieldId, unitId: 'unit-gf-0312', requesterId: 'user-gf-member', requesterName: 'Pedro Ramos', type: 'hoa_clearance', purpose: 'Bank loan requirement', status: 'pending' },
    { id: 'clr-sc-1', organizationId: sunriseId, unitId: 'unit-sc-a12b', requesterId: 'user-sc-member', requesterName: 'Miguel Reyes', type: 'move_out', purpose: 'End of lease', status: 'approved', reviewedById: 'user-sc-admin', reviewNotes: 'Accounts cleared' }
  ])

  await db.insert(ledgerAccounts).values([
    { id: 'la-gf-cash', organizationId: greenfieldId, code: '1000', name: 'Cash on Hand', accountType: 'asset', fundCategory: 'operating' },
    { id: 'la-gf-bank', organizationId: greenfieldId, code: '1100', name: 'Bank — BPI Operating', accountType: 'asset', fundCategory: 'operating' },
    { id: 'la-gf-dues', organizationId: greenfieldId, code: '4000', name: 'Association Dues Income', accountType: 'income', fundCategory: 'operating' },
    { id: 'la-gf-maint', organizationId: greenfieldId, code: '5000', name: 'Maintenance Expense', accountType: 'expense', fundCategory: 'operating' },
    { id: 'la-sc-cash', organizationId: sunriseId, code: '1000', name: 'Cash on Hand', accountType: 'asset', fundCategory: 'operating' },
    { id: 'la-sc-dues', organizationId: sunriseId, code: '4000', name: 'Condo Dues Income', accountType: 'income', fundCategory: 'operating' },
    { id: 'la-sc-util', organizationId: sunriseId, code: '5100', name: 'Utilities Expense', accountType: 'expense', fundCategory: 'operating' }
  ])

  await db.insert(disbursementVouchers).values([
    { id: 'dv-gf-1', organizationId: greenfieldId, accountId: 'la-gf-maint', payee: 'Bright Lights Electric', description: 'Streetlight bulb replacement — Block 3', amount: '8500.00', status: 'pending_approval', requestedById: 'user-gf-manager' },
    { id: 'dv-sc-1', organizationId: sunriseId, accountId: 'la-sc-util', payee: 'Meralco', description: 'Common area electricity — March', amount: '42000.00', status: 'approved', requestedById: 'user-sc-admin', approvedById: 'user-sc-admin' }
  ])

  await db.insert(ledgerEntries).values([
    { id: 'le-gf-1', organizationId: greenfieldId, accountId: 'la-gf-bank', entryDate: '2026-03-08', description: 'Dues payment Pedro Ramos March', debit: '2500.00', credit: '0', referenceType: 'payment', referenceId: 'pay-gf-1' },
    { id: 'le-gf-2', organizationId: greenfieldId, accountId: 'la-gf-dues', entryDate: '2026-03-08', description: 'Dues income March', debit: '0', credit: '2500.00', referenceType: 'payment', referenceId: 'pay-gf-1' }
  ])

  await db.insert(polls).values([
    { id: 'poll-gf-1', organizationId: greenfieldId, title: 'Clubhouse renovation budget', description: 'Approve ₱1.2M budget for clubhouse roof and AC upgrade.', status: 'open', eligibility: 'per_unit', quorumPercent: 50, options: ['Yes, approve', 'No, defer', 'Abstain'], opensAt: new Date('2026-03-01T00:00:00Z'), closesAt: new Date('2026-04-30T23:59:59Z'), createdById: 'user-gf-admin' },
    { id: 'poll-sc-1', organizationId: sunriseId, title: 'Pet policy update', description: 'Allow small dogs under 10kg in common areas on leash.', status: 'closed', eligibility: 'per_member', quorumPercent: 40, options: ['Approve', 'Reject'], opensAt: new Date('2026-02-01T00:00:00Z'), closesAt: new Date('2026-02-28T23:59:59Z'), createdById: 'user-sc-admin', summary: 'Majority approved the pet policy update.' }
  ])

  await db.insert(pollVotes).values([
    { id: 'vote-1', organizationId: greenfieldId, pollId: 'poll-gf-1', unitId: 'unit-gf-0312', voterId: 'user-gf-member', optionIndex: 0, comment: 'Kailangan na talaga ng bagong bubong.' },
    { id: 'vote-2', organizationId: sunriseId, pollId: 'poll-sc-1', unitId: 'unit-sc-a12b', voterId: 'user-sc-member', optionIndex: 0 }
  ])

  await db.insert(broadcasts).values([
    { id: 'bc-gf-1', organizationId: greenfieldId, title: 'Typhoon Signal Watch', body: 'Signal No. 1 possible tonight. Secure outdoor items. Clubhouse open as evacuation point if needed.', severity: 'emergency', channel: 'portal', createdById: 'user-gf-manager', sentAt: new Date('2026-03-09T16:00:00Z') },
    { id: 'bc-gf-2', organizationId: greenfieldId, title: 'Garbage collection delay', body: 'Tuesday collection moves to Wednesday due to truck maintenance.', severity: 'info', channel: 'portal', audiencePhase: 'Phase 1', createdById: 'user-gf-staff', sentAt: new Date('2026-03-10T08:00:00Z') }
  ])

  await db.insert(broadcastDeliveries).values([
    { id: 'bd-1', organizationId: greenfieldId, broadcastId: 'bc-gf-1', recipientId: 'user-gf-member', channel: 'portal', status: 'sent', deliveredAt: new Date('2026-03-09T16:01:00Z') },
    { id: 'bd-2', organizationId: greenfieldId, broadcastId: 'bc-gf-1', recipientId: 'user-gf-member2', channel: 'portal', status: 'read', deliveredAt: new Date('2026-03-09T16:01:00Z') }
  ])

  console.log('Seed complete. Demo password for all accounts:', DEMO_PASSWORD)
  await sqlClient.end({ timeout: 5 })
}

seed().catch(async (err) => {
  console.error(err)
  try {
    await sqlClient.end({ timeout: 1 })
  } catch {
    // ignore
  }
  process.exit(1)
})
