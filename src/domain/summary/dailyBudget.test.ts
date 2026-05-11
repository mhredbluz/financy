import { describe, it, expect } from 'vitest'
import { calcDailyBudget } from './dailyBudget'

describe('calcDailyBudget', () => {
  it('blocks when base is zero or negative', () => {
    const result = calcDailyBudget({
      baseMensal: 100,
      despesasConsumidas: 150,
      diasRestantes: 10,
      gastoHoje: 0,
      gastoOntem: 0,
      carryOverMode: 'daily_simple',
    })

    expect(result.baseRestante).toBeLessThanOrEqual(0)
    expect(result.orcamentoDiario).toBe(0)
    expect(result.orcamentoHoje).toBe(0)
    expect(result.statusDia).toBe('BLOQUEADO')
  })

  it('applies simple carry-over when enabled', () => {
    const result = calcDailyBudget({
      baseMensal: 300,
      despesasConsumidas: 0,
      diasRestantes: 3,
      gastoHoje: 50,
      gastoOntem: 20,
      carryOverMode: 'daily_simple',
    })

    expect(result.orcamentoDiario).toBeCloseTo(100, 2)
    expect(result.diferencaOntem).toBeCloseTo(80, 2)
    expect(result.orcamentoHoje).toBeCloseTo(180, 2)
    expect(result.statusDia).toBe('DENTRO')
  })

  it('flags near limit and overflow', () => {
    const near = calcDailyBudget({
      baseMensal: 200,
      despesasConsumidas: 0,
      diasRestantes: 2,
      gastoHoje: 85,
      gastoOntem: 0,
      carryOverMode: 'off',
    })
    expect(near.orcamentoHoje).toBeCloseTo(100, 2)
    expect(near.statusDia).toBe('PERTO_DO_LIMITE')

    const over = calcDailyBudget({
      baseMensal: 200,
      despesasConsumidas: 0,
      diasRestantes: 2,
      gastoHoje: 120,
      gastoOntem: 0,
      carryOverMode: 'off',
    })
    expect(over.statusDia).toBe('ESTOURO')
  })
})
