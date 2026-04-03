export type TransactionType = 'income' | 'expense'

export interface Transaction {
  id: string
  date: string // YYYY-MM-DD
  type: TransactionType
  amount: number
  category: string
  note?: string
}

export interface Budget {
  month: string // YYYY-MM
  limit: number
}

export interface AppData {
  transactions: Transaction[]
  budget?: Budget
}
