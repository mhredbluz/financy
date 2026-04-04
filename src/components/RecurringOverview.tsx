import { useMemo } from 'react'
import { useAppContext } from '../context/AppContext'
import { getNextDueFrom, isDueOn } from '../utils/recurrence'

export default function RecurringOverview() {
  const { selectedDate, transactions, recurringTransactions } = useAppContext()

  const upcoming = useMemo(() => {
    const list = recurringTransactions
      .filter((rec) => rec.isActive)
      .map((rec) => ({
        rec,
        nextDue: getNextDueFrom(rec, selectedDate),
      }))
      .filter((item) => item.nextDue !== null)
      .sort((a, b) => (a.nextDue as string).localeCompare(b.nextDue as string))

    return list.slice(0, 6)
  }, [recurringTransactions, selectedDate])

  const dueToday = recurringTransactions
    .filter((rec) => rec.isActive)
    .filter((rec) => isDueOn(rec, selectedDate))

  const dueTodayTotal = dueToday.reduce((sum, rec) => sum + rec.amount, 0)

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

  return (
    <section className="budget-card">
      <div className="reports-header">
        <div>
          <h2>Recorrências Ativas</h2>
          <p className="reports-sub">Previstas para hoje e próximas datas.</p>
        </div>
        <div className="pill">Hoje: {formatCurrency(dueTodayTotal)}</div>
      </div>

      {upcoming.length === 0 ? (
        <p style={{ color: 'var(--text-weak)' }}>Nenhuma recorrência ativa.</p>
      ) : (
        <ul className="today-list">
          {upcoming.map(({ rec, nextDue }) => {
            const generated = transactions.some((tx) => tx.recurringId === rec.id && tx.date === nextDue)
            return (
              <li key={rec.id} style={{ padding: '0.4rem 0' }}>
                <span>{rec.category}</span>
                <span style={{ color: 'var(--text-weak)', fontSize: '0.85rem' }}>{nextDue}</span>
                <strong>{formatCurrency(rec.amount)}</strong>
                {generated && <span style={{ color: 'var(--success)', fontSize: '0.8rem' }}>Gerada</span>}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
