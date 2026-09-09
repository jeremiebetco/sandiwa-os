/**
 * Sandiwa OS HOA — shared domain types (client + server)
 */

export type TenantContext = 'platform' | 'organization'

export type OrgRole = 'org_admin' | 'manager' | 'committee_lead' | 'staff' | 'member'

export type PlatformRole = 'platform_admin'

export type PluginKey
  = | 'intake'
    | 'payments'
    | 'ledger'
    | 'polls'
    | 'broadcasts'
    | 'landing_editor'
    | 'staff_management'
    | 'announcements'

export type PlanTier = 'basic' | 'standard' | 'premium'

export type IntakeStatus = 'open' | 'in_progress' | 'resolved' | 'closed'

export type InvoiceStatus = 'draft' | 'open' | 'partial' | 'paid' | 'void' | 'overdue'
export type PaymentMethod = 'gcash' | 'maya' | 'bank_transfer' | 'cash' | 'check' | 'other'
export type PaymentStatus = 'pending' | 'verified' | 'rejected'
export type ClearanceType = 'hoa_clearance' | 'move_in' | 'move_out' | 'resale' | 'certificate'
export type ClearanceStatus = 'pending' | 'approved' | 'rejected' | 'issued'
export type PollStatus = 'draft' | 'open' | 'closed'
export type BroadcastSeverity = 'info' | 'warning' | 'emergency'
export type VoucherStatus = 'draft' | 'pending_approval' | 'approved' | 'paid' | 'rejected'

export interface FeatureFlags {
  intake: boolean
  payments: boolean
  ledger: boolean
  polls: boolean
  broadcasts: boolean
  landing_editor: boolean
  staff_management: boolean
  announcements: boolean
  [key: string]: boolean
}

export interface LandingContent {
  heroTitle: string
  heroSubtitle: string
  welcomeMessage: string
  contactAddress: string
  contactPhone: string
  contactEmail: string
  officeHours: string
  accentColor: string
  brandId: string
  [key: string]: string
}

export interface Officer {
  id: string
  name: string
  position: string
  contact?: string
  photoUrl?: string
}

export interface Organization {
  id: string
  slug: string
  name: string
  address: string
  contactEmail: string
  contactPhone: string
  planTier: PlanTier
  status: 'active' | 'inactive'
  terminologyOverrideSlug?: string
  features: FeatureFlags
  landing: LandingContent
  officers: Officer[]
  logoUrl?: string
  heroImageUrl?: string
}

export interface PlatformAdmin {
  id: string
  email: string
  name: string
  role: PlatformRole
  status: 'active' | 'inactive'
}

export interface OrgUser {
  id: string
  organizationId: string
  email: string
  name: string
  role: OrgRole
  unit?: string
  memberNo?: string
  status: 'active' | 'inactive'
  /** Only present when creating/updating via staff forms — never returned from API. */
  password?: string
}

export interface Announcement {
  id: string
  organizationId: string
  title: string
  body: string
  publishedAt: string
  authorId: string
}

export interface IntakeCase {
  id: string
  organizationId: string
  memberId: string
  memberName: string
  unit?: string
  description: string
  category: string
  sentiment: 'neutral' | 'concerned' | 'urgent'
  status: IntakeStatus
  assignedToId?: string
  assignedToName?: string
  resolutionNotes?: string
  createdAt: string
  updatedAt: string
}

export interface Unit {
  id: string
  organizationId: string
  code: string
  phase?: string
  block?: string
  lot?: string
  tower?: string
  floor?: string
  unitType: string
  occupancy: string
  ownerUserId?: string
  areaSqm?: string
  status: string
}

export interface AssessmentType {
  id: string
  organizationId: string
  code: string
  name: string
  description?: string
  defaultAmount: string
  frequency: string
  active: boolean
}

export interface Invoice {
  id: string
  organizationId: string
  unitId: string
  assessmentTypeId?: string
  period: string
  description: string
  amount: string
  penaltyAmount: string
  amountPaid: string
  status: InvoiceStatus
  dueDate: string
  issuedAt: string
  unitCode?: string
}

export interface Payment {
  id: string
  organizationId: string
  unitId: string
  invoiceId?: string
  amount: string
  method: PaymentMethod
  reference?: string
  status: PaymentStatus
  submittedById?: string
  verifiedById?: string
  notes?: string
  paidAt: string
  verifiedAt?: string
}

export interface ClearanceRequest {
  id: string
  organizationId: string
  unitId: string
  requesterId: string
  requesterName: string
  type: ClearanceType
  purpose?: string
  status: ClearanceStatus
  reviewedById?: string
  reviewNotes?: string
  createdAt: string
  updatedAt: string
}

export interface LedgerAccount {
  id: string
  organizationId: string
  code: string
  name: string
  accountType: string
  fundCategory?: string
  active: boolean
}

export interface DisbursementVoucher {
  id: string
  organizationId: string
  accountId: string
  payee: string
  description: string
  amount: string
  status: VoucherStatus
  requestedById: string
  approvedById?: string
  paidAt?: string
  createdAt: string
  updatedAt: string
}

export interface LedgerEntry {
  id: string
  organizationId: string
  accountId: string
  entryDate: string
  description: string
  debit: string
  credit: string
  referenceType?: string
  referenceId?: string
  createdAt: string
}

export interface Poll {
  id: string
  organizationId: string
  title: string
  description: string
  status: PollStatus
  eligibility: 'per_unit' | 'per_member'
  quorumPercent: number
  options: string[]
  opensAt?: string
  closesAt?: string
  createdById: string
  summary?: string
  createdAt: string
  tallies?: number[]
  voteCount?: number
}

export interface PollVote {
  id: string
  organizationId: string
  pollId: string
  unitId?: string
  voterId: string
  optionIndex: number
  comment?: string
  createdAt: string
}

export interface Broadcast {
  id: string
  organizationId: string
  title: string
  body: string
  severity: BroadcastSeverity
  channel: 'portal' | 'sms' | 'both'
  audiencePhase?: string
  audienceUnitType?: string
  createdById: string
  sentAt?: string
  createdAt: string
}

export interface SessionUser {
  id: string
  email: string
  name: string
  role: OrgRole | PlatformRole
  context: TenantContext
  organizationId?: string
  organizationSlug?: string
}

export interface TerminologyFile {
  version: string
  modules: Record<string, { label: string, description: string, navLabel: string }>
  roles: Record<string, { label: string }>
  fields: Record<string, { label: string }>
}

export const PLUGIN_KEYS: PluginKey[] = [
  'intake',
  'payments',
  'ledger',
  'polls',
  'broadcasts',
  'landing_editor',
  'staff_management',
  'announcements'
]

export const PLAN_PLUGIN_LIMITS: Record<PlanTier, PluginKey[]> = {
  basic: ['announcements', 'intake'],
  standard: ['announcements', 'intake', 'payments', 'polls', 'staff_management', 'landing_editor'],
  premium: PLUGIN_KEYS
}

export const INTAKE_CATEGORIES = [
  'security',
  'garbage',
  'street_lights',
  'water',
  'noise',
  'stray_animals',
  'illegal_construction',
  'parking_violation',
  'other'
] as const
