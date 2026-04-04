import { createContext, useContext } from 'react'
import type { Transaction, RecurringTransaction } from '../types'

interface AppContextValue {
  transactions: Transaction[]
  selectedMonth: string
  selectedDate: string
  budgetLimit: number
  recurringTransactions: RecurringTransaction[]
  setRecurringTransactions: (next: RecurringTransaction[]) => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ value, children }: { value: AppContextValue; children: React.ReactNode }) {
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) {
    throw new Error('useAppContext must be used within AppProvider')
  }
  return ctx
}
