import { describe, expect, it } from 'vitest'
import { agingBucket, applyPenalty, remainingBalance, runningBalance } from './math'

describe('billing math exports', () => {
  it('re-exports aging and balance helpers', () => {
    expect(agingBucket('2020-01-01', new Date('2020-05-01'))).toBe('days90')
    expect(remainingBalance(100, 10, 40)).toBe(70)
    expect(applyPenalty(1000, 2, true)).toBe(20)
    expect(runningBalance([{ debit: 50, credit: 20 }])).toBe(30)
  })
})
