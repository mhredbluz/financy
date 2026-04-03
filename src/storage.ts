import type { AppData, Transaction, Goal, RecurringTransaction } from './types'

const STORAGE_KEY = 'financy-app-data'

const defaultData: AppData = { transactions: [] }

import testData from './data.json'

export function loadAppData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      // Carregar dados de teste se não houver dados salvos
      saveAppData(testData as AppData)
      return testData as AppData
    }
    return JSON.parse(raw) as AppData
  } catch {
    return defaultData
  }
}

export function saveAppData(data: AppData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function addTransaction(tx: Transaction) {
  const data = loadAppData()
  data.transactions.push(tx)
  saveAppData(data)
}

export function updateTransaction(updated: Transaction) {
  const data = loadAppData()
  data.transactions = data.transactions.map((tx) => (tx.id === updated.id ? updated : tx))
  saveAppData(data)
}

export function deleteTransaction(txId: string) {
  const data = loadAppData()
  data.transactions = data.transactions.filter((tx) => tx.id !== txId)
  saveAppData(data)
}

export function setBudget(month: string, limit: number) {
  const data = loadAppData()
  data.budget = { month, limit }
  saveAppData(data)
}

// Funções para gerenciar metas
export function addGoal(goal: Goal) {
  const data = loadAppData()
  if (!data.goals) data.goals = []
  data.goals.push(goal)
  saveAppData(data)
}

export function updateGoal(updated: Goal) {
  const data = loadAppData()
  if (!data.goals) return
  data.goals = data.goals.map((goal) => (goal.id === updated.id ? updated : goal))
  saveAppData(data)
}

export function deleteGoal(goalId: string) {
  const data = loadAppData()
  if (!data.goals) return
  data.goals = data.goals.filter((goal) => goal.id !== goalId)
  saveAppData(data)
}

export function getGoalsForMonth(month: string): Goal[] {
  const data = loadAppData()
  return data.goals?.filter((goal) => goal.month === month) || []
}

// Funções para gerenciar recorrências
export function addRecurringTransaction(recurring: RecurringTransaction) {
  const data = loadAppData()
  if (!data.recurringTransactions) data.recurringTransactions = []
  data.recurringTransactions.push(recurring)
  saveAppData(data)
}

export function updateRecurringTransaction(updated: RecurringTransaction) {
  const data = loadAppData()
  if (!data.recurringTransactions) return
  data.recurringTransactions = data.recurringTransactions.map((rec) =>
    rec.id === updated.id ? updated : rec
  )
  saveAppData(data)
}

export function deleteRecurringTransaction(recurringId: string) {
  const data = loadAppData()
  if (!data.recurringTransactions) return
  data.recurringTransactions = data.recurringTransactions.filter((rec) => rec.id !== recurringId)
  saveAppData(data)
}

export function getActiveRecurringTransactions(): RecurringTransaction[] {
  const data = loadAppData()
  return data.recurringTransactions?.filter((rec) => rec.isActive) || []
}

export function generateRecurringTransactions() {
  const data = loadAppData()
  const recurring = getActiveRecurringTransactions()
  const today = new Date()
  const newTransactions: Transaction[] = []

  recurring.forEach((rec) => {
    const lastGenerated = rec.lastGenerated ? new Date(rec.lastGenerated) : new Date(rec.startDate)
    const endDate = rec.endDate ? new Date(rec.endDate) : null

    let nextDate = new Date(lastGenerated)

    // Calcula a próxima data baseada no tipo de recorrência
    switch (rec.recurrenceType) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + 1)
        break
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7)
        break
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1)
        break
      case 'yearly':
        nextDate.setFullYear(nextDate.getFullYear() + 1)
        break
    }

    // Gera transações até hoje (ou data limite)
    while (nextDate <= today && (!endDate || nextDate <= endDate)) {
      // Verifica se já existe uma transação para esta data e recorrência
      const existingTx = data.transactions.find(tx =>
        tx.recurringId === rec.id &&
        tx.date === nextDate.toISOString().slice(0, 10)
      )

      if (!existingTx) {
        newTransactions.push({
          id: crypto.randomUUID(),
          date: nextDate.toISOString().slice(0, 10),
          type: rec.type,
          amount: rec.amount,
          category: rec.category,
          note: rec.note,
          recurringId: rec.id
        })
      }

      // Calcula próxima data
      switch (rec.recurrenceType) {
        case 'daily':
          nextDate.setDate(nextDate.getDate() + 1)
          break
        case 'weekly':
          nextDate.setDate(nextDate.getDate() + 7)
          break
        case 'monthly':
          nextDate.setMonth(nextDate.getMonth() + 1)
          break
        case 'yearly':
          nextDate.setFullYear(nextDate.getFullYear() + 1)
          break
      }
    }

    // Atualiza lastGenerated
    if (newTransactions.length > 0) {
      const updatedRec = { ...rec, lastGenerated: today.toISOString().slice(0, 10) }
      updateRecurringTransaction(updatedRec)
    }
  })

  // Adiciona as novas transações
  newTransactions.forEach(tx => data.transactions.push(tx))
  saveAppData(data)

  return newTransactions.length
}
