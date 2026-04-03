import type { DashboardSummary } from '../api/dashboard'

interface BudgetSummaryProps {
  month: string
  monthOptions: string[]
  selectedMonth: string
  onMonthChange: (month: string) => void
  budgetLimit: number
  onBudgetLimitChange: (limit: number) => void
  onSaveBudget: () => void
  summary: DashboardSummary
}

export default function BudgetSummary({
  month,
  monthOptions,
  selectedMonth,
  onMonthChange,
  budgetLimit,
  onBudgetLimitChange,
  onSaveBudget,
  summary,
}: BudgetSummaryProps) {
  return (
    <section className="budget-card">
      <h2>Orçamento do mês ({month})</h2>
      <label>
        Seleção de mês
        <select value={selectedMonth} onChange={(e) => onMonthChange(e.target.value)}>
          {monthOptions.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </label>
      <label>
        Limite mensal
        <input
          type="number"
          value={budgetLimit}
          onChange={(e) => onBudgetLimitChange(Number(e.target.value))}
        />
      </label>
      <button onClick={onSaveBudget}>Salvar orçamento</button>

      <div className="summary-grid">
        <div>
          <strong>Receita</strong>
          <p>{summary.totalReceita.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
        </div>
        <div>
          <strong>Despesas</strong>
          <p>{summary.totalDespesas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
        </div>
        <div>
          <strong>Saldo</strong>
          <p>{summary.saldo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
        </div>
        <div>
          <strong>Dias restantes</strong>
          <p>{summary.diasRestantes}</p>
        </div>
        <div>
          <strong>Disponível p/ dia</strong>
          <p style={{ color: summary.orcamentoDiario < 0 ? '#c0392b' : '#27ae60' }}>
            {summary.orcamentoDiario.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        </div>
        <div>
          <strong>Status</strong>
          <p>{summary.status}</p>
        </div>
      </div>

      <div className="summary-grid">
        <div>
          <strong>Gasto hoje</strong>
          <p>{summary.gastoHoje.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
        </div>
        <div>
          <strong>Orçamento hoje</strong>
          <p>{summary.orcamentoHoje.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
        </div>
        <div>
          <strong>Diferença hoje</strong>
          <p style={{ color: summary.diferencaHoje > 0 ? '#c0392b' : '#27ae60' }}>
            {summary.diferencaHoje.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        </div>
        <div>
          <strong>Status hoje</strong>
          <p style={{ color: summary.statusHoje === 'OK' ? '#27ae60' : '#c0392b' }}>
            {summary.statusHoje}
          </p>
        </div>
      </div>
    </section>
  )
}
