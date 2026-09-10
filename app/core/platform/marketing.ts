import { PLAN_PLUGIN_LIMITS, PLUGIN_KEYS, type PlanTier, type PluginKey } from '~/core/types'

/** Marketing routes that exist only on the platform host. */
export const PLATFORM_MARKETING_PATHS = [
  '/',
  '/product',
  '/pricing',
  '/stories',
  '/contact',
  '/privacy',
  '/terms'
] as const

export const PLATFORM_PUBLIC_PATHS = [
  ...PLATFORM_MARKETING_PATHS,
  '/platform/login'
] as const

export function isPlatformMarketingPath(path: string): boolean {
  return (PLATFORM_MARKETING_PATHS as readonly string[]).includes(path)
}

export const PLUGIN_MARKETING: Record<PluginKey, { title: string, blurb: string, icon: string }> = {
  announcements: {
    title: 'Announcements',
    blurb: 'Publish board updates members can find without digging through a group chat.',
    icon: 'i-lucide-megaphone'
  },
  intake: {
    title: 'Member requests',
    blurb: 'Route security, garbage, parking, and other tickets into a staff queue.',
    icon: 'i-lucide-message-square-plus'
  },
  payments: {
    title: 'Dues and clearances',
    blurb: 'Track statements, payment submissions, verification, and clearance status.',
    icon: 'i-lucide-wallet'
  },
  ledger: {
    title: 'Community ledger',
    blurb: 'Keep accounts, vouchers, and entries where the board can audit them.',
    icon: 'i-lucide-book-open'
  },
  polls: {
    title: 'Unit votes',
    blurb: 'Run one-vote-per-unit polls without paper tallies or disputed screenshots.',
    icon: 'i-lucide-vote'
  },
  broadcasts: {
    title: 'Alerts',
    blurb: 'Send urgent notices that surface in the member portal, not only in chat.',
    icon: 'i-lucide-siren'
  },
  staff_management: {
    title: 'Staff roles',
    blurb: 'Invite org admins, managers, committee leads, and staff with clear permissions.',
    icon: 'i-lucide-users'
  },
  landing_editor: {
    title: 'Landing and brand',
    blurb: 'Own the HOA public site copy and brand pack without a separate website project.',
    icon: 'i-lucide-palette'
  }
}

export interface DemoPlan {
  id: PlanTier
  name: string
  priceLabel: string
  cadence: string
  summary: string
  plugins: PluginKey[]
  highlighted?: boolean
}

/** Demo list prices only. Billing is not live. */
export const DEMO_PLANS: DemoPlan[] = [
  {
    id: 'basic',
    name: 'Basic',
    priceLabel: '₱1,990',
    cadence: 'per HOA / month',
    summary: 'Announcements and member requests for boards getting organized.',
    plugins: PLAN_PLUGIN_LIMITS.basic
  },
  {
    id: 'standard',
    name: 'Standard',
    priceLabel: '₱4,490',
    cadence: 'per HOA / month',
    summary: 'Dues, votes, staff roles, and a branded landing for day-to-day operations.',
    plugins: PLAN_PLUGIN_LIMITS.standard,
    highlighted: true
  },
  {
    id: 'premium',
    name: 'Premium',
    priceLabel: '₱7,990',
    cadence: 'per HOA / month',
    summary: 'Full module set including ledger and alerts for larger associations.',
    plugins: PLAN_PLUGIN_LIMITS.premium
  }
]

export const LIVE_DEMO_STORIES = [
  {
    slug: 'greenfield-hoa',
    name: 'Greenfield Village HOA',
    kind: 'Subdivision',
    plan: 'premium' as PlanTier,
    summary: 'Clubhouse-facing village operations with requests, dues, votes, and bilingual member content.',
    logoUrl: '/assets/orgs/greenfield-logo.png',
    heroUrl: '/assets/orgs/greenfield-hero.png',
    officer: {
      name: 'Maria Santos',
      role: 'President',
      photoUrl: '/assets/officers/maria-santos.png'
    }
  },
  {
    slug: 'sunrise-condo',
    name: 'Sunrise Condominium',
    kind: 'Tower',
    plan: 'standard' as PlanTier,
    summary: 'Condo corp demo with lobby-facing landing, dues workflows, and staff console modules.',
    logoUrl: '/assets/orgs/sunrise-logo.png',
    heroUrl: '/assets/orgs/sunrise-hero.png',
    officer: {
      name: 'Roberto Lim',
      role: 'Board president',
      photoUrl: '/assets/officers/roberto-lim.png'
    }
  }
] as const

export const HOME_FAQS = [
  {
    q: 'Can members use Tagalog?',
    a: 'Yes. The member-facing Impact site supports English and Tagalog, and Listen can read announcements, alerts, and statements aloud.'
  },
  {
    q: 'Does Sandiwa collect GCash payments?',
    a: 'The demo tracks dues, submissions, and verification. Live card or GCash capture is reserved for a private deploy and is not active on the public demo.'
  },
  {
    q: 'Where does our data live?',
    a: 'This public site is a disposable demo with sample accounts. Private deployments use Postgres with row-level security and httpOnly session cookies.'
  },
  {
    q: 'What happens when the board changes?',
    a: 'Roles and modules stay on the tenant. New officers sign in; you do not rebuild the village tools from scratch.'
  },
  {
    q: 'Are the prices real invoices?',
    a: 'No. Pricing on this site is demo list pricing so boards can compare plans. Billing is not live yet.'
  }
] as const

export const ALL_PLUGIN_KEYS = PLUGIN_KEYS
