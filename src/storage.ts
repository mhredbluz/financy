import type { AppData, Transaction, Goal, RecurringTransaction, BackupSnapshot, IntegrationSettings } from './types'

const STORAGE_KEY = 'financy-app-data'
const BACKUP_HISTORY_KEY = 'financy-backup-history'

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
    const data = JSON.parse(raw) as AppData

    // Migrar metas antigas salvas fora do app data
    if (!data.goals) {
      try {
        const legacyGoalsRaw = localStorage.getItem('financy-custom-goals')
        if (legacyGoalsRaw) {
          const legacyGoals = JSON.parse(legacyGoalsRaw) as Goal[]
          data.goals = legacyGoals
          saveAppData(data, false)
          localStorage.removeItem('financy-custom-goals')
        }
      } catch {
        // ignora erro de migração
      }
    }

    // Migrar recorrÃªncias antigas salvas fora do app data
    if (!data.recurringTransactions) {
      try {
        const legacyRecurringRaw = localStorage.getItem('financy-recurring-transactions')
        if (legacyRecurringRaw) {
          const legacyRecurring = JSON.parse(legacyRecurringRaw) as RecurringTransaction[]
          data.recurringTransactions = legacyRecurring
          saveAppData(data, false)
          localStorage.removeItem('financy-recurring-transactions')
        }
      } catch {
        // ignora erro de migraÃ§Ã£o
      }
    }

    return data
  } catch {
    return defaultData
  }
}

const parseLocalDate = (iso: string) => {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, month - 1, day)
}

const toLocalISODate = (date: Date) => {
  const d = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return d.toISOString().slice(0, 10)
}

function appendBackup(data: AppData, label?: string) {
  const historyRaw = localStorage.getItem(BACKUP_HISTORY_KEY)
  const history: BackupSnapshot[] = historyRaw ? JSON.parse(historyRaw) : []
  const backup: BackupSnapshot = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    label,
    data
  }
  const maxHistory = 20
  const trimmed = [...history, backup].slice(-maxHistory)
  localStorage.setItem(BACKUP_HISTORY_KEY, JSON.stringify(trimmed))
}

export function saveAppData(data: AppData, createBackup = true, label?: string) {
  if (createBackup) {
    const currentData = loadAppData()
    appendBackup(currentData, label)
  }
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

// FunÃ§Ãµes para gerenciar metas
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

export function getIntegrationSettings() {
  const data = loadAppData()
  return data.integrations || {
    googleCalendarEmail: '',
    whatsappNumber: '',
    whatsappApiUrl: '',
    whatsappApiToken: '',
  }
}

export function setIntegrationSettings(settings: Partial<IntegrationSettings>) {
  const data = loadAppData()
  data.integrations = { ...(data.integrations || {}), ...settings }
  saveAppData(data, false)
}

export function getBackupHistory(): BackupSnapshot[] {
  const raw = localStorage.getItem(BACKUP_HISTORY_KEY)
  return raw ? JSON.parse(raw) : []
}

export function restoreBackup(backupId: string): boolean {
  const history = getBackupHistory()
  const backup = history.find((item) => item.id === backupId)
  if (!backup) return false
  saveAppData(backup.data, false)
  return true
}

export function clearBackupHistory() {
  localStorage.removeItem(BACKUP_HISTORY_KEY)
}

export function importAppData(raw: string): { success: boolean; message: string } {
  try {
    const parsed = JSON.parse(raw) as AppData
    if (!parsed || !Array.isArray(parsed.transactions)) {
      return { success: false, message: 'Formato invÃ¡lido. Esperado objeto AppData com transactions[].' }
    }
    saveAppData(parsed)
    return { success: true, message: 'Dados importados com sucesso.' }
  } catch {
    return { success: false, message: 'Erro ao parsear JSON. Verifique o conteÃºdo.' }
  }
}

export function prepareTransactionsCSV(data: AppData): string {
  const headers = ['id', 'date', 'type', 'amount', 'category', 'note', 'recurringId']
  const rows = data.transactions.map((tx) => [
    tx.id,
    tx.date,
    tx.type,
    tx.amount.toFixed(2),
    tx.category,
    tx.note || '',
    tx.recurringId || ''
  ])
  const escaped = rows.map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
  return [headers.join(','), ...escaped].join('\n')
}

// FunÃ§Ãµes para gerenciar recorrÃªncias
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
  const todayISO = toLocalISODate(today)
  const newTransactions: Transaction[] = []

  recurring.forEach((rec) => {
    const lastGenerated = rec.lastGenerated ? parseLocalDate(rec.lastGenerated) : parseLocalDate(rec.startDate)
    const endDate = rec.endDate ? parseLocalDate(rec.endDate) : null

    let nextDate = new Date(lastGenerated)
    let generatedForRec = false

    // Calcula a prÃ³xima data baseada no tipo de recorrÃªncia
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

    // Gera transaÃ§Ãµes atÃ© hoje (ou data limite)
    while (nextDate <= today && (!endDate || nextDate <= endDate)) {
      // Verifica se jÃ¡ existe uma transaÃ§Ã£o para esta data e recorrÃªncia
      const existingTx = data.transactions.find(tx =>
        tx.recurringId === rec.id &&
        tx.date === toLocalISODate(nextDate)
      )

      if (!existingTx) {
        newTransactions.push({
          id: crypto.randomUUID(),
          date: toLocalISODate(nextDate),
          type: rec.type,
          amount: rec.amount,
          category: rec.category,
          note: rec.note,
          recurringId: rec.id
        })
        generatedForRec = true
      }

      // Calcula prÃ³xima data
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
    if (generatedForRec) {
      const updatedRec = { ...rec, lastGenerated: todayISO }
      updateRecurringTransaction(updatedRec)
    }
  })

  // Adiciona as novas transaÃ§Ãµes
  newTransactions.forEach(tx => data.transactions.push(tx))
  saveAppData(data, false)

  return newTransactions.length
}

