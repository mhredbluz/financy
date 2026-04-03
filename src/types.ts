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

export type GoalType = 'savings' | 'category_limit' | 'monthly_target'

export interface Goal {
  id: string
  type: GoalType
  title: string
  description?: string
  targetAmount: number
  category?: string // Para metas por categoria
  month: string // YYYY-MM
  createdAt: string
  deadline?: string // YYYY-MM-DD
}

export interface AppData {
  transactions: Transaction[]
  budget?: Budget
  goals?: Goal[]
}
