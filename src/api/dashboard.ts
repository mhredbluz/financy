import type { Transaction, RecurringTransaction } from '../types'
import { suggestCategory } from '../utils/categorySuggester'
import { calcSaldoDisponivel, calcLimiteDiarioBase, calcLimiteHoje } from '../domain/budget'

export interface DashboardSummary {
  totalReceitaReal: number
  totalDespesasReal: number
  saldoReal: number
  recorrenciaReceita: number
  recorrenciaDespesas: number
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

const parseLocalDate = (iso: string) => {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, month - 1, day)
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

function getRecurringProjectionForMonth(
  recurringTransactions: RecurringTransaction[],
  transactions: Transaction[],
  now: Date,
) {
  const year = now.getFullYear()
  const monthIndex = now.getMonth()
  const monthKey = getMonthKey(now)
  const lastDay = new Date(year, monthIndex + 1, 0).getDate()
  const existingRecurringSet = new Set(
    transactions
      .filter((tx) => tx.recurringId)
      .map((tx) => `${tx.recurringId}|${tx.date}`),
  )

  let recurringIncomeMissing = 0
  let recurringExpenseMissing = 0

  recurringTransactions
    .filter((rec) => rec.isActive)
    .forEach((rec) => {
      for (let day = 1; day <= lastDay; day += 1) {
        const iso = `${monthKey}-${String(day).padStart(2, '0')}`
        const target = parseLocalDate(iso)
        const start = parseLocalDate(rec.startDate)
        const end = rec.endDate ? parseLocalDate(rec.endDate) : null

        if (target < start) continue
        if (end && target > end) continue

        const targetY = target.getFullYear()
        const targetM = target.getMonth()
        const targetD = target.getDate()

        const startY = start.getFullYear()
        const startM = start.getMonth()
        const startD = start.getDate()

        let occurs = false
        switch (rec.recurrenceType) {
          case 'daily': {
            const diffDays = Math.floor((target.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
            occurs = diffDays >= 0
            break
          }
          case 'weekly': {
            const diffDays = Math.floor((target.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
            occurs = diffDays >= 0 && diffDays % 7 === 0
            break
          }
          case 'monthly': {
            if (targetD === startD) {
              const diffMonths = (targetY - startY) * 12 + (targetM - startM)
              occurs = diffMonths >= 0
            }
            break
          }
          case 'yearly': {
            occurs = targetM === startM && targetD === startD && targetY >= startY
            break
          }
          default:
            occurs = false
        }

        if (!occurs) continue

        const key = `${rec.id}|${iso}`
        if (existingRecurringSet.has(key)) continue

        if (rec.type === 'income') {
          recurringIncomeMissing += rec.amount
        } else {
          recurringExpenseMissing += rec.amount
        }
      }
    })

  return {
    recurringIncomeMissing,
    recurringExpenseMissing,
  }
}

export function getDashboardSummary(
  transactions: Transaction[],
  recurringTransactions: RecurringTransaction[],
  budgetLimit: number,
  now = new Date(),
): DashboardSummary {
  const month = getMonthKey(now)
  const monthTransactions = transactions.filter((tx) => tx.date.startsWith(month))

  const totalReceitaReal = monthTransactions
    .filter((tx) => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0)

  const totalDespesasReal = monthTransactions
    .filter((tx) => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0)

  const saldoReal = totalReceitaReal - totalDespesasReal

  const { recurringIncomeMissing, recurringExpenseMissing } = getRecurringProjectionForMonth(
    recurringTransactions,
    transactions,
    now,
  )

  const totalReceita = totalReceitaReal + recurringIncomeMissing
  const totalDespesas = totalDespesasReal + recurringExpenseMissing
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
  const todayISO = toLocalISODate(now)
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayISO = toLocalISODate(yesterday)

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
    totalReceitaReal,
    totalDespesasReal,
    saldoReal,
    recorrenciaReceita: recurringIncomeMissing,
    recorrenciaDespesas: recurringExpenseMissing,
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


