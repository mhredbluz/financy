import { describe, it, expect } from 'vitest'
import { calcMonthStatus } from './monthStatus'

describe('calcMonthStatus', () => {
  it('returns NEGATIVO when saldoPrevisto < 0', () => {
    expect(calcMonthStatus({
      saldoPrevisto: -1,
      baseMensal: 1000,
      baseRestante: 500,
      receitaPrevista: 2000,
      despesaPrevista: 1500,
    })).toBe('NEGATIVO')
  })

  it('returns RISCO when baseRestante is low', () => {
    expect(calcMonthStatus({
      saldoPrevisto: 100,
      baseMensal: 1000,
      baseRestante: 50,
      receitaPrevista: 2000,
      despesaPrevista: 1500,
    })).toBe('RISCO')
  })

  it('returns ATENCAO when expenses are close to income', () => {
    expect(calcMonthStatus({
      saldoPrevisto: 100,
      baseMensal: 1000,
      baseRestante: 500,
      receitaPrevista: 2000,
      despesaPrevista: 1900,
    })).toBe('ATENCAO')
  })

  it('returns SAUDAVEL otherwise', () => {
    expect(calcMonthStatus({
      saldoPrevisto: 100,
      baseMensal: 1000,
      baseRestante: 600,
      receitaPrevista: 2000,
      despesaPrevista: 1200,
    })).toBe('SAUDAVEL')
  })
})
