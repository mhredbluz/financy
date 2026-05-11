import type { Budget } from '../../types'

export type BudgetBasePolicy = 'fixed' | 'percent_of_income'
export type CarryOverMode = 'off' | 'daily_simple'

export function calcBaseMensal(budget: Budget | undefined, receitaPrevista: number): number {
  if (!budget) return 0

  const baseBruta = calcBaseMensalBruta(budget, receitaPrevista)
  const savingsRate = Math.min(1, Math.max(0, budget.savingsRate ?? 0))
  return baseBruta * (1 - savingsRate)
}

export function calcBaseMensalBruta(budget: Budget | undefined, receitaPrevista: number): number {
  if (!budget) return 0

  const policy: BudgetBasePolicy =
    budget.basePolicy ?? (typeof budget.baseFixed === 'number' ? 'fixed' : 'percent_of_income')

  return policy === 'fixed'
    ? (budget.baseFixed ?? budget.limit ?? 0)
    : receitaPrevista * (budget.basePercent ?? 0)
}
