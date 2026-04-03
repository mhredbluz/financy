import type { AppData, Transaction } from './types'

const STORAGE_KEY = 'financy-app-data'

const defaultData: AppData = { transactions: [] }

export function loadAppData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultData
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
