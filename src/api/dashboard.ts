import type { Transaction, RecurringTransaction, Budget } from '../types'
import { suggestCategory } from '../utils/categorySuggester'
import type { DashboardSummaryDTO } from '../domain/summary/types'
import { calcMonthlyTotals } from '../domain/summary/realPlanned'
import { calcBaseMensal, calcBaseMensalBruta } from '../domain/budgets/policy'
import { calcDailyBudget } from '../domain/summary/dailyBudget'
import { calcMonthStatus } from '../domain/summary/monthStatus'
import { projectRecurrencesForMonth } from '../domain/recurrences/projection'
import { isActive, isConfirmed } from '../domain/transactions/filters'

export type DashboardSummary = DashboardSummaryDTO

export interface CategorySummaryItem {
  categoria: string
  total: number
}

const toLocalISODate = (date: Date) => {
  const d = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return d.toISOString().slice(0, 10)
}

function getMonthKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

function normalizeBudget(budget: Budget | undefined): Budget | undefined {
  if (!budget) return undefined
  return {
    ...budget,
    basePolicy: budget.basePolicy ?? 'fixed',
    baseFixed: budget.baseFixed ?? budget.limit,
    savingsRate: budget.savingsRate ?? 0.3,
    carryOverMode: budget.carryOverMode ?? 'daily_simple',
  }
}

function sumExpensesByDate(transactions: Transaction[], status: 'confirmed' | 'planned', maxDate: string): number {
  return transactions
    .filter((tx) => tx.type === 'expense' && tx.status === status && tx.date <= maxDate)
    .reduce((sum, tx) => sum + tx.amount, 0)
}

export function getDashboardSummary(
  transactions: Transaction[],
  recurringTransactions: RecurringTransaction[],
  budget: Budget | undefined,
  now = new Date(),
): DashboardSummary {
  const month = getMonthKey(now)
  const todayISO = toLocalISODate(now)
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayISO = toLocalISODate(yesterday)

  const monthTransactions = transactions.filter((tx) => tx.date.startsWith(month)).filter(isActive)

  const totals = calcMonthlyTotals(transactions, month)

  const projections = projectRecurrencesForMonth(recurringTransactions, monthTransactions, now)
  const projectedIncome = projections.filter((item) => item.type === 'income').reduce((sum, item) => sum + item.amount, 0)
  const projectedExpense = projections.filter((item) => item.type === 'expense').reduce((sum, item) => sum + item.amount, 0)

  const receitaPrevista = totals.receitaPrevista + projectedIncome
  const despesaPrevista = totals.despesaPrevista + projectedExpense
  const saldoPrevisto = receitaPrevista - despesaPrevista
  const saldoReal = totals.receitaReal - totals.despesaReal

  const normalizedBudget = normalizeBudget(budget)
  const baseMensalBruta = calcBaseMensalBruta(normalizedBudget, receitaPrevista)
  const baseMensal = calcBaseMensal(normalizedBudget, receitaPrevista)
  const savingsRate = Math.min(1, Math.max(0, normalizedBudget?.savingsRate ?? 0))
  const reservaInvestimento = baseMensalBruta * savingsRate

  const despesasConfirmadas = monthTransactions.filter((tx) => tx.type === 'expense' && isConfirmed(tx))
    .reduce((sum, tx) => sum + tx.amount, 0)

  const despesasPlanejadasAteHoje = sumExpensesByDate(monthTransactions, 'planned', todayISO)
  const despesasProjetadasAteHoje = projections
    .filter((item) => item.type === 'expense' && item.date <= todayISO)
    .reduce((sum, item) => sum + item.amount, 0)

  const despesasConsumidas = despesasConfirmadas + despesasPlanejadasAteHoje + despesasProjetadasAteHoje

  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const diasRestantes = Math.max(0, lastDay - now.getDate() + 1)

  const gastoHoje = monthTransactions
    .filter((tx) => tx.date === todayISO && tx.type === 'expense' && isConfirmed(tx))
    .reduce((sum, tx) => sum + tx.amount, 0)

  const gastoOntem = monthTransactions
    .filter((tx) => tx.date === yesterdayISO && tx.type === 'expense' && isConfirmed(tx))
    .reduce((sum, tx) => sum + tx.amount, 0)

  const daily = calcDailyBudget({
    baseMensal,
    despesasConsumidas,
    diasRestantes,
    gastoHoje,
    gastoOntem,
    carryOverMode: normalizedBudget?.carryOverMode ?? 'daily_simple',
  })

  const statusMes = calcMonthStatus({
    saldoPrevisto,
    baseMensal,
    baseRestante: daily.baseRestante,
    receitaPrevista,
    despesaPrevista,
  })

  return {
    month,
    receitaReal: totals.receitaReal,
    despesaReal: totals.despesaReal,
    receitaPrevista,
    despesaPrevista,
    saldoReal,
    saldoPrevisto,
    savingsRate,
    baseMensalBruta,
    reservaInvestimento,
    baseMensal,
    baseRestante: daily.baseRestante,
    diasRestantes,
    orcamentoDiario: daily.orcamentoDiario,
    orcamentoHoje: daily.orcamentoHoje,
    gastoHoje,
    gastoOntem,
    diferencaOntem: daily.diferencaOntem,
    diferencaHoje: daily.diferencaHoje,
    statusDia: daily.statusDia,
    statusMes,
  }
}

export function getCategorySummary(transactions: Transaction[], month: string): CategorySummaryItem[] {
  const monthTransactions = transactions.filter((tx) => tx.date.startsWith(month) && tx.type === 'expense')

  // Recategorize transactions with empty or generic category
  const recategorizedTransactions = monthTransactions.map((tx) => {
    if (!tx.category || tx.category.trim() === '' || tx.category.toLowerCase() === 'outros') {
      const suggestedCategory = suggestCategory(tx.note || '', tx.type)
      return { ...tx, category: suggestedCategory || tx.category }
    }
    return tx
  })

  const byCategory = recategorizedTransactions.reduce<Record<string, number>>((acc, tx) => {
    const category = tx.category || 'Outros'
    if (!acc[category]) acc[category] = 0
    acc[category] += tx.amount
    return acc
  }, {})

  return Object.entries(byCategory)
    .map(([categoria, total]) => ({ categoria, total }))
    .sort((a, b) => b.total - a.total)
}

