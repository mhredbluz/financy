import { describe, it, expect } from 'vitest'
import type { Transaction } from '../../types'
import { calcMonthlyTotals } from './realPlanned'

describe('calcMonthlyTotals', () => {
  it('separates confirmed vs planned and ignores canceled', () => {
    const txs: Transaction[] = [
      { id: '1', date: '2026-04-01', type: 'income', amount: 1000, category: 'Salário', status: 'confirmed', origin: 'manual' },
      { id: '2', date: '2026-04-02', type: 'expense', amount: 200, category: 'Mercado', status: 'confirmed', origin: 'manual' },
      { id: '3', date: '2026-04-10', type: 'expense', amount: 300, category: 'Aluguel', status: 'planned', origin: 'recurrence' },
      { id: '4', date: '2026-04-15', type: 'income', amount: 500, category: 'Extra', status: 'planned', origin: 'manual' },
      { id: '5', date: '2026-04-20', type: 'expense', amount: 999, category: 'Ignore', status: 'canceled', origin: 'manual' },
    ]

    const totals = calcMonthlyTotals(txs, '2026-04')
    expect(totals.receitaReal).toBe(1000)
    expect(totals.despesaReal).toBe(200)
    expect(totals.receitaPrevista).toBe(1500)
    expect(totals.despesaPrevista).toBe(500)
  })
})
