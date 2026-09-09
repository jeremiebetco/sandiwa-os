import { landingFromRecord } from '~~/app/core/branding/landing'
import type {
  FeatureFlags,
  LandingContent,
  Officer,
  Organization,
  OrgRole,
  PluginKey,
  PlanTier
} from '~~/app/core/types'

export type {
  FeatureFlags,
  LandingContent,
  Officer,
  Organization,
  OrgRole,
  PluginKey,
  PlanTier
}

export function mapOrganization(row: {
  id: string
  slug: string
  name: string
  address: string
  contactEmail: string
  contactPhone: string
  planTier: string
  status: string
  terminologyOverrideSlug?: string | null
  features: unknown
  landing: unknown
  logoUrl?: string | null
  heroImageUrl?: string | null
}, officerRows: Array<{
  id: string
  name: string
  position: string
  contact?: string | null
  photoUrl?: string | null
}> = []): Organization {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    address: row.address,
    contactEmail: row.contactEmail,
    contactPhone: row.contactPhone,
    planTier: row.planTier as PlanTier,
    status: row.status as 'active' | 'inactive',
    terminologyOverrideSlug: row.terminologyOverrideSlug ?? undefined,
    features: row.features as FeatureFlags,
    landing: landingFromRecord(row.landing, row.slug),
    officers: officerRows.map(o => ({
      id: o.id,
      name: o.name,
      position: o.position,
      contact: o.contact ?? undefined,
      photoUrl: o.photoUrl ?? undefined
    })),
    logoUrl: row.logoUrl ?? undefined,
    heroImageUrl: row.heroImageUrl ?? undefined
  }
}
