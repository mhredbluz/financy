import type { Goal, Transaction } from '../types'

interface GoalProgressProps {
  goals: Goal[]
  transactions: Transaction[]
  selectedMonth: string
  formatCurrency: (value: number) => string
}

export default function GoalProgress({ goals, transactions, selectedMonth, formatCurrency }: GoalProgressProps) {
  const currentMonthGoals = goals.filter(goal => goal.month === selectedMonth)

  const calculateGoalProgress = (goal: Goal) => {
    const monthTransactions = transactions.filter(tx => tx.date.startsWith(selectedMonth))

    switch (goal.type) {
      case 'savings': {
        // Meta de economia: usa apenas alocação explícita
        const allocated = goal.allocatedAmount || 0
        const currentSavings = Math.min(allocated, goal.targetAmount)
        const progress = (currentSavings / goal.targetAmount) * 100
        const remaining = Math.max(goal.targetAmount - currentSavings, 0)

        return {
          current: allocated,
          progress: Math.min(progress, 100),
          remaining,
          status: allocated >= goal.targetAmount ? 'completed' : allocated >= goal.targetAmount * 0.8 ? 'near' : 'active',
          requiresAllocation: true
        }
      }

      case 'category_limit': {
        // Meta de limite por categoria: não gastar mais que o limite
        if (!goal.category) return { current: 0, progress: 0, remaining: goal.targetAmount, status: 'active', requiresAllocation: false }

        const categoryExpenses = monthTransactions
          .filter(tx => tx.type === 'expense' && tx.category === goal.category)
          .reduce((sum, tx) => sum + tx.amount, 0)

        const progress = (categoryExpenses / goal.targetAmount) * 100
        const remaining = Math.max(goal.targetAmount - categoryExpenses, 0)

        return {
          current: categoryExpenses,
          progress: Math.min(progress, 100),
          remaining,
          status: categoryExpenses > goal.targetAmount ? 'exceeded' : categoryExpenses >= goal.targetAmount * 0.9 ? 'warning' : 'active',
          requiresAllocation: false
        }
      }

      case 'monthly_target': {
        // Meta mensal: requer alocação explícita para ser mais significativa
        const allocated = goal.allocatedAmount || 0
        const progress = (allocated / goal.targetAmount) * 100
        const remaining = Math.max(goal.targetAmount - allocated, 0)

        return {
          current: allocated,
          progress: Math.min(progress, 100),
          remaining,
          status: allocated >= goal.targetAmount ? 'completed' : allocated >= goal.targetAmount * 0.8 ? 'near' : 'active',
          requiresAllocation: true
        }
      }

      default:
        return { current: 0, progress: 0, remaining: goal.targetAmount, status: 'active', requiresAllocation: false }
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

              {/* Allocation Warning */}
              {progress.requiresAllocation && progress.current === 0 && (
                <div style={{
                  background: 'rgba(241, 158, 11, 0.15)',
                  border: '1px solid var(--warning)',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  marginBottom: '0.5rem',
                  fontSize: '0.85rem',
                  color: 'var(--warning)'
                }}>
                  <strong>⚠️ Requer alocação</strong>
                  <p style={{ margin: '0.25rem 0 0' }}>
                    Esta meta só progride quando você expl­icitamente aloca dinheiro a ela. 
                  </p>
                </div>
              )}

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
          background: 'var(--surface)',
          borderRadius: '12px',
          padding: '2rem',
          textAlign: 'center',
          border: '2px dashed var(--border)',
          marginTop: '1rem'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🎯</div>
          <p style={{ 
            margin: '0.5rem 0', 
            color: 'var(--text-strong)',
            fontSize: '1.1rem',
            fontWeight: 'bold'
          }}>
            Nenhuma meta definida para este mês
          </p>
          <p style={{ 
            fontSize: '0.9rem',
            color: 'var(--text-medium)',
            margin: '0.5rem 0 1rem'
          }}>
            Crie metas de economia, limites por categoria ou objetivos mensais!
          </p>
          <p style={{
            fontSize: '0.85rem',
            color: 'var(--text-weak)',
            fontStyle: 'italic'
          }}>
            Acesse "Configurações" → "Gerenciar Metas" para começar
          </p>
        </div>
      )}
    </section>
  )
}