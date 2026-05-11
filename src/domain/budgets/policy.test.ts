import { describe, it, expect } from 'vitest'
import type { Budget } from '../../types'
import { calcBaseMensal } from './policy'

describe('calcBaseMensal', () => {
  it('uses fixed base when policy is fixed', () => {
    const budget: Budget = {
      month: '2026-04',
      limit: 0,
      basePolicy: 'fixed',
      baseFixed: 2000,
      savingsRate: 0.1,
    }
    expect(calcBaseMensal(budget, 5000)).toBe(1800)
  })

  it('uses percent of income when policy is percent_of_income', () => {
    const budget: Budget = {
      month: '2026-04',
      limit: 0,
      basePolicy: 'percent_of_income',
      basePercent: 0.7,
      savingsRate: 0,
    }
    expect(calcBaseMensal(budget, 5000)).toBe(3500)
  })
})
