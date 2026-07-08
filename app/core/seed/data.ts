import type {
  Announcement,
  AppDatabase,
  IntakeCase,
  Organization,
  OrgUser,
  PlatformAdmin
} from '~/core/types'

const greenfieldId = 'org-greenfield-hoa'
const sunriseId = 'org-sunrise-condo'

export const seedOrganizations: Organization[] = [
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
    features: {
      intake: true,
      payments: true,
      ledger: false,
      polls: true,
      broadcasts: true,
      landing_editor: true,
      staff_management: true,
      announcements: true
    },
    landing: {
      heroTitle: 'Welcome to Greenfield Village',
      heroSubtitle: 'Your homeowners association digital hub',
      welcomeMessage: 'Pay dues, file requests, and stay updated on community news — all in one place.',
      contactAddress: 'Greenfield Clubhouse, Greenfield Ave, Sta. Rosa, Laguna',
      contactPhone: '+63 49 123 4567',
      contactEmail: 'info@greenfield-hoa.local',
      officeHours: 'Mon–Fri 9:00 AM – 5:00 PM',
      accentColor: '#0f766e'
    },
    officers: [
      { id: 'off-1', name: 'Maria Santos', position: 'HOA President', contact: 'president@greenfield-hoa.local' },
      { id: 'off-2', name: 'Juan Dela Cruz', position: 'Treasurer', contact: 'treasurer@greenfield-hoa.local' },
      { id: 'off-3', name: 'Ana Reyes', position: 'Secretary', contact: 'secretary@greenfield-hoa.local' }
    ]
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
    landing: {
      heroTitle: 'Sunrise Condominium',
      heroSubtitle: 'Tower living, simplified',
      welcomeMessage: 'Manage your unit fees and community updates from your phone.',
      contactAddress: 'Tower A Lobby, Sunrise Blvd, Makati City',
      contactPhone: '+63 2 876 5432',
      contactEmail: 'admin@sunrise-condo.local',
      officeHours: 'Daily 8:00 AM – 6:00 PM',
      accentColor: '#1d4ed8'
    },
    officers: [
      { id: 'off-s1', name: 'Roberto Lim', position: 'Board President', contact: 'board@sunrise-condo.local' }
    ]
  }
]

export const seedPlatformAdmins: PlatformAdmin[] = [
  {
    id: 'plat-1',
    email: 'admin@sandiwa.local',
    password: 'demo1234',
    name: 'Platform Administrator',
    role: 'platform_admin',
    status: 'active'
  }
]

export const seedOrgUsers: OrgUser[] = [
  {
    id: 'user-gf-admin',
    organizationId: greenfieldId,
    email: 'admin@greenfield-hoa.local',
    password: 'demo1234',
    name: 'Elena Garcia',
    role: 'org_admin',
    status: 'active'
  },
  {
    id: 'user-gf-manager',
    organizationId: greenfieldId,
    email: 'manager@greenfield-hoa.local',
    password: 'demo1234',
    name: 'Carlos Mendoza',
    role: 'manager',
    status: 'active'
  },
  {
    id: 'user-gf-chair',
    organizationId: greenfieldId,
    email: 'chair@greenfield-hoa.local',
    password: 'demo1234',
    name: 'Liza Fernandez',
    role: 'committee_lead',
    status: 'active'
  },
  {
    id: 'user-gf-member',
    organizationId: greenfieldId,
    email: 'member@greenfield-hoa.local',
    password: 'demo1234',
    name: 'Pedro Ramos',
    role: 'member',
    unit: 'Block 3 Lot 12',
    memberNo: 'GF-0312',
    status: 'active'
  },
  {
    id: 'user-sc-admin',
    organizationId: sunriseId,
    email: 'admin@sunrise-condo.local',
    password: 'demo1234',
    name: 'Grace Tan',
    role: 'org_admin',
    status: 'active'
  }
]

export const seedAnnouncements: Announcement[] = [
  {
    id: 'ann-1',
    organizationId: greenfieldId,
    title: 'Annual General Meeting — March 15',
    body: 'All homeowners are invited to the AGM at the clubhouse on March 15, 2:00 PM. Please bring your homeowner ID.',
    publishedAt: '2026-03-01T08:00:00.000Z',
    authorId: 'user-gf-admin'
  },
  {
    id: 'ann-2',
    organizationId: greenfieldId,
    title: 'Water Interruption Advisory',
    body: 'Scheduled maintenance on March 10, 9 AM – 12 NN. Please store water in advance.',
    publishedAt: '2026-03-05T10:00:00.000Z',
    authorId: 'user-gf-manager'
  },
  {
    id: 'ann-3',
    organizationId: sunriseId,
    title: 'Elevator Maintenance',
    body: 'Tower B elevator maintenance on March 12. Use Tower A elevator during this period.',
    publishedAt: '2026-03-04T09:00:00.000Z',
    authorId: 'user-sc-admin'
  }
]

export const seedIntakeCases: IntakeCase[] = [
  {
    id: 'case-1',
    organizationId: greenfieldId,
    memberId: 'user-gf-member',
    memberName: 'Pedro Ramos',
    unit: 'Block 3 Lot 12',
    description: 'Streetlight near Block 3 has been out for a week. Madilim sa gabi, delikado.',
    category: 'Maintenance',
    sentiment: 'concerned',
    status: 'in_progress',
    assignedToId: 'user-gf-chair',
    assignedToName: 'Liza Fernandez',
    createdAt: '2026-03-02T14:30:00.000Z',
    updatedAt: '2026-03-03T09:00:00.000Z'
  },
  {
    id: 'case-2',
    organizationId: greenfieldId,
    memberId: 'user-gf-member',
    memberName: 'Pedro Ramos',
    unit: 'Block 3 Lot 12',
    description: 'Noise complaint — loud music past 10 PM from neighboring lot.',
    category: 'Neighbor Concern',
    sentiment: 'urgent',
    status: 'open',
    createdAt: '2026-03-06T22:15:00.000Z',
    updatedAt: '2026-03-06T22:15:00.000Z'
  },
  {
    id: 'case-3',
    organizationId: sunriseId,
    memberId: 'user-sc-admin',
    memberName: 'Grace Tan',
    description: 'Leaking pipe in parking level P2 near slot 45.',
    category: 'Maintenance',
    sentiment: 'urgent',
    status: 'open',
    createdAt: '2026-03-07T07:00:00.000Z',
    updatedAt: '2026-03-07T07:00:00.000Z'
  }
]

export function createSeedDatabase(): AppDatabase {
  return {
    organizations: structuredClone(seedOrganizations),
    platformAdmins: structuredClone(seedPlatformAdmins),
    orgUsers: structuredClone(seedOrgUsers),
    announcements: structuredClone(seedAnnouncements),
    intakeCases: structuredClone(seedIntakeCases),
    seedVersion: 1
  }
}
