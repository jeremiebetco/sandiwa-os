import { describe, expect, it } from 'vitest'
import { isCredentialFailure, sessionExpiryPath } from './session-expiry'

describe('session expiry', () => {
  it('leaves a wrong password on the sign-in form', () => {
    expect(isCredentialFailure('/api/auth/login')).toBe(true)
    expect(isCredentialFailure('http://sandiwa.localhost:3000/api/auth/login')).toBe(true)
    expect(isCredentialFailure('/api/platform/orgs/greenfield-hoa')).toBe(false)
  })

  it('sends an expired platform session to platform sign-in', () => {
    expect(sessionExpiryPath({
      isPlatform: true,
      slug: null,
      routingMode: 'subdomain'
    })).toBe('/platform/login')
  })

  it('sends an expired HOA session to that community sign-in', () => {
    expect(sessionExpiryPath({
      isPlatform: false,
      slug: 'greenfield-hoa',
      routingMode: 'subdomain'
    })).toBe('/login')
    expect(sessionExpiryPath({
      isPlatform: false,
      slug: 'greenfield-hoa',
      routingMode: 'path'
    })).toBe('/o/greenfield-hoa/login')
  })
})
