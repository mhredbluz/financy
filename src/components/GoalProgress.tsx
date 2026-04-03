import type { Goal, Transaction } from '../types'

interface GoalProgressProps {
  goals: Goal[]
  transactions: Transaction[]
  selectedMonth: string
  formatCurrency: (value: number) => string
}

export default function GoalProgress({ goals, transactions, selectedMonth, formatCurrency }: GoalProgressProps) {
  const currentMonthGoals = goals.filter(goal => goal.month === selectedMonth)

  if (currentMonthGoals.length === 0) {
    return null
  }

  const calculateGoalProgress = (goal: Goal) => {
    const monthTransactions = transactions.filter(tx => tx.date.startsWith(selectedMonth))

    switch (goal.type) {
      case 'savings': {
        // Meta de economia: diferença entre receitas e despesas
        const totalIncome = monthTransactions
          .filter(tx => tx.type === 'income')
          .reduce((sum, tx) => sum + tx.amount, 0)

        const totalExpenses = monthTransactions
          .filter(tx => tx.type === 'expense')
          .reduce((sum, tx) => sum + tx.amount, 0)

        const currentSavings = totalIncome - totalExpenses
        const progress = Math.min((currentSavings / goal.targetAmount) * 100, 100)
        const remaining = Math.max(goal.targetAmount - currentSavings, 0)

        return {
          current: currentSavings,
          progress: Math.max(0, progress),
          remaining,
          status: currentSavings >= goal.targetAmount ? 'completed' : currentSavings >= goal.targetAmount * 0.8 ? 'near' : 'active'
        }
      }

      case 'category_limit': {
        // Meta de limite por categoria: não gastar mais que o limite
        if (!goal.category) return { current: 0, progress: 0, remaining: goal.targetAmount, status: 'active' }

        const categoryExpenses = monthTransactions
          .filter(tx => tx.type === 'expense' && tx.category === goal.category)
          .reduce((sum, tx) => sum + tx.amount, 0)

        const progress = (categoryExpenses / goal.targetAmount) * 100
        const remaining = Math.max(goal.targetAmount - categoryExpenses, 0)

        return {
          current: categoryExpenses,
          progress: Math.min(progress, 100),
          remaining,
          status: categoryExpenses > goal.targetAmount ? 'exceeded' : categoryExpenses >= goal.targetAmount * 0.9 ? 'warning' : 'active'
        }
      }

      case 'monthly_target': {
        // Meta mensal: atingir um valor específico (pode ser receita ou despesa)
        const relevantTransactions = monthTransactions.filter(tx =>
          goal.category ? tx.category === goal.category : true
        )

        const totalAmount = relevantTransactions.reduce((sum, tx) => {
          if (goal.title.toLowerCase().includes('receita') || goal.title.toLowerCase().includes('ganho')) {
            return tx.type === 'income' ? sum + tx.amount : sum
          } else {
            return tx.type === 'expense' ? sum + tx.amount : sum
          }
        }, 0)

        const progress = Math.min((totalAmount / goal.targetAmount) * 100, 100)
        const remaining = Math.max(goal.targetAmount - totalAmount, 0)

        return {
          current: totalAmount,
          progress: Math.max(0, progress),
          remaining,
          status: totalAmount >= goal.targetAmount ? 'completed' : totalAmount >= goal.targetAmount * 0.8 ? 'near' : 'active'
        }
      }

      default:
        return { current: 0, progress: 0, remaining: goal.targetAmount, status: 'active' }
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'var(--success)'
      case 'near': return 'var(--warning)'
      case 'warning': return 'var(--warning)'
      case 'exceeded': return 'var(--danger)'
      default: return 'var(--primary)'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅'
      case 'near': return '🚀'
      case 'warning': return '⚠️'
      case 'exceeded': return '🚨'
      default: return '🎯'
    }
  }

  const getGoalTypeIcon = (type: string) => {
    switch (type) {
      case 'savings': return '💰'
      case 'category_limit': return '📊'
      case 'monthly_target': return '🎯'
      default: return '🎯'
    }
  }

  return (
    <section className="budget-card">
      <h2>🎯 Progresso das Metas</h2>

      <div style={{ display: 'grid', gap: '1rem' }}>
        {currentMonthGoals.map((goal) => {
          const progress = calculateGoalProgress(goal)

          return (
            <div
              key={goal.id}
              style={{
                background: 'var(--surface)',
                borderRadius: '12px',
                padding: '1rem',
                border: `2px solid ${getStatusColor(progress.status)}`
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <div>
                  <h4 style={{
                    margin: '0 0 0.25rem 0',
                    color: 'var(--text-strong)',
                    fontSize: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    {getGoalTypeIcon(goal.type)} {goal.title}
                  </h4>
                  {goal.description && (
                    <p style={{
                      margin: '0 0 0.5rem 0',
                      color: 'var(--text-medium)',
                      fontSize: '0.85rem'
                    }}>
                      {goal.description}
                    </p>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    color: getStatusColor(progress.status)
                  }}>
                    {getStatusIcon(progress.status)}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div style={{ marginBottom: '0.5rem' }}>
                <div style={{
                  width: '100%',
                  height: '8px',
                  background: 'rgba(51, 65, 85, 0.3)',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${Math.max(0, progress.progress)}%`,
                    height: '100%',
                    background: getStatusColor(progress.status),
                    borderRadius: '4px',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>

              {/* Status Details */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '0.5rem',
                fontSize: '0.85rem'
              }}>
                <div>
                  <strong style={{ color: 'var(--text-medium)' }}>Atual:</strong>
                  <div style={{ color: 'var(--text-strong)', fontWeight: 'bold' }}>
                    {formatCurrency(progress.current)}
                  </div>
                </div>
                <div>
                  <strong style={{ color: 'var(--text-medium)' }}>Meta:</strong>
                  <div style={{ color: 'var(--text-strong)' }}>
                    {formatCurrency(goal.targetAmount)}
                  </div>
                </div>
                <div>
                  <strong style={{ color: 'var(--text-medium)' }}>Falta:</strong>
                  <div style={{
                    color: progress.remaining > 0 ? 'var(--text-strong)' : 'var(--success)',
                    fontWeight: 'bold'
                  }}>
                    {progress.remaining > 0 ? formatCurrency(progress.remaining) : 'Concluída! 🎉'}
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              {goal.category && (
                <div style={{
                  marginTop: '0.5rem',
                  fontSize: '0.8rem',
                  color: 'var(--text-weak)'
                }}>
                  📂 Categoria: {goal.category}
                </div>
              )}

              {goal.deadline && (
                <div style={{
                  marginTop: '0.25rem',
                  fontSize: '0.8rem',
                  color: 'var(--text-weak)'
                }}>
                  ⏰ Prazo: {new Date(goal.deadline).toLocaleDateString('pt-BR')}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {currentMonthGoals.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '2rem',
          color: 'var(--text-weak)'
        }}>
          <p>🎯 Nenhuma meta definida para este mês.</p>
          <p style={{ fontSize: '0.9rem' }}>Clique em "Gerenciar Metas" para criar seus objetivos!</p>
        </div>
      )}
    </section>
  )
}