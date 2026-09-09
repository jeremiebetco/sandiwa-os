import { describe, expect, it } from 'vitest'
import {
  canAccessModule,
  canPerformAction,
  canViewAllIntakeCases,
  isMemberRole,
  isStaffRole
} from '~/core/rbac/permissions'

describe('RBAC permission matrix', () => {
  it('identifies staff vs member roles', () => {
    expect(isStaffRole('org_admin')).toBe(true)
    expect(isStaffRole('manager')).toBe(true)
    expect(isStaffRole('member')).toBe(false)
    expect(isMemberRole('member')).toBe(true)
    expect(isMemberRole('staff')).toBe(false)
  })

  it('gates staff_management to org_admin only', () => {
    expect(canAccessModule('org_admin', 'staff_management')).toBe(true)
    expect(canAccessModule('manager', 'staff_management')).toBe(false)
    expect(canAccessModule('member', 'staff_management')).toBe(false)
  })

  it('allows committee_lead on intake and polls but not payments', () => {
    expect(canAccessModule('committee_lead', 'intake')).toBe(true)
    expect(canAccessModule('committee_lead', 'polls')).toBe(true)
    expect(canAccessModule('committee_lead', 'payments')).toBe(false)
  })

  it('enforces action-level permissions', () => {
    expect(canPerformAction('org_admin', 'voucher.approve')).toBe(true)
    expect(canPerformAction('staff', 'voucher.approve')).toBe(false)
    expect(canPerformAction('member', 'payment.post')).toBe(true)
    expect(canPerformAction('member', 'payment.verify')).toBe(false)
    expect(canPerformAction('manager', 'broadcast.send')).toBe(true)
    expect(canPerformAction('committee_lead', 'poll.create')).toBe(true)
    expect(canPerformAction('committee_lead', 'poll.close')).toBe(false)
  })

  it('scopes intake visibility', () => {
    expect(canViewAllIntakeCases('org_admin')).toBe(true)
    expect(canViewAllIntakeCases('manager')).toBe(true)
    expect(canViewAllIntakeCases('committee_lead')).toBe(false)
  })
})
