import { useState, useEffect } from 'react'
import type { RecurringTransaction } from '../types'

interface RecurringAlertsProps {
  onClose: () => void
}

export default function RecurringAlerts({ onClose }: RecurringAlertsProps) {
  const [upcomingRecurring, setUpcomingRecurring] = useState<RecurringTransaction[]>([])
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('financy-dismissed-recurring-alerts')
    return saved ? new Set(JSON.parse(saved)) : new Set()
  })

  useEffect(() => {
    const recurringTransactions: RecurringTransaction[] = JSON.parse(
      localStorage.getItem('financy-recurring-transactions') || '[]'
    )

    const today = new Date()
    const nextWeek = new Date(today)
    nextWeek.setDate(today.getDate() + 7)

    const upcoming = recurringTransactions.filter(recurring => {
      if (!recurring.isActive) return false
      if (dismissedAlerts.has(recurring.id)) return false

      const lastGenerated = recurring.lastGenerated ? new Date(recurring.lastGenerated) : new Date(recurring.startDate)
      const nextDue = getNextDueDate(lastGenerated, recurring.recurrenceType)

      return nextDue <= nextWeek && nextDue >= today
    })

    setUpcomingRecurring(upcoming)
  }, [dismissedAlerts])

  const getNextDueDate = (lastDate: Date, recurrenceType: string): Date => {
    const nextDate = new Date(lastDate)

    switch (recurrenceType) {
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

    return nextDate
  }

  const dismissAlert = (recurringId: string) => {
    const newDismissed = new Set(dismissedAlerts)
    newDismissed.add(recurringId)
    setDismissedAlerts(newDismissed)
    localStorage.setItem('financy-dismissed-recurring-alerts', JSON.stringify([...newDismissed]))
  }

  const getRecurrenceLabel = (type: string) => {
    switch (type) {
      case 'daily': return 'diária'
      case 'weekly': return 'semanal'
      case 'monthly': return 'mensal'
      case 'yearly': return 'anual'
      default: return type
    }
  }

  const getDaysUntilDue = (recurring: RecurringTransaction): number => {
    const lastGenerated = recurring.lastGenerated ? new Date(recurring.lastGenerated) : new Date(recurring.startDate)
    const nextDue = getNextDueDate(lastGenerated, recurring.recurrenceType)
    const today = new Date()
    const diffTime = nextDue.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (upcomingRecurring.length === 0) {
    return null
  }

  return (
    <div className="recurring-alerts-overlay">
      <div className="recurring-alerts">
        <div className="recurring-alerts-header">
          <div>
            <h3>🔔 Alertas de Recorrências</h3>
            <small style={{ fontSize: '0.8rem', color: 'var(--text-weak)' }}>
              Transações recorrentes nos próximos 7 dias
            </small>
          </div>
          <button onClick={onClose} className="close-btn">✕</button>
        </div>

        <div className="recurring-alerts-content">
          {upcomingRecurring.map((recurring) => {
            const daysUntil = getDaysUntilDue(recurring)
            const urgency = daysUntil <= 1 ? 'high' : daysUntil <= 3 ? 'medium' : 'low'

            return (
              <div key={recurring.id} className={`recurring-alert-item urgency-${urgency}`}>
                <div className="alert-icon">
                  {recurring.type === 'expense' ? '💸' : '💰'}
                </div>
                <div className="alert-content">
                  <strong>{recurring.category}</strong>
                  <small>
                    R$ {recurring.amount.toFixed(2)} • {getRecurrenceLabel(recurring.recurrenceType)}
                  </small>
                  <div className="alert-due">
                    {daysUntil === 0 ? '📅 Vence hoje!' :
                     daysUntil === 1 ? '📅 Vence amanhã!' :
                     `📅 Vence em ${daysUntil} dias`}
                  </div>
                  {recurring.note && (
                    <small style={{ display: 'block', marginTop: '0.25rem', fontStyle: 'italic' }}>
                      {recurring.note}
                    </small>
                  )}
                </div>
                <div className="alert-actions">
                  <button
                    onClick={() => dismissAlert(recurring.id)}
                    className="dismiss-btn"
                    title="Dispensar alerta"
                  >
                    ✓
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        <div className="recurring-alerts-footer">
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-medium)' }}>
            💡 As transações serão geradas automaticamente na data de vencimento.
          </p>
        </div>
      </div>
    </div>
  )
}