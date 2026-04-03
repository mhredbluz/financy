import type { DashboardSummary } from '../api/dashboard'

type CalendarView = 'day' | 'week' | 'month' | 'year'

interface TodayCardProps {
  summary: DashboardSummary
  selectedDate: string
  calendarView: CalendarView
  onDateChange: (date: string) => void
  onViewChange: (view: CalendarView) => void
}

const formatDate = (iso: string) => new Date(iso).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' })

const toMonthLabel = (iso: string) => new Date(iso).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

const toYearLabel = (iso: string) => new Date(iso).getFullYear().toString()

const moveN = (base: string, value: number, unit: CalendarView): string => {
  const d = new Date(base)
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
  return d.toISOString().slice(0, 10)
}

export default function TodayCard({ summary, selectedDate, calendarView, onDateChange, onViewChange }: TodayCardProps) {
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

  return (
    <section className={`today-card ${isOver ? 'over' : 'ok'}`}>
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
    </section>
  )
}
