import type { Transaction } from '../types'
import { suggestCategory } from '../utils/categorySuggester'
import { calcSaldoDisponivel, calcLimiteDiarioBase, calcLimiteHoje } from '../domain/budget'

export interface DashboardSummary {
  totalReceita: number
  totalDespesas: number
  saldo: number
  diasRestantes: number
  orcamentoDiario: number
  status: 'OK' | 'ALERTA' | 'PERIGO'
  gastoHoje: number
  orcamentoHoje: number
  diferencaHoje: number
  diferencaOntem: number
  statusHoje: 'OK' | 'ESTOURO'
}

export interface CategorySummaryItem {
  categoria: string
  total: number
}

export function getDashboardSummary(transactions: Transaction[], budgetLimit: number, now = new Date()): DashboardSummary {
  const month = now.toISOString().slice(0, 7)
  const monthTransactions = transactions.filter((tx) => tx.date.startsWith(month))

  const totalReceita = monthTransactions
    .filter((tx) => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0)

  const totalDespesas = monthTransactions
    .filter((tx) => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0)

  const saldo = totalReceita - totalDespesas

  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const diasRestantes = Math.max(0, lastDay - now.getDate())

  const saldoDisponivel = calcSaldoDisponivel(saldo, 0.3)
  const limiteDiarioBase = calcLimiteDiarioBase(saldoDisponivel, diasRestantes)
  const orcamentoDiario = limiteDiarioBase

  let status: DashboardSummary['status'] = 'OK'

  if (saldo <= 0) {
    status = 'PERIGO'
  } else if (orcamentoDiario < (budgetLimit ?? 0) * 0.15 || totalDespesas / (budgetLimit || 1) >= 0.8) {
    status = 'ALERTA'
  }

  // Daily fields based on selected date (now)
  const todayISO = now.toISOString().slice(0, 10)
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayISO = yesterday.toISOString().slice(0, 10)

  const gastoHoje = transactions
    .filter((tx) => tx.date === todayISO && tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0)

  const gastoOntem = transactions
    .filter((tx) => tx.date === yesterdayISO && tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0)

  const diferencaOntem = limiteDiarioBase - gastoOntem
  const orcamentoHoje = saldo <= 0 ? 0 : calcLimiteHoje(limiteDiarioBase, diferencaOntem)
  const diferencaHoje = orcamentoHoje - gastoHoje
  const statusHoje: DashboardSummary['statusHoje'] = gastoHoje <= orcamentoHoje ? 'OK' : 'ESTOURO'

  return {
    totalReceita,
    totalDespesas,
    saldo,
    diasRestantes,
    orcamentoDiario,
    status,
    gastoHoje,
    orcamentoHoje,
    diferencaHoje,
    diferencaOntem,
    statusHoje,
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
