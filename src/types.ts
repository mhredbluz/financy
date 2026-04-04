export type TransactionType = 'income' | 'expense'
export type PaymentMethod = 'debit' | 'credit' | 'pix' | 'cash' | 'transfer'

export interface Transaction {
  id: string
  date: string // YYYY-MM-DD
  type: TransactionType
  amount: number
  category: string
  note?: string
  paymentMethod?: PaymentMethod
  recurringId?: string // ID da recorrÃªncia que gerou esta transaÃ§Ã£o
  allocatedToGoal?: string // ID da meta recebendo alocaÃ§Ã£o desta transaÃ§Ã£o
}

export interface Budget {
  month: string // YYYY-MM
  limit: number
}

export type RecurrenceType = 'daily' | 'weekly' | 'monthly' | 'yearly'

export interface RecurringTransaction {
  id: string
  type: TransactionType
  amount: number
  category: string
  note?: string
  recurrenceType: RecurrenceType
  startDate: string // YYYY-MM-DD
  endDate?: string // YYYY-MM-DD (opcional)
  lastGenerated?: string // YYYY-MM-DD
  isActive: boolean
  createdAt: string
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
  allocatedAmount?: number // Quanto foi realmente alocado/destinado
  linkedTransactions?: string[] // IDs das transaÃ§Ãµes vinculadas
}

export interface BackupSnapshot {
  id: string
  timestamp: string // ISO
  label?: string
  data: AppData
}

export interface IntegrationSettings {
  googleCalendarEmail?: string
  whatsappNumber?: string
  whatsappApiUrl?: string
  whatsappApiToken?: string
}

export interface AppData {
  transactions: Transaction[]
  budget?: Budget
  goals?: Goal[]
  recurringTransactions?: RecurringTransaction[]
  integrations?: IntegrationSettings
}

