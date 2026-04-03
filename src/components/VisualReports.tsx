import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { Transaction } from '../types'

interface VisualReportsProps {
  transactions: Transaction[]
  selectedMonth: string
  formatCurrency: (value: number) => string
}

const parseMonth = (month: string) => new Date(`${month}-01`)

const monthId = (date: Date) => `${date.getFullYear().toString().padStart(4, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}`

const addMonths = (month: string, offset: number) => {
  const date = parseMonth(month)
  date.setMonth(date.getMonth() + offset)
  return monthId(date)
}

export default function VisualReports({ transactions, selectedMonth, formatCurrency }: VisualReportsProps) {
  const monthlyMap: Record<string, { income: number; expense: number; balance: number }> = {}

  transactions.forEach((tx) => {
    const month = tx.date.slice(0, 7)
    if (!monthlyMap[month]) monthlyMap[month] = { income: 0, expense: 0, balance: 0 }
    if (tx.type === 'income') {
      monthlyMap[month].income += tx.amount
      monthlyMap[month].balance += tx.amount
    } else {
      monthlyMap[month].expense += tx.amount
      monthlyMap[month].balance -= tx.amount
    }
  })

  const sortedMonths = Object.keys(monthlyMap).sort()

  const monthlyData = sortedMonths.map((m) => ({
    month: m,
    income: monthlyMap[m].income,
    expense: monthlyMap[m].expense,
    balance: monthlyMap[m].balance,
  }))

  const last12Months = sortedMonths.slice(-12)

  const selectedData = monthlyMap[selectedMonth] || { income: 0, expense: 0, balance: 0 }

  const sameMonthLastYear = addMonths(selectedMonth, -12)
  const sameLastYearData = monthlyMap[sameMonthLastYear] || { income: 0, expense: 0, balance: 0 }

  const expenseSeasonChange = sameLastYearData.expense > 0
    ? ((selectedData.expense - sameLastYearData.expense) / sameLastYearData.expense) * 100
    : selectedData.expense > 0 ? 100 : 0

  // Projeção simples: média dos últimos 6 meses
  const last6 = sortedMonths.slice(-6)
  const historical = last6.map((m) => monthlyMap[m])

  const averageIncome = historical.reduce((sum, curr) => sum + curr.income, 0) / Math.max(1, historical.length)
  const averageExpense = historical.reduce((sum, curr) => sum + curr.expense, 0) / Math.max(1, historical.length)
  const averageBalanceChange = averageIncome - averageExpense

  const forecastMonths = [1, 2, 3].map((offset) => {
    const month = addMonths(selectedMonth, offset)
    return {
      month,
      income: averageIncome,
      expense: averageExpense,
      balance: selectedData.balance + averageBalanceChange * offset,
    }
  })

  const forecastData = [...monthlyData.slice(-6), ...forecastMonths]

  // Alertas de tendência por categoria
  const categoryMonth: Record<string, Record<string, number>> = {}
  transactions
    .filter((tx) => tx.type === 'expense')
    .forEach((tx) => {
      const month = tx.date.slice(0, 7)
      if (!categoryMonth[tx.category]) categoryMonth[tx.category] = {}
      categoryMonth[tx.category][month] = (categoryMonth[tx.category][month] || 0) + tx.amount
    })

  const trendMessages: string[] = []
  const trendMonthsRecent = [addMonths(selectedMonth, -2), addMonths(selectedMonth, -1), selectedMonth]
  const trendMonthsPrevious = [addMonths(selectedMonth, -5), addMonths(selectedMonth, -4), addMonths(selectedMonth, -3)]

  Object.entries(categoryMonth).forEach(([category, monthValues]) => {
    const recent = trendMonthsRecent.reduce((sum, m) => sum + (monthValues[m] || 0), 0)
    const previous = trendMonthsPrevious.reduce((sum, m) => sum + (monthValues[m] || 0), 0)

    if (previous > 0) {
      const diff = ((recent - previous) / previous) * 100
      if (diff >= 20) {
        trendMessages.push(`📈 Seus gastos com ${category} aumentaram ${diff.toFixed(0)}% nos últimos 3 meses.`)
      } else if (diff <= -20) {
        trendMessages.push(`📉 Seus gastos com ${category} diminuíram ${Math.abs(diff).toFixed(0)}% nos últimos 3 meses.`)
      }
    }
  })

  const categoryData = transactions
    .filter((tx) => tx.type === 'expense' && tx.date.startsWith(selectedMonth))
    .reduce((acc, tx) => {
      const existing = acc.find((item) => item.category === tx.category)
      if (existing) {
        existing.value += tx.amount
      } else {
        acc.push({ category: tx.category, value: tx.amount })
      }
      return acc
    }, [] as { category: string; value: number }[])
    .sort((a, b) => b.value - a.value)

  const COLORS = ['#3B82F6', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316']

  const currentMonthTxs = transactions.filter((tx) => tx.date.startsWith(selectedMonth))
  const expenses = currentMonthTxs.filter((tx) => tx.type === 'expense')
  const incomes = currentMonthTxs.filter((tx) => tx.type === 'income')

  const topExpense = expenses.reduce((max, tx) => (tx.amount > max.amount ? tx : max), expenses[0] || { amount: 0 })
  const topCategory = expenses.reduce((acc, tx) => {
    acc[tx.category] = (acc[tx.category] || 0) + tx.amount
    return acc
  }, {} as Record<string, number>)

  const mostUsedCategory = Object.entries(topCategory).reduce((max, [cat, amount]) =>
    amount > (topCategory[max[0]] || 0) ? [cat, amount] : max,
  ['', 0])

  const prevMonthDate = parseMonth(`${selectedMonth}-01`)
  prevMonthDate.setMonth(prevMonthDate.getMonth() - 1)
  const prevMonthStr = monthId(prevMonthDate)

  const prevMonthTxs = transactions.filter((tx) => tx.date.startsWith(prevMonthStr))
  const prevExpenses = prevMonthTxs.filter((tx) => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0)
  const currentExpenses = expenses.reduce((sum, tx) => sum + tx.amount, 0)
  const expenseChange = prevExpenses > 0 ? ((currentExpenses - prevExpenses) / prevExpenses) * 100 : 0

  return (
    <section className="budget-card">
      <h2>Relatórios Visuais</h2>

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

      <div style={{ marginTop: '1rem', marginBottom: '1rem', display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <div style={{ background: 'var(--surface)', borderRadius: '12px', padding: '1rem' }}>
          <strong>Comparativo Sazonal</strong>
          <p style={{ margin: '0.4rem 0' }}>{new Date(`${selectedMonth}-01`).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })} vs {new Date(`${sameMonthLastYear}-01`).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</p>
          <p>Despesa atual: {formatCurrency(selectedData.expense)}</p>
          <p>Despesa ano anterior: {formatCurrency(sameLastYearData.expense)}</p>
          <p style={{ color: expenseSeasonChange > 0 ? 'var(--danger)' : 'var(--success)' }}>Variação: {expenseSeasonChange.toFixed(1)}%</p>
        </div>
        <div style={{ background: 'var(--surface)', borderRadius: '12px', padding: '1rem' }}>
          <strong>Previsão de Saldo</strong>
          <p>Variação média mensal: {formatCurrency(averageBalanceChange)}</p>
          <p>Saldo mês atual: {formatCurrency(selectedData.balance)}</p>
          <p>Saldo em 3 meses: {formatCurrency(selectedData.balance + averageBalanceChange * 3)}</p>
        </div>
      </div>

      {trendMessages.length > 0 && (
        <div style={{ marginBottom: '1rem', background: 'rgba(30, 41, 59, 0.45)', borderRadius: '12px', padding: '1rem' }}>
          <strong>Alertas de Tendência</strong>
          <ul style={{ marginTop: '0.5rem', paddingLeft: '1rem' }}>
            {trendMessages.slice(0, 5).map((message, index) => (
              <li key={index}>{message}</li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
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

        <div style={{ background: 'var(--surface)', padding: '1rem', borderRadius: '12px' }}>
          <h3>Evolução + Projeção</h3>
          {forecastData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={forecastData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" stroke="var(--text-medium)" tickFormatter={(value) => new Date(value + '-01').toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })} />
                <YAxis stroke="var(--text-medium)" tickFormatter={(value) => formatCurrency(value)} />
                <Tooltip labelFormatter={(value) => new Date(value + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })} />
                <Legend />
                <Line type="monotone" dataKey="income" stroke="#22C55E" strokeWidth={2} name="Receitas" />
                <Line type="monotone" dataKey="expense" stroke="#EF4444" strokeWidth={2} name="Despesas" />
                <Line type="monotone" dataKey="balance" stroke="#3B82F6" strokeWidth={2} name="Saldo" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ textAlign: 'center', color: 'var(--text-weak)' }}>Dados insuficientes para projeção</p>
          )}
        </div>
      </div>
    </section>
  )
}
