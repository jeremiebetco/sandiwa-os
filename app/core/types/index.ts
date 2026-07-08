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

export interface FeatureFlags {
  intake: boolean
  payments: boolean
  ledger: boolean
  polls: boolean
  broadcasts: boolean
  landing_editor: boolean
  staff_management: boolean
  announcements: boolean
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
}

export interface Officer {
  id: string
  name: string
  position: string
  contact?: string
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
}

export interface PlatformAdmin {
  id: string
  email: string
  password: string
  name: string
  role: PlatformRole
  status: 'active' | 'inactive'
}

export interface OrgUser {
  id: string
  organizationId: string
  email: string
  password: string
  name: string
  role: OrgRole
  unit?: string
  memberNo?: string
  status: 'active' | 'inactive'
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

export interface AppDatabase {
  organizations: Organization[]
  platformAdmins: PlatformAdmin[]
  orgUsers: OrgUser[]
  announcements: Announcement[]
  intakeCases: IntakeCase[]
  seedVersion: number
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
