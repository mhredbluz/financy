import type { Transaction } from '../types'

interface BudgetAlertsProps {
  transactions: Transaction[]
  selectedMonth: string
  budgetLimit: number
}

export default function BudgetAlerts({ transactions, selectedMonth, budgetLimit }: BudgetAlertsProps) {
  const currentMonthTxs = transactions.filter(tx => tx.date.startsWith(selectedMonth))
  const expenses = currentMonthTxs.filter(tx => tx.type === 'expense')
  const totalExpenses = expenses.reduce((sum, tx) => sum + tx.amount, 0)

  const expensePercentage = budgetLimit > 0 ? (totalExpenses / budgetLimit) * 100 : 0

  // Alertas baseados na porcentagem do orçamento
  const getBudgetAlert = () => {
    if (expensePercentage >= 100) {
      return {
        type: 'danger' as const,
        icon: '🚨',
        title: 'Orçamento Excedido!',
        message: `Você já gastou R$ ${(totalExpenses - budgetLimit).toFixed(2)} acima do limite mensal.`,
        suggestion: 'Considere reduzir gastos não essenciais ou ajustar seu orçamento.'
      }
    } else if (expensePercentage >= 90) {
      return {
        type: 'warning' as const,
        icon: '⚠️',
        title: 'Cuidado com o Orçamento!',
        message: `Você já usou ${expensePercentage.toFixed(1)}% do seu orçamento mensal.`,
        suggestion: 'Restam apenas R$ ${(budgetLimit - totalExpenses).toFixed(2)} para o mês.'
      }
    } else if (expensePercentage >= 75) {
      return {
        type: 'warning' as const,
        icon: '🔔',
        title: 'Atenção ao Orçamento',
        message: `Você já usou ${expensePercentage.toFixed(1)}% do seu orçamento mensal.`,
        suggestion: 'Mantenha o controle para não exceder o limite.'
      }
    }
    return null
  }

  // Sugestões baseadas em padrões históricos
  const getSmartSuggestions = () => {
    const suggestions = []

    // Análise de gastos por categoria
    const categorySpending = expenses.reduce((acc, tx) => {
      acc[tx.category] = (acc[tx.category] || 0) + tx.amount
      return acc
    }, {} as Record<string, number>)

    const topCategory = Object.entries(categorySpending).reduce((max, [cat, amount]) =>
      amount > (categorySpending[max[0]] || 0) ? [cat, amount] : max, ['', 0]
    )

    if (topCategory[1] > budgetLimit * 0.3) {
      suggestions.push({
        icon: '📊',
        message: `Seus gastos em ${topCategory[0]} representam ${(topCategory[1] / totalExpenses * 100).toFixed(1)}% do total. Considere otimizar esta categoria.`
      })
    }

    // Análise de frequência de gastos
    const today = new Date()
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().slice(0, 7)

    const lastMonthTxs = transactions.filter(tx => tx.date.startsWith(lastMonth) && tx.type === 'expense')
    const lastMonthTotal = lastMonthTxs.reduce((sum, tx) => sum + tx.amount, 0)

    if (lastMonthTotal > 0) {
      const monthlyChange = ((totalExpenses - lastMonthTotal) / lastMonthTotal) * 100
      if (monthlyChange > 20) {
        suggestions.push({
          icon: '📈',
          message: `Seus gastos aumentaram ${monthlyChange.toFixed(1)}% em relação ao mês passado. Mantenha o foco!`
        })
      } else if (monthlyChange < -10) {
        suggestions.push({
          icon: '📉',
          message: `Parabéns! Seus gastos diminuíram ${Math.abs(monthlyChange).toFixed(1)}% em relação ao mês passado.`
        })
      }
    }

    // Sugestão baseada no dia do mês
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
    const currentDay = today.getDate()
    const daysRemaining = daysInMonth - currentDay
    const dailyBudgetRemaining = (budgetLimit - totalExpenses) / daysRemaining

    if (dailyBudgetRemaining > 0 && daysRemaining > 0) {
      suggestions.push({
        icon: '📅',
        message: `Com ${daysRemaining} dias restantes, você pode gastar até R$ ${dailyBudgetRemaining.toFixed(2)} por dia.`
      })
    }

    return suggestions
  }

  const budgetAlert = getBudgetAlert()
  const smartSuggestions = getSmartSuggestions()

  if (!budgetAlert && smartSuggestions.length === 0) {
    return null
  }

  return (
    <div style={{ marginBottom: '1rem' }}>
      {/* Alerta de Orçamento */}
      {budgetAlert && (
        <div
          className={`alert ${budgetAlert.type === 'danger' ? '' : 'ok'}`}
          style={{
            background: budgetAlert.type === 'danger'
              ? 'rgba(239, 68, 68, 0.1)'
              : 'rgba(245, 158, 11, 0.1)',
            border: `1px solid ${budgetAlert.type === 'danger' ? 'var(--danger)' : 'var(--warning)'}`,
            marginBottom: smartSuggestions.length > 0 ? '0.5rem' : '0'
          }}
        >
          <p style={{
            margin: 0,
            fontWeight: 'bold',
            color: budgetAlert.type === 'danger' ? 'var(--danger)' : 'var(--warning)',
            fontSize: '1rem'
          }}>
            {budgetAlert.icon} {budgetAlert.title}
          </p>
          <p style={{
            margin: '0.5rem 0 0.25rem 0',
            color: 'var(--text-medium)',
            fontSize: '0.9rem'
          }}>
            {budgetAlert.message}
          </p>
          <p style={{
            margin: '0.25rem 0 0 0',
            color: 'var(--text-weak)',
            fontSize: '0.85rem',
            fontStyle: 'italic'
          }}>
            💡 {budgetAlert.suggestion}
          </p>
        </div>
      )}

      {/* Sugestões Inteligentes */}
      {smartSuggestions.map((suggestion, index) => (
        <div
          key={index}
          style={{
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '8px',
            padding: '0.75rem',
            marginBottom: index < smartSuggestions.length - 1 ? '0.5rem' : '0'
          }}
        >
          <p style={{
            margin: 0,
            color: 'var(--primary)',
            fontSize: '0.9rem',
            fontWeight: '500'
          }}>
            {suggestion.icon} {suggestion.message}
          </p>
        </div>
      ))}
    </div>
  )
}