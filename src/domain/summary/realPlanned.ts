import type { Transaction } from '../../types'
import { splitByStatus, sumByType, isActive } from '../transactions/filters'

export interface MonthlyTotals {
  receitaReal: number
  despesaReal: number
  receitaPrevista: number
  despesaPrevista: number
}

export function calcMonthlyTotals(transactions: Transaction[], month: string): MonthlyTotals {
  const monthTransactions = transactions.filter((tx) => tx.date.startsWith(month)).filter(isActive)
  const { confirmed, planned } = splitByStatus(monthTransactions)

  const receitaReal = sumByType(confirmed, 'income')
  const despesaReal = sumByType(confirmed, 'expense')
  const receitaPlanejada = sumByType(planned, 'income')
  const despesaPlanejada = sumByType(planned, 'expense')

  return {
    receitaReal,
    despesaReal,
    receitaPrevista: receitaReal + receitaPlanejada,
    despesaPrevista: despesaReal + despesaPlanejada,
  }
}
