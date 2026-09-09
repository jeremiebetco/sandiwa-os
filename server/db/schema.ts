import {
  boolean,
  date,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar
} from 'drizzle-orm/pg-core'

export const orgRoleEnum = pgEnum('org_role', [
  'org_admin',
  'manager',
  'committee_lead',
  'staff',
  'member'
])

export const planTierEnum = pgEnum('plan_tier', ['basic', 'standard', 'premium'])
export const orgStatusEnum = pgEnum('org_status', ['active', 'inactive'])
export const userStatusEnum = pgEnum('user_status', ['active', 'inactive'])
export const intakeStatusEnum = pgEnum('intake_status', ['open', 'in_progress', 'resolved', 'closed'])
export const sentimentEnum = pgEnum('sentiment', ['neutral', 'concerned', 'urgent'])
export const unitTypeEnum = pgEnum('unit_type', ['house', 'townhouse', 'condo', 'parking', 'other'])
export const occupancyEnum = pgEnum('occupancy_status', ['owner_occupied', 'tenant', 'vacant'])
export const invoiceStatusEnum = pgEnum('invoice_status', ['draft', 'open', 'partial', 'paid', 'void', 'overdue'])
export const paymentMethodEnum = pgEnum('payment_method', ['gcash', 'maya', 'bank_transfer', 'cash', 'check', 'other'])
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'verified', 'rejected'])
export const clearanceTypeEnum = pgEnum('clearance_type', ['hoa_clearance', 'move_in', 'move_out', 'resale', 'certificate'])
export const clearanceStatusEnum = pgEnum('clearance_status', ['pending', 'approved', 'rejected', 'issued'])
export const accountTypeEnum = pgEnum('account_type', ['asset', 'liability', 'equity', 'income', 'expense'])
export const voucherStatusEnum = pgEnum('voucher_status', ['draft', 'pending_approval', 'approved', 'paid', 'rejected'])
export const pollStatusEnum = pgEnum('poll_status', ['draft', 'open', 'closed'])
export const pollEligibilityEnum = pgEnum('poll_eligibility', ['per_unit', 'per_member'])
export const broadcastSeverityEnum = pgEnum('broadcast_severity', ['info', 'warning', 'emergency'])
export const broadcastChannelEnum = pgEnum('broadcast_channel', ['portal', 'sms', 'both'])
export const deliveryStatusEnum = pgEnum('delivery_status', ['queued', 'sent', 'failed', 'read'])
export const sessionContextEnum = pgEnum('session_context', ['platform', 'organization'])

export const organizations = pgTable('organizations', {
  id: text('id').primaryKey(),
  slug: varchar('slug', { length: 64 }).notNull().unique(),
  name: text('name').notNull(),
  address: text('address').notNull().default(''),
  contactEmail: text('contact_email').notNull().default(''),
  contactPhone: text('contact_phone').notNull().default(''),
  planTier: planTierEnum('plan_tier').notNull().default('basic'),
  status: orgStatusEnum('status').notNull().default('active'),
  terminologyOverrideSlug: varchar('terminology_override_slug', { length: 64 }),
  features: jsonb('features').$type<Record<string, boolean>>().notNull().default({}),
  landing: jsonb('landing').$type<Record<string, string>>().notNull().default({}),
  logoUrl: text('logo_url'),
  heroImageUrl: text('hero_image_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
})

export const officers = pgTable('officers', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  position: text('position').notNull(),
  contact: text('contact'),
  photoUrl: text('photo_url'),
  sortOrder: integer('sort_order').notNull().default(0)
})

export const platformAdmins = pgTable('platform_admins', {
  id: text('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  status: userStatusEnum('status').notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
})

export const orgUsers = pgTable('org_users', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  email: varchar('email', { length: 255 }).notNull(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  role: orgRoleEnum('role').notNull(),
  unitLabel: text('unit_label'),
  memberNo: varchar('member_no', { length: 64 }),
  status: userStatusEnum('status').notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, table => [
  uniqueIndex('org_users_org_email_idx').on(table.organizationId, table.email)
])

export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  tokenHash: text('token_hash').notNull().unique(),
  userId: text('user_id').notNull(),
  context: sessionContextEnum('context').notNull(),
  organizationId: text('organization_id').references(() => organizations.id, { onDelete: 'cascade' }),
  organizationSlug: varchar('organization_slug', { length: 64 }),
  role: text('role').notNull(),
  email: text('email').notNull(),
  name: text('name').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
})

export const announcements = pgTable('announcements', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  body: text('body').notNull(),
  publishedAt: timestamp('published_at', { withTimezone: true }).notNull().defaultNow(),
  authorId: text('author_id').notNull()
})

export const intakeCases = pgTable('intake_cases', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  memberId: text('member_id').notNull(),
  memberName: text('member_name').notNull(),
  unit: text('unit'),
  description: text('description').notNull(),
  category: text('category').notNull(),
  sentiment: sentimentEnum('sentiment').notNull().default('neutral'),
  status: intakeStatusEnum('status').notNull().default('open'),
  assignedToId: text('assigned_to_id'),
  assignedToName: text('assigned_to_name'),
  resolutionNotes: text('resolution_notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
})

export const units = pgTable('units', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  code: varchar('code', { length: 64 }).notNull(),
  phase: varchar('phase', { length: 64 }),
  block: varchar('block', { length: 64 }),
  lot: varchar('lot', { length: 64 }),
  tower: varchar('tower', { length: 64 }),
  floor: varchar('floor', { length: 32 }),
  unitType: unitTypeEnum('unit_type').notNull().default('house'),
  occupancy: occupancyEnum('occupancy').notNull().default('owner_occupied'),
  ownerUserId: text('owner_user_id'),
  areaSqm: numeric('area_sqm', { precision: 10, scale: 2 }),
  status: userStatusEnum('status').notNull().default('active')
}, table => [
  uniqueIndex('units_org_code_idx').on(table.organizationId, table.code)
])

export const assessmentTypes = pgTable('assessment_types', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  code: varchar('code', { length: 64 }).notNull(),
  name: text('name').notNull(),
  description: text('description'),
  defaultAmount: numeric('default_amount', { precision: 12, scale: 2 }).notNull().default('0'),
  frequency: varchar('frequency', { length: 32 }).notNull().default('monthly'),
  active: boolean('active').notNull().default(true)
})

export const invoices = pgTable('invoices', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  unitId: text('unit_id').notNull().references(() => units.id, { onDelete: 'cascade' }),
  assessmentTypeId: text('assessment_type_id').references(() => assessmentTypes.id),
  period: varchar('period', { length: 16 }).notNull(),
  description: text('description').notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  penaltyAmount: numeric('penalty_amount', { precision: 12, scale: 2 }).notNull().default('0'),
  amountPaid: numeric('amount_paid', { precision: 12, scale: 2 }).notNull().default('0'),
  status: invoiceStatusEnum('status').notNull().default('open'),
  dueDate: date('due_date').notNull(),
  issuedAt: timestamp('issued_at', { withTimezone: true }).notNull().defaultNow()
})

export const payments = pgTable('payments', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  unitId: text('unit_id').notNull().references(() => units.id, { onDelete: 'cascade' }),
  invoiceId: text('invoice_id').references(() => invoices.id),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  method: paymentMethodEnum('method').notNull().default('gcash'),
  reference: text('reference'),
  status: paymentStatusEnum('status').notNull().default('pending'),
  submittedById: text('submitted_by_id'),
  verifiedById: text('verified_by_id'),
  notes: text('notes'),
  paidAt: timestamp('paid_at', { withTimezone: true }).notNull().defaultNow(),
  verifiedAt: timestamp('verified_at', { withTimezone: true })
})

export const clearanceRequests = pgTable('clearance_requests', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  unitId: text('unit_id').notNull().references(() => units.id, { onDelete: 'cascade' }),
  requesterId: text('requester_id').notNull(),
  requesterName: text('requester_name').notNull(),
  type: clearanceTypeEnum('type').notNull().default('hoa_clearance'),
  purpose: text('purpose'),
  status: clearanceStatusEnum('status').notNull().default('pending'),
  reviewedById: text('reviewed_by_id'),
  reviewNotes: text('review_notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
})

export const ledgerAccounts = pgTable('ledger_accounts', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  code: varchar('code', { length: 32 }).notNull(),
  name: text('name').notNull(),
  accountType: accountTypeEnum('account_type').notNull(),
  fundCategory: varchar('fund_category', { length: 64 }),
  active: boolean('active').notNull().default(true)
}, table => [
  uniqueIndex('ledger_accounts_org_code_idx').on(table.organizationId, table.code)
])

export const disbursementVouchers = pgTable('disbursement_vouchers', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  accountId: text('account_id').notNull().references(() => ledgerAccounts.id),
  payee: text('payee').notNull(),
  description: text('description').notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  status: voucherStatusEnum('status').notNull().default('draft'),
  requestedById: text('requested_by_id').notNull(),
  approvedById: text('approved_by_id'),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
})

export const ledgerEntries = pgTable('ledger_entries', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  accountId: text('account_id').notNull().references(() => ledgerAccounts.id),
  entryDate: date('entry_date').notNull(),
  description: text('description').notNull(),
  debit: numeric('debit', { precision: 12, scale: 2 }).notNull().default('0'),
  credit: numeric('credit', { precision: 12, scale: 2 }).notNull().default('0'),
  referenceType: varchar('reference_type', { length: 32 }),
  referenceId: text('reference_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
})

export const polls = pgTable('polls', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description').notNull().default(''),
  status: pollStatusEnum('status').notNull().default('draft'),
  eligibility: pollEligibilityEnum('eligibility').notNull().default('per_unit'),
  quorumPercent: integer('quorum_percent').notNull().default(50),
  options: jsonb('options').$type<string[]>().notNull().default([]),
  opensAt: timestamp('opens_at', { withTimezone: true }),
  closesAt: timestamp('closes_at', { withTimezone: true }),
  createdById: text('created_by_id').notNull(),
  summary: text('summary'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
})

export const pollVotes = pgTable('poll_votes', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  pollId: text('poll_id').notNull().references(() => polls.id, { onDelete: 'cascade' }),
  unitId: text('unit_id').references(() => units.id),
  voterId: text('voter_id').notNull(),
  optionIndex: integer('option_index').notNull(),
  comment: text('comment'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, table => [
  uniqueIndex('poll_votes_poll_unit_idx').on(table.pollId, table.unitId),
  uniqueIndex('poll_votes_poll_voter_idx').on(table.pollId, table.voterId)
])

export const broadcasts = pgTable('broadcasts', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  body: text('body').notNull(),
  severity: broadcastSeverityEnum('severity').notNull().default('info'),
  channel: broadcastChannelEnum('channel').notNull().default('portal'),
  audiencePhase: varchar('audience_phase', { length: 64 }),
  audienceUnitType: varchar('audience_unit_type', { length: 64 }),
  createdById: text('created_by_id').notNull(),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
})

export const broadcastDeliveries = pgTable('broadcast_deliveries', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  broadcastId: text('broadcast_id').notNull().references(() => broadcasts.id, { onDelete: 'cascade' }),
  recipientId: text('recipient_id'),
  channel: broadcastChannelEnum('channel').notNull().default('portal'),
  status: deliveryStatusEnum('status').notNull().default('queued'),
  error: text('error'),
  deliveredAt: timestamp('delivered_at', { withTimezone: true })
})
