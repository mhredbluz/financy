import type { DashboardSummary } from '../api/dashboard'

interface BudgetSummaryProps {
  selectedDate: string
  summary: DashboardSummary
}

export default function BudgetSummary({
  selectedDate,
  summary,
}: BudgetSummaryProps) {
  const valorInvestir = summary.reservaInvestimento
  const baseDefinida = summary.baseMensal
  const baseRestante = summary.baseRestante
  const savingsPct = Math.round(summary.savingsRate * 100)
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
          <div className="summary-kpi-label">Base restante do mês</div>
          <div className={`summary-kpi-value ${baseRestante <= 0 ? 'down' : ''}`}>
            {baseRestante.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
          <div className="summary-kpi-sub">
            Reservar ({savingsPct}%): {valorInvestir.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            <span> • Base bruta: {summary.baseMensalBruta.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
          </div>
          <div className="summary-kpi-sub">
            Base definida: {baseDefinida.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
        </div>
        <div className="summary-kpi-card">
          <div className="summary-kpi-label">Receita prevista</div>
          <div className="summary-kpi-value">{summary.receitaPrevista.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
          <div className="summary-kpi-sub">
            Real: {summary.receitaReal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
        </div>
        <div className="summary-kpi-card">
          <div className="summary-kpi-label">Despesas previstas</div>
          <div className="summary-kpi-value">{summary.despesaPrevista.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
          <div className="summary-kpi-sub">
            Real: {summary.despesaReal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
        </div>
        <div className="summary-kpi-card">
          <div className="summary-kpi-label">Saldo previsto</div>
          <div className="summary-kpi-value">{summary.saldoPrevisto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
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
          <div className={`summary-kpi-value ${summary.orcamentoDiario <= 0 ? 'down' : 'up'}`}>
            {summary.orcamentoDiario.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
        </div>
        <div className="summary-kpi-card">
          <div className="summary-kpi-label">Status</div>
          <div className="summary-kpi-value">{summary.statusMes}</div>
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
          <div className={`summary-kpi-value ${summary.statusDia === 'DENTRO' ? 'up' : 'down'}`}>
            {summary.statusDia}
          </div>
        </div>
      </div>
    </section>
  )
}
