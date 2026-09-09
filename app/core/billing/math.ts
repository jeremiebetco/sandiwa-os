import { describe, expect, it } from 'vitest'

export type AgingBucket = 'current' | 'days30' | 'days60' | 'days90'

export function daysPastDue(dueDate: string, asOf: Date = new Date()): number {
  const due = new Date(dueDate)
  const ms = asOf.getTime() - due.getTime()
  return Math.floor(ms / (24 * 60 * 60 * 1000))
}

export function agingBucket(dueDate: string, asOf: Date = new Date()): AgingBucket {
  const days = daysPastDue(dueDate, asOf)
  if (days <= 0) return 'current'
  if (days <= 30) return 'days30'
  if (days <= 60) return 'days60'
  return 'days90'
}

export function remainingBalance(amount: string | number, penalty: string | number, paid: string | number): number {
  return Number(amount) + Number(penalty) - Number(paid)
}

export function applyPenalty(amount: number, ratePercent: number, overdue: boolean): number {
  if (!overdue || ratePercent <= 0) return 0
  return Math.round(amount * (ratePercent / 100) * 100) / 100
}

export function runningBalance(
  entries: Array<{ debit: string | number, credit: string | number }>
): number {
  return entries.reduce((bal, e) => bal + Number(e.debit) - Number(e.credit), 0)
}

describe('billing math', () => {
  const asOf = new Date('2026-04-15T00:00:00Z')

  it('classifies aging buckets', () => {
    expect(agingBucket('2026-04-20', asOf)).toBe('current')
    expect(agingBucket('2026-04-15', asOf)).toBe('current')
    expect(agingBucket('2026-03-20', asOf)).toBe('days30')
    expect(agingBucket('2026-02-20', asOf)).toBe('days60')
    expect(agingBucket('2026-01-01', asOf)).toBe('days90')
  })

  it('computes remaining balance with penalties', () => {
    expect(remainingBalance('2500', '125', '0')).toBe(2625)
    expect(remainingBalance('2500', '0', '1000')).toBe(1500)
  })

  it('applies overdue penalty rate', () => {
    expect(applyPenalty(2500, 5, true)).toBe(125)
    expect(applyPenalty(2500, 5, false)).toBe(0)
  })

  it('tracks running ledger balance (debit positive)', () => {
    const bal = runningBalance([
      { debit: '2500', credit: '0' },
      { debit: '0', credit: '500' },
      { debit: '100', credit: '0' }
    ])
    expect(bal).toBe(2100)
  })
})
