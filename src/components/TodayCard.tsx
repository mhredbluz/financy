import type { DashboardSummary } from '../api/dashboard'
import { useAppContext } from '../context/AppContext'
import { useGoalsContext } from '../context/GoalsContext'
import { isDueOn } from '../utils/recurrence'

type CalendarView = 'day' | 'week' | 'month' | 'year'

interface TodayCardProps {
  summary: DashboardSummary
  selectedDate: string
  calendarView: CalendarView
  onDateChange: (date: string) => void
  onViewChange: (view: CalendarView) => void
}

const parseLocalDate = (iso: string) => {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, month - 1, day)
}

const formatDate = (iso: string) =>
  parseLocalDate(iso).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' })

const toMonthLabel = (iso: string) =>
  parseLocalDate(iso).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

const toYearLabel = (iso: string) => parseLocalDate(iso).getFullYear().toString()

const toLocalISODate = (date: Date) => {
  const d = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return d.toISOString().slice(0, 10)
}

const moveN = (base: string, value: number, unit: CalendarView): string => {
  const d = parseLocalDate(base)
  switch (unit) {
    case 'day':
      d.setDate(d.getDate() + value)
      break
    case 'week':
      d.setDate(d.getDate() + value * 7)
      break
    case 'month':
      d.setMonth(d.getMonth() + value)
      break
    case 'year':
      d.setFullYear(d.getFullYear() + value)
      break
  }
  return toLocalISODate(d)
}

export default function TodayCard({ summary, selectedDate, calendarView, onDateChange, onViewChange }: TodayCardProps) {
  const { transactions, recurringTransactions } = useAppContext()
  const { goals } = useGoalsContext()
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

  const isOver = summary.diferencaHoje < 0

  const title = (() => {
    switch (calendarView) {
      case 'day':
        return formatDate(selectedDate)
      case 'week': {
        const start = moveN(selectedDate, 0, 'day')
        const end = moveN(selectedDate, 6, 'day')
        return `${formatDate(start)} - ${formatDate(end)}`
      }
      case 'month':
        return toMonthLabel(selectedDate)
      case 'year':
        return toYearLabel(selectedDate)
    }
  })()

  const handlePrev = () => onDateChange(moveN(selectedDate, -1, calendarView))
  const handleNext = () => onDateChange(moveN(selectedDate, 1, calendarView))

  const dayTransactions = transactions.filter((tx) => tx.date === selectedDate)
  const dayExpenses = dayTransactions.filter((tx) => tx.type === 'expense')

  const recurringDueToday = recurringTransactions.filter((rec) => {
    if (!rec.isActive) return false
    return isDueOn(rec, selectedDate)
  })

  const selectedMonth = selectedDate.slice(0, 7)
  const monthTransactions = transactions.filter((tx) => tx.date.startsWith(selectedMonth))

  const openGoals = goals.filter((goal) => {
    if (goal.month !== selectedMonth) return false
    if (goal.type === 'savings' || goal.type === 'monthly_target') {
      const allocated = goal.allocatedAmount || 0
      return allocated < goal.targetAmount
    }
    if (goal.type === 'category_limit' && goal.category) {
      const spent = monthTransactions
        .filter((tx) => tx.type === 'expense' && tx.category === goal.category)
        .reduce((sum, tx) => sum + tx.amount, 0)
      return spent < goal.targetAmount
    }
    return true
  })

  return (
    <section key={selectedDate} className={`today-card ${isOver ? 'over' : 'ok'}`}>
      <div className="today-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <h2>📅 {title}</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <button onClick={handlePrev} style={{ padding: '0.25rem 0.55rem' }}>⬅</button>
          <button onClick={handleNext} style={{ padding: '0.25rem 0.55rem' }}>➡</button>
        </div>
      </div>

      <div style={{ marginBottom: '0.75rem' }}>
        <select value={calendarView} onChange={(e) => onViewChange(e.target.value as CalendarView)} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #334155', background: 'var(--surface)', color: 'var(--text-strong)' }}>
          <option value="day">Dia</option>
          <option value="week">Semana</option>
          <option value="month">Mês</option>
          <option value="year">Ano</option>
        </select>
      </div>

      <div className="today-grid">
        <div>
          <strong>Dias restantes</strong>
          <p>{summary.diasRestantes}</p>
        </div>
        <div>
          <strong>Limite diário</strong>
          <p>{formatCurrency(summary.orcamentoHoje)}</p>
          <small style={{ color: 'var(--text-weak)' }}>
            Carry-over: {formatCurrency(summary.diferencaOntem)}
          </small>
        </div>
        <div>
          <strong>Gastou</strong>
          <p>{formatCurrency(summary.gastoHoje)}</p>
        </div>
        <div>
          <strong>{isOver ? 'Estourou' : 'Falta'}</strong>
          <p>{formatCurrency(Math.abs(summary.diferencaHoje))}</p>
        </div>
      </div>
      {isOver && (
        <div className="alert">
          <p>🔴 Você estourou em {formatCurrency(Math.abs(summary.diferencaHoje))}</p>
        </div>
      )}
      {!isOver && summary.gastoHoje > 0 && (
        <div className="alert ok">
          <p>🟢 Dentro do orçamento! Restam {formatCurrency(summary.diferencaHoje)}</p>
        </div>
      )}

      <div className="today-sections">
        <div className="today-section">
          <div className="today-section-title">Contas do dia</div>
          {dayExpenses.length === 0 ? (
            <p className="today-empty">Nenhuma despesa registrada hoje.</p>
          ) : (
            <ul className="today-list">
              {dayExpenses.slice(0, 6).map((tx) => (
                <li key={tx.id}>
                  <span>{tx.category || 'Sem categoria'}</span>
                  <strong>{formatCurrency(tx.amount)}</strong>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="today-section">
          <div className="today-section-title">Recorrências de hoje</div>
          {recurringDueToday.length === 0 ? (
            <p className="today-empty">Nenhuma recorrência vence hoje.</p>
          ) : (
            <ul className="today-list">
              {recurringDueToday.map((rec) => (
                <li key={rec.id}>
                  <span>{rec.category}</span>
                  <strong>{formatCurrency(rec.amount)}</strong>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="today-section">
          <div className="today-section-title">Metas em aberto</div>
          {openGoals.length === 0 ? (
            <p className="today-empty">Nenhuma meta pendente neste mês.</p>
          ) : (
            <ul className="today-list">
              {openGoals.slice(0, 6).map((goal) => {
                let remaining = 0
                if (goal.type === 'savings' || goal.type === 'monthly_target') {
                  remaining = goal.targetAmount - (goal.allocatedAmount || 0)
                } else if (goal.type === 'category_limit' && goal.category) {
                  const spent = monthTransactions
                    .filter((tx) => tx.type === 'expense' && tx.category === goal.category)
                    .reduce((sum, tx) => sum + tx.amount, 0)
                  remaining = goal.targetAmount - spent
                }
                return (
                  <li key={goal.id}>
                    <span>{goal.title}</span>
                    <strong>{formatCurrency(Math.max(0, remaining))}</strong>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}

