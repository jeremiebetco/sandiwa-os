import { describe, expect, it } from 'vitest'
import { isAllowedCsrfOrigin, stripPort } from './csrf'

describe('isAllowedCsrfOrigin', () => {
  it('allows exact host match', () => {
    expect(isAllowedCsrfOrigin('sandiwa-os.vercel.app', 'sandiwa-os.vercel.app')).toBe(true)
    expect(isAllowedCsrfOrigin('sandiwa.localhost:3000', 'sandiwa.localhost:3000')).toBe(true)
  })

  it('allows localhost tenant siblings', () => {
    expect(
      isAllowedCsrfOrigin('greenfield-hoa.sandiwa.localhost:3000', 'sandiwa.localhost:3000')
    ).toBe(true)
  })

  it('rejects unrelated vercel.app projects', () => {
    expect(
      isAllowedCsrfOrigin('evil-app.vercel.app', 'sandiwa-os.vercel.app', 'sandiwa-os.vercel.app')
    ).toBe(false)
  })

  it('allows path-based same host on vercel project domain', () => {
    expect(
      isAllowedCsrfOrigin('sandiwa-os.vercel.app', 'sandiwa-os.vercel.app', 'sandiwa-os.vercel.app')
    ).toBe(true)
  })

  it('allows custom-domain tenant subdomains under platform domain', () => {
    expect(
      isAllowedCsrfOrigin('greenfield.sandiwa.os', 'sandiwa.os', 'sandiwa.os')
    ).toBe(true)
  })

  it('rejects cross-tenant custom domains without shared apex', () => {
    expect(
      isAllowedCsrfOrigin('attacker.example.com', 'sandiwa.os', 'sandiwa.os')
    ).toBe(false)
  })
})

describe('stripPort', () => {
  it('strips numeric ports', () => {
    expect(stripPort('sandiwa.localhost:3000')).toBe('sandiwa.localhost')
  })
})
