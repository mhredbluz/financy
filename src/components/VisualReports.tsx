import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { Transaction } from '../types'

interface VisualReportsProps {
  transactions: Transaction[]
  selectedMonth: string
  formatCurrency: (value: number) => string
}

export default function VisualReports({ transactions, selectedMonth, formatCurrency }: VisualReportsProps) {
  // Dados para gráfico de pizza (distribuição de gastos por categoria)
  const categoryData = transactions
    .filter(tx => tx.type === 'expense' && tx.date.startsWith(selectedMonth))
    .reduce((acc, tx) => {
      const existing = acc.find(item => item.category === tx.category)
      if (existing) {
        existing.value += tx.amount
      } else {
        acc.push({ category: tx.category, value: tx.amount })
      }
      return acc
    }, [] as { category: string; value: number }[])
    .sort((a, b) => b.value - a.value)

  // Cores para o gráfico de pizza
  const COLORS = ['#3B82F6', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316']

  // Dados para gráfico de linha (evolução mensal)
  const monthlyData = transactions.reduce((acc, tx) => {
    const month = tx.date.slice(0, 7) // YYYY-MM
    const existing = acc.find(item => item.month === month)
    if (existing) {
      if (tx.type === 'income') {
        existing.income += tx.amount
      } else {
        existing.expense += tx.amount
      }
    } else {
      acc.push({
        month,
        income: tx.type === 'income' ? tx.amount : 0,
        expense: tx.type === 'expense' ? tx.amount : 0,
        balance: tx.type === 'income' ? tx.amount : -tx.amount
      })
    }
    return acc
  }, [] as { month: string; income: number; expense: number; balance: number }[])
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-6) // Últimos 6 meses

  // Métricas rápidas
  const currentMonthTxs = transactions.filter(tx => tx.date.startsWith(selectedMonth))
  const expenses = currentMonthTxs.filter(tx => tx.type === 'expense')
  const incomes = currentMonthTxs.filter(tx => tx.type === 'income')

  const topExpense = expenses.reduce((max, tx) => tx.amount > max.amount ? tx : max, expenses[0] || { amount: 0 })
  const topCategory = expenses.reduce((acc, tx) => {
    acc[tx.category] = (acc[tx.category] || 0) + tx.amount
    return acc
  }, {} as Record<string, number>)

  const mostUsedCategory = Object.entries(topCategory).reduce((max, [cat, amount]) =>
    amount > (topCategory[max[0]] || 0) ? [cat, amount] : max, ['', 0]
  )

  // Comparativo com mês anterior
  const prevMonth = new Date(selectedMonth + '-01')
  prevMonth.setMonth(prevMonth.getMonth() - 1)
  const prevMonthStr = prevMonth.toISOString().slice(0, 7)

  const prevMonthTxs = transactions.filter(tx => tx.date.startsWith(prevMonthStr))
  const prevExpenses = prevMonthTxs.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0)
  const currentExpenses = expenses.reduce((sum, tx) => sum + tx.amount, 0)

  const expenseChange = prevExpenses > 0 ? ((currentExpenses - prevExpenses) / prevExpenses) * 100 : 0

  return (
    <section className="budget-card">
      <h2>Relatórios Visuais</h2>

      {/* Métricas Rápidas */}
      <div className="summary-grid">
        <div>
          <strong>Maior Gasto</strong>
          <p>{formatCurrency(topExpense?.amount || 0)}</p>
          <small>{topExpense?.note || topExpense?.category || 'Nenhum'}</small>
        </div>
        <div>
          <strong>Categoria Mais Usada</strong>
          <p>{mostUsedCategory[0] || 'Nenhuma'}</p>
          <small>{formatCurrency(mostUsedCategory[1] || 0)}</small>
        </div>
        <div>
          <strong>vs Mês Anterior</strong>
          <p style={{ color: expenseChange > 0 ? 'var(--danger)' : 'var(--success)' }}>
            {expenseChange > 0 ? '+' : ''}{expenseChange.toFixed(1)}%
          </p>
          <small>{formatCurrency(currentExpenses)} vs {formatCurrency(prevExpenses)}</small>
        </div>
        <div>
          <strong>Receitas do Mês</strong>
          <p>{formatCurrency(incomes.reduce((sum, tx) => sum + tx.amount, 0))}</p>
          <small>{incomes.length} transações</small>
        </div>
      </div>

      {/* Gráficos */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
        {/* Gráfico de Pizza */}
        <div style={{ background: 'var(--surface)', padding: '1rem', borderRadius: '12px' }}>
          <h3>Distribuição de Gastos</h3>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="category"
                >
                  {categoryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ textAlign: 'center', color: 'var(--text-weak)' }}>Nenhum gasto registrado</p>
          )}
        </div>

        {/* Gráfico de Linha */}
        <div style={{ background: 'var(--surface)', padding: '1rem', borderRadius: '12px' }}>
          <h3>Evolução Mensal</h3>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="month"
                  stroke="var(--text-medium)"
                  tickFormatter={(value) => new Date(value + '-01').toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })}
                />
                <YAxis stroke="var(--text-medium)" tickFormatter={(value) => formatCurrency(value)} />
                <Tooltip
                  labelFormatter={(value) => new Date(value + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                />
                <Legend />
                <Line type="monotone" dataKey="income" stroke="#22C55E" strokeWidth={2} name="Receitas" />
                <Line type="monotone" dataKey="expense" stroke="#EF4444" strokeWidth={2} name="Despesas" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ textAlign: 'center', color: 'var(--text-weak)' }}>Dados insuficientes</p>
          )}
        </div>
      </div>
    </section>
  )
}