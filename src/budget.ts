import type { Transaction } from './types'

export interface BudgetSummary {
  monthlyIncome: number
  monthlyExpenses: number
  balance: number
  remaining: number
  daysLeft: number
  dailyBudget: number
}

export function calcMonthlySummary(transactions: Transaction[], budgetLimit?: number, now = new Date()): BudgetSummary {
  const month = now.toISOString().slice(0, 7)
  const monthlyTransactions = transactions.filter((tx) => tx.date.startsWith(month))

  const monthlyIncome = monthlyTransactions
    .filter((tx) => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0)

  const monthlyExpenses = monthlyTransactions
    .filter((tx) => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0)

  const balance = monthlyIncome - monthlyExpenses
  const remaining = (budgetLimit ?? 0) - monthlyExpenses

  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const daysLeft = Math.max(0, lastDay - now.getDate() + 1)
  const dailyBudget = daysLeft > 0 ? remaining / daysLeft : remaining

  return { monthlyIncome, monthlyExpenses, balance, remaining, daysLeft, dailyBudget }
}
