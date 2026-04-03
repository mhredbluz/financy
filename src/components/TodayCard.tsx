import type { DashboardSummary } from '../api/dashboard'

interface TodayCardProps {
  summary: DashboardSummary
}

export default function TodayCard({ summary }: TodayCardProps) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

  const isOver = summary.diferencaHoje < 0

  return (
    <section className={`today-card ${isOver ? 'over' : 'ok'}`}>
      <h2>🔥 HOJE</h2>
      <div className="today-grid">
        <div>
          <strong>Dias restantes</strong>
          <p>{summary.diasRestantes}</p>
        </div>
        <div>
          <strong>Limite diário</strong>
          <p>{formatCurrency(summary.orcamentoHoje)}</p>
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