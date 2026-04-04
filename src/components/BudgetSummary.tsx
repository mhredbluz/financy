import type { DashboardSummary } from '../api/dashboard'

interface BudgetSummaryProps {
  selectedDate: string
  summary: DashboardSummary
}

export default function BudgetSummary({
  selectedDate,
  summary,
}: BudgetSummaryProps) {
  const saldoBase = summary.saldo
  const saldoReal = summary.saldoReal
  const valorInvestir = saldoBase * 0.3
  const valorDisponivel = saldoBase * 0.7
  const valorInvestirReal = saldoReal * 0.3
  const valorDisponivelReal = saldoReal * 0.7
  const parseLocalDate = (iso: string) => {
    const [year, month, day] = iso.split('-').map(Number)
    return new Date(year, month - 1, day)
  }
  const monthLabel = parseLocalDate(selectedDate).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  return (
    <section className="budget-card budget-summary">
      <div className="budget-header">
        <div>
          <h2>Resumo do mês</h2>
          <p className="budget-sub">Saldo real, base diária e status do mês.</p>
        </div>
        <div className="pill">{monthLabel}</div>
      </div>

      <div className="summary-kpi-grid">
        <div className="summary-kpi-card highlight">
          <div className="summary-kpi-label">Limite previsto (70%)</div>
          <div className="summary-kpi-value">{valorDisponivel.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
          <div className="summary-kpi-sub">
            Investir (30%): {valorInvestir.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            <span> • Real investir: {valorInvestirReal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
          </div>
          <div className="summary-kpi-sub">
            Real limite (70%): {valorDisponivelReal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
        </div>
        <div className="summary-kpi-card">
          <div className="summary-kpi-label">Receita prevista</div>
          <div className="summary-kpi-value">{summary.totalReceita.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
          <div className="summary-kpi-sub">
            Real: {summary.totalReceitaReal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            <span> • Recorrências: {summary.recorrenciaReceita.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
          </div>
        </div>
        <div className="summary-kpi-card">
          <div className="summary-kpi-label">Despesas previstas</div>
          <div className="summary-kpi-value">{summary.totalDespesas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
          <div className="summary-kpi-sub">
            Real: {summary.totalDespesasReal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            <span> • Recorrências: {summary.recorrenciaDespesas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
          </div>
        </div>
        <div className="summary-kpi-card">
          <div className="summary-kpi-label">Saldo previsto</div>
          <div className="summary-kpi-value">{summary.saldo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
          <div className="summary-kpi-sub">
            Real: {summary.saldoReal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
        </div>
        <div className="summary-kpi-card">
          <div className="summary-kpi-label">Dias restantes</div>
          <div className="summary-kpi-value">{summary.diasRestantes}</div>
        </div>
        <div className="summary-kpi-card">
          <div className="summary-kpi-label">Base diária</div>
          <div className={`summary-kpi-value ${summary.orcamentoDiario < 0 ? 'down' : 'up'}`}>
            {summary.orcamentoDiario.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
        </div>
        <div className="summary-kpi-card">
          <div className="summary-kpi-label">Status</div>
          <div className="summary-kpi-value">{summary.status}</div>
        </div>
      </div>

      <div className="summary-section-title">Hoje</div>
      <div className="summary-kpi-grid">
        <div className="summary-kpi-card">
          <div className="summary-kpi-label">Gasto hoje</div>
          <div className="summary-kpi-value">{summary.gastoHoje.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
        </div>
        <div className="summary-kpi-card">
          <div className="summary-kpi-label">Orçamento hoje (carry)</div>
          <div className="summary-kpi-value">{summary.orcamentoHoje.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
        </div>
        <div className="summary-kpi-card">
          <div className="summary-kpi-label">Diferença ontem</div>
          <div className={`summary-kpi-value ${summary.diferencaOntem >= 0 ? 'up' : 'down'}`}>
            {summary.diferencaOntem.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
        </div>
        <div className="summary-kpi-card">
          <div className="summary-kpi-label">Diferença hoje</div>
          <div className={`summary-kpi-value ${summary.diferencaHoje >= 0 ? 'up' : 'down'}`}>
            {summary.diferencaHoje.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
        </div>
        <div className="summary-kpi-card">
          <div className="summary-kpi-label">Status hoje</div>
          <div className={`summary-kpi-value ${summary.statusHoje === 'OK' ? 'up' : 'down'}`}>
            {summary.statusHoje}
          </div>
        </div>
      </div>
    </section>
  )
}
