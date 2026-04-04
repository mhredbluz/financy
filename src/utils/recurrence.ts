import type { RecurringTransaction } from '../types'

const parseLocalDate = (iso: string) => {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, month - 1, day)
}

const toLocalISODate = (date: Date) => {
  const d = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return d.toISOString().slice(0, 10)
}

export function isDueOn(recurring: RecurringTransaction, isoDate: string): boolean {
  const target = parseLocalDate(isoDate)
  const start = parseLocalDate(recurring.startDate)
  const end = recurring.endDate ? parseLocalDate(recurring.endDate) : null

  if (target < start) return false
  if (end && target > end) return false

  const targetY = target.getFullYear()
  const targetM = target.getMonth()
  const targetD = target.getDate()

  const startY = start.getFullYear()
  const startM = start.getMonth()
  const startD = start.getDate()

  switch (recurring.recurrenceType) {
    case 'daily': {
      const diffDays = Math.floor((target.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      return diffDays >= 0
    }
    case 'weekly': {
      const diffDays = Math.floor((target.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      return diffDays >= 0 && diffDays % 7 === 0
    }
    case 'monthly': {
      if (targetD !== startD) return false
      const diffMonths = (targetY - startY) * 12 + (targetM - startM)
      return diffMonths >= 0
    }
    case 'yearly': {
      return targetM === startM && targetD === startD && targetY >= startY
    }
    default:
      return false
  }
}

export function getNextDueFrom(recurring: RecurringTransaction, fromIso: string): string | null {
  const start = parseLocalDate(recurring.startDate)
  const end = recurring.endDate ? parseLocalDate(recurring.endDate) : null
  const from = parseLocalDate(fromIso)
  const cursor = new Date(Math.max(start.getTime(), from.getTime()))

  // Simple forward scan (max 366 iterations for daily, 120 for monthly)
  for (let i = 0; i < 400; i += 1) {
    const iso = toLocalISODate(cursor)
    if (isDueOn(recurring, iso)) {
      if (!end || cursor <= end) return iso
    }
    cursor.setDate(cursor.getDate() + 1)
  }

  return null
}
