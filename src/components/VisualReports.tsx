import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { useAppContext } from '../context/AppContext'

interface VisualReportsProps {
  formatCurrency: (value: number) => string
}

const parseMonth = (month: string) => new Date(`${month}-01`)

const monthId = (date: Date) => `${date.getFullYear().toString().padStart(4, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}`

const addMonths = (month: string, offset: number) => {
  const date = parseMonth(month)
  date.setMonth(date.getMonth() + offset)
  return monthId(date)
}

export default function VisualReports({ formatCurrency }: VisualReportsProps) {
  const { transactions, selectedMonth } = useAppContext()
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

  const selectedData = monthlyMap[selectedMonth] || { income: 0, expense: 0, balance: 0 }

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

  const prevMonthDate = parseMonth(`${selectedMonth}-01`)
  prevMonthDate.setMonth(prevMonthDate.getMonth() - 1)
  const prevMonthStr = monthId(prevMonthDate)

  const prevMonthTxs = transactions.filter((tx) => tx.date.startsWith(prevMonthStr))
  const prevExpenses = prevMonthTxs.filter((tx) => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0)
  const currentExpenses = expenses.reduce((sum, tx) => sum + tx.amount, 0)
  const expenseChange = prevExpenses > 0 ? ((currentExpenses - prevExpenses) / prevExpenses) * 100 : 0

  const compactCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 }).format(value)

  const topCategoryItem = categoryData[0]
  const topCategoryShare = topCategoryItem && currentExpenses > 0
    ? (topCategoryItem.value / currentExpenses) * 100
    : 0

  return (
    <section className="budget-card">
      <div className="reports-header">
        <div>
          <h2>Relatórios Visuais</h2>
          <p className="reports-sub">Mais gráficos, menos texto. Foco no que muda seu mês.</p>
        </div>
        <div className="pill">
          {new Date(`${selectedMonth}-01`).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Gastos do mês</div>
          <div className="kpi-value">{formatCurrency(currentExpenses)}</div>
          <div className={`kpi-sub ${expenseChange > 0 ? 'down' : 'up'}`}>
            {expenseChange > 0 ? '+' : ''}{expenseChange.toFixed(1)}% vs mês anterior
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Receitas do mês</div>
          <div className="kpi-value">{formatCurrency(incomes.reduce((sum, tx) => sum + tx.amount, 0))}</div>
          <div className="kpi-sub">{incomes.length} transações</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Saldo do mês</div>
          <div className="kpi-value">{formatCurrency(selectedData.balance)}</div>
          <div className="kpi-sub">Média mensal: {formatCurrency(averageBalanceChange)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Top categoria</div>
          <div className="kpi-value">{topCategoryItem?.category || '—'}</div>
          <div className="kpi-sub">{topCategoryShare.toFixed(0)}% dos gastos</div>
        </div>
      </div>

      <div className="chart-grid">
        <div className="chart-card">
          <div className="chart-title">Gastos por categoria</div>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={categoryData.slice(0, 6)} layout="vertical" margin={{ left: 16, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" stroke="var(--text-medium)" tickFormatter={compactCurrency} />
                <YAxis type="category" dataKey="category" stroke="var(--text-medium)" width={90} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Bar dataKey="value" fill="var(--primary)" radius={[6, 6, 6, 6]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ textAlign: 'center', color: 'var(--text-weak)' }}>Nenhum gasto registrado</p>
          )}
        </div>

        <div className="chart-card">
          <div className="chart-title">Composição de gastos</div>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="category"
                >
                  {categoryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ textAlign: 'center', color: 'var(--text-weak)' }}>Nenhum gasto registrado</p>
          )}
        </div>
      </div>

      <div className="chart-grid">
        <div className="chart-card span-2">
          <div className="chart-title">Evolução + Projeção (últimos 6 + 3 meses)</div>
          {forecastData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={forecastData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" stroke="var(--text-medium)" tickFormatter={(value) => new Date(value + '-01').toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })} />
                <YAxis stroke="var(--text-medium)" tickFormatter={compactCurrency} />
                <Tooltip labelFormatter={(value) => new Date(value + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })} formatter={(value: number) => formatCurrency(value)} />
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
