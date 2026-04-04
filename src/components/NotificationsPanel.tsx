import { useEffect, useMemo, useState } from 'react'
import { useAppContext } from '../context/AppContext'
import type { Transaction } from '../types'

const formatDate = (ts: string) => new Date(ts).toLocaleDateString('pt-BR')

function getLatestTransactionDate(transactions: Transaction[]): string | null {
  if (transactions.length === 0) return null
  const dates = transactions.map((tx) => tx.date).sort((a, b) => b.localeCompare(a))
  return dates[0]
}

function getDaysAgoFromDate(date: string, baseDate: Date): number {
  const d = new Date(date)
  const diff = baseDate.getTime() - d.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

export default function NotificationsPanel() {
  const { transactions, selectedMonth, selectedDate, budgetLimit } = useAppContext()
  const [notifications, setNotifications] = useState<string[]>([])
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default')

  const lastTransactionDate = getLatestTransactionDate(transactions)
  const baseDate = new Date(selectedDate)
  const daysSinceLastTransaction = lastTransactionDate ? getDaysAgoFromDate(lastTransactionDate, baseDate) : Infinity

  const monthExpenses = useMemo(() => {
    return transactions
      .filter((tx) => tx.type === 'expense' && tx.date.startsWith(selectedMonth))
      .reduce((sum, tx) => sum + tx.amount, 0)
  }, [transactions, selectedMonth])

  const monthProgress = budgetLimit > 0 ? (monthExpenses / budgetLimit) * 100 : 0

  const pushButtonLabel = permissionStatus === 'granted' ? 'Push ativado' : 'Ativar notificações push'

  useEffect(() => {
    const stored = localStorage.getItem('financy-last-notification')
    const seen = stored ? JSON.parse(stored as string) as Record<string, string> : {}
    const now = new Date(selectedDate).toISOString().slice(0, 10)

    const newNotifications: string[] = []

    if (daysSinceLastTransaction >= 2) {
      const key = 'reminder-transaction'
      if (seen[key] !== now) {
        newNotifications.push(`🕒 Lembrete: você não registrou transações há ${daysSinceLastTransaction} dias. Faça um registro hoje para manter sua consistência.`)
        seen[key] = now
      }
    }

    const budgetThresholds = [80, 90, 100]
    budgetThresholds.forEach((threshold) => {
      if (monthProgress >= threshold) {
        const key = `budget-${threshold}`
        if (seen[key] !== now) {
          newNotifications.push(`⚠️ Alerta orçamento: você atingiu ${threshold}% do seu limite mensal (${formatDate(new Date(selectedDate).toISOString())}).`)
          seen[key] = now
        }
      }
    })

    localStorage.setItem('financy-last-notification', JSON.stringify(seen))

    if (newNotifications.length > 0) {
      setNotifications((prev) => [...newNotifications, ...prev])
      if (permissionStatus === 'granted') {
        newNotifications.forEach((msg) => {
          new Notification('Financy', { body: msg })
        })
      }
    }
  }, [daysSinceLastTransaction, monthProgress, permissionStatus, selectedDate])

  useEffect(() => {
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission)
    }
  }, [])

  const requestPushPermission = () => {
    if (!('Notification' in window)) return
    Notification.requestPermission().then((perm) => {
      setPermissionStatus(perm)
      if (perm === 'granted') {
        setNotifications((prev) => [...prev, '✅ Notificações push ativadas!'])
      }
    })
  }

  const weeklyHint = '📩 Resumos semanais por email serão implementados em breve (futuro).'

  return (
    <section className="budget-card" style={{ marginTop: '1rem' }}>
      <h2>Notificações Inteligentes</h2>

      <div style={{ marginBottom: '0.8rem' }}>
        <strong>Última transação:</strong> {lastTransactionDate ?? 'Nenhuma'}
      </div>
      <div style={{ marginBottom: '1rem' }}>
        {daysSinceLastTransaction === Infinity ? 'Nenhuma transação cadastrada ainda.' : `Você não registra há ${daysSinceLastTransaction} dias.`}
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <strong>Progresso do orçamento:</strong> {monthProgress.toFixed(1)}% de {budgetLimit}
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <button style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '0.5rem 0.75rem', borderRadius: '5px' }} onClick={requestPushPermission}>
          {pushButtonLabel}
        </button>
        <button style={{ background: 'var(--text-weak)', color: 'white', border: 'none', padding: '0.5rem 0.75rem', borderRadius: '5px' }} onClick={() => setNotifications((prev) => [...prev, weeklyHint])}>
          Ver resumo semanal (futuro)
        </button>
      </div>

      {notifications.length > 0 ? (
        <div style={{ background: 'rgba(30, 41, 59, 0.35)', borderRadius: '10px', padding: '0.75rem' }}>
          {notifications.slice(0, 5).map((note, index) => (
            <p key={index} style={{ margin: '0.3rem 0' }}>• {note}</p>
          ))}
          {notifications.length > 5 && <p style={{ color: 'var(--text-weak)' }}>(+{notifications.length - 5} notificações antigas)</p>}
        </div>
      ) : (
        <p style={{ color: 'var(--text-weak)' }}>Nenhuma notificação nova.</p>
      )}

      <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-medium)' }}>
        🔔 Aqui o app sugere lembrete se ficar 2 dias sem transação, e alerta 80/90/100% do orçamento. (Push via Notification API / PWA e email semanal são protótipos)
      </div>
    </section>
  )
}

