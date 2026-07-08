import type { OrgRole, PluginKey } from '~/core/types'

const STAFF_ROLES: OrgRole[] = ['org_admin', 'manager', 'committee_lead', 'staff']

export function isStaffRole(role: OrgRole): boolean {
  return STAFF_ROLES.includes(role)
}

const MODULE_PERMISSIONS: Record<PluginKey, OrgRole[]> = {
  intake: ['org_admin', 'manager', 'committee_lead', 'staff'],
  payments: ['org_admin', 'manager', 'staff'],
  ledger: ['org_admin', 'manager'],
  polls: ['org_admin', 'manager', 'committee_lead'],
  broadcasts: ['org_admin', 'manager'],
  landing_editor: ['org_admin', 'manager'],
  staff_management: ['org_admin'],
  announcements: ['org_admin', 'manager', 'staff']
}

export function canAccessModule(role: OrgRole, plugin: PluginKey): boolean {
  return MODULE_PERMISSIONS[plugin]?.includes(role) ?? false
}

export function canViewAllIntakeCases(role: OrgRole): boolean {
  return role === 'org_admin' || role === 'manager'
}

export function canManageIntakeCase(role: OrgRole, assignedToId?: string, userId?: string): boolean {
  if (canViewAllIntakeCases(role)) return true
  if (role === 'committee_lead' && assignedToId && userId) {
    return assignedToId === userId
  }
  return role === 'staff'
}
