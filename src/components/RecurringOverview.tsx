import { useMemo } from 'react'
import { useAppContext } from '../context/AppContext'
import { addTransaction, loadAppData } from '../storage'
import { getNextDueFrom, hasMatchingTransaction, isDueOn } from '../utils/recurrence'

export default function RecurringOverview() {
  const { selectedDate, transactions, setTransactions, recurringTransactions, setRecurringTransactions } = useAppContext()

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
    .filter((rec) => !hasMatchingTransaction(rec, transactions, selectedDate))

  const dueTodayTotal = dueToday.reduce((sum, rec) => sum + rec.amount, 0)

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

  const handleLaunchToday = (recId: string) => {
    const recurring = recurringTransactions.find((item) => item.id === recId)
    if (!recurring) return
    if (!isDueOn(recurring, selectedDate)) return
    if (hasMatchingTransaction(recurring, transactions, selectedDate)) return

    addTransaction({
      id: crypto.randomUUID(),
      date: selectedDate,
      type: recurring.type,
      amount: recurring.amount,
      category: recurring.category,
      note: recurring.note,
      status: 'confirmed',
      origin: 'recurrence',
      recurringId: recurring.id,
    })
    setTransactions(loadAppData().transactions)

    const updatedRecurring = recurringTransactions.map((rec) =>
      rec.id === recurring.id ? { ...rec, lastGenerated: selectedDate } : rec,
    )
    setRecurringTransactions(updatedRecurring)
  }

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
            const generated = !!nextDue && hasMatchingTransaction(rec, transactions, nextDue)
            const isToday = nextDue === selectedDate
            return (
              <li key={rec.id} style={{ padding: '0.4rem 0' }}>
                <span>{rec.category}</span>
                <span style={{ color: 'var(--text-weak)', fontSize: '0.85rem' }}>{nextDue}</span>
                <strong>{formatCurrency(rec.amount)}</strong>
                {generated && <span style={{ color: 'var(--success)', fontSize: '0.8rem' }}>Gerada</span>}
                {!generated && isToday && (
                  <button
                    type="button"
                    className="ghost-btn"
                    onClick={() => handleLaunchToday(rec.id)}
                    style={{ marginLeft: '0.5rem' }}
                  >
                    Lançar hoje
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
