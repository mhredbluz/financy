import type { DashboardSummary } from '../api/dashboard'

interface BudgetSummaryProps {
  month: string
  monthOptions: string[]
  selectedMonth: string
  onMonthChange: (month: string) => void
  onSaveBudget: () => void
  summary: DashboardSummary
}

export default function BudgetSummary({
  month,
  monthOptions,
  selectedMonth,
  onMonthChange,
  onSaveBudget,
  summary,
}: BudgetSummaryProps) {
  const saldoBase = summary.saldo
  const valorInvestir = saldoBase * 0.3
  const valorDisponivel = saldoBase * 0.7

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
        Limite mensal real (70% do saldo)
        <p>{valorDisponivel.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
        <input
          type="number"
          value={Number.isFinite(valorDisponivel) ? valorDisponivel : 0}
          disabled
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
          <strong>Investir (30%)</strong>
          <p>{valorInvestir.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
        </div>
        <div>
          <strong>Dias restantes</strong>
          <p>{summary.diasRestantes}</p>
        </div>
        <div>
          <strong>Disponível p/ dia (base)</strong>
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
          <strong>Orçamento hoje (carry)</strong>
          <p>{summary.orcamentoHoje.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
        </div>
        <div>
          <strong>Diferença ontem</strong>
          <p style={{ color: summary.diferencaOntem >= 0 ? '#27ae60' : '#c0392b' }}>
            {summary.diferencaOntem.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        </div>
        <div>
          <strong>Diferença hoje</strong>
          <p style={{ color: summary.diferencaHoje >= 0 ? '#27ae60' : '#c0392b' }}>
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
