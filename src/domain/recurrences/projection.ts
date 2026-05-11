import type { RecurringTransaction, Transaction, TransactionType } from '../../types'
import { hasMatchingTransaction } from '../../utils/recurrence'

export interface RecurrenceProjectionItem {
  date: string
  type: TransactionType
  amount: number
  category: string
  note?: string
  recurringId: string
}

const parseLocalDate = (iso: string) => {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function getMonthKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

export function projectRecurrencesForMonth(
  recurringTransactions: RecurringTransaction[],
  transactions: Transaction[],
  now: Date,
): RecurrenceProjectionItem[] {
  const year = now.getFullYear()
  const monthIndex = now.getMonth()
  const monthKey = getMonthKey(now)
  const lastDay = new Date(year, monthIndex + 1, 0).getDate()
  const existingRecurringSet = new Set(
    transactions
      .filter((tx) => tx.recurringId)
      .map((tx) => `${tx.recurringId}|${tx.date}`),
  )

  const projections: RecurrenceProjectionItem[] = []

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
        if (hasMatchingTransaction(rec, transactions, iso)) continue

        projections.push({
          date: iso,
          type: rec.type,
          amount: rec.amount,
          category: rec.category,
          note: rec.note,
          recurringId: rec.id,
        })
      }
    })

  return projections
}
