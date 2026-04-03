import type { Transaction } from '../types'

interface GamificationPanelProps {
  transactions: Transaction[]
  selectedMonth: string
  budgetLimit: number
}

const dayKey = (date: Date) => date.toISOString().slice(0, 10)

export default function GamificationPanel({ transactions, selectedMonth, budgetLimit }: GamificationPanelProps) {
  const allTransactions = transactions

  const totalTransactions = allTransactions.length

  const daysWithTx = Array.from(new Set(allTransactions.map((tx) => tx.date))).sort()

  const today = new Date()
  const todayKey = dayKey(today)

  const daySet = new Set(daysWithTx)

  let streak = 0
  let pointer = new Date(today)

  // Começa do dia atual se houver gasto; caso não, começa do dia anterior
  if (!daySet.has(todayKey)) {
    pointer.setDate(pointer.getDate() - 1)
  }

  while (daySet.has(dayKey(pointer))) {
    streak += 1
    pointer.setDate(pointer.getDate() - 1)
  }

  const monthsWithActivitySet = new Set(allTransactions.map((tx) => tx.date.slice(0, 7)))
  const monthsWithActivity = monthsWithActivitySet.size

  const expensesByMonth: Record<string, number> = {}
  const expensesByDay: Record<string, number> = {}

  allTransactions.forEach((tx) => {
    if (tx.type !== 'expense') return
    const m = tx.date.slice(0, 7)
    expensesByMonth[m] = (expensesByMonth[m] || 0) + tx.amount
    expensesByDay[tx.date] = (expensesByDay[tx.date] || 0) + tx.amount
  })

  const currentMonthExpense = expensesByMonth[selectedMonth] || 0
  const daysInMonth = new Date(Number(selectedMonth.slice(0, 4)), Number(selectedMonth.slice(5, 7)), 0).getDate()
  const dailyBudget = daysInMonth ? budgetLimit / daysInMonth : 0

  const monthlyChallengeBudget = budgetLimit * 0.8
  const monthlyChallengeProgress = monthlyChallengeBudget > 0 ? Math.min(100, (1 - currentMonthExpense / monthlyChallengeBudget) * 100) : 0
  const monthlyChallengeStatus = currentMonthExpense <= monthlyChallengeBudget ? 'Concluído' : 'Em risco'

  const consistencyPoints = daysWithTx.reduce((points, day) => {
    const expense = expensesByDay[day] || 0
    if (dailyBudget > 0 && expense <= dailyBudget * 0.8) {
      return points + 10
    }
    return points
  }, 0)

  const monthBudgetPoints = currentMonthExpense <= monthlyChallengeBudget ? 100 : 0
  const totalPoints = consistencyPoints + monthBudgetPoints + Math.min(200, monthsWithActivity * 10)

  const badges = [] as string[]
  if (totalTransactions >= 100) badges.push('🏅 100 transações')
  if (monthsWithActivity >= 6) badges.push('🥇 6 meses de controle')
  if (streak >= 7) badges.push('🔥 Streak de 7 dias')
  if (streak >= 30) badges.push('💎 Streak de 30 dias')
  if (currentMonthExpense <= monthlyChallengeBudget) badges.push('📉 Orçamento 80% ou menos')

  return (
    <section className="budget-card" style={{ marginTop: '1rem' }}>
      <h2>Gamificação & Hábitos</h2>

      <div className="summary-grid">
        <div>
          <strong>Streak</strong>
          <p>{streak} dias</p>
          <small>Registros consecutivos</small>
        </div>
        <div>
          <strong>Transações</strong>
          <p>{totalTransactions}</p>
          <small>Total acumulado</small>
        </div>
        <div>
          <strong>Meses ativos</strong>
          <p>{monthsWithActivity}</p>
          <small>com transações</small>
        </div>
        <div>
          <strong>Pontos</strong>
          <p>{totalPoints}</p>
          <small>Consistência e orçamento</small>
        </div>
      </div>

      <div style={{ marginTop: '1rem', background: 'rgba(30, 41, 59, 0.45)', borderRadius: '10px', padding: '0.9rem' }}>
        <strong>Desafio Mensal</strong>
        <p>{selectedMonth} - Mantenha gastos abaixo de 80% do orçamento</p>
        <p>Progresso: {monthlyChallengeProgress.toFixed(1)}% ({monthlyChallengeStatus})</p>
        <div style={{ marginTop: '0.5rem', width: '100%', height: '8px', background: 'var(--border)', borderRadius: '6px' }}>
          <div style={{ width: `${Math.min(100, Math.max(0, monthlyChallengeProgress))}%`, height: '100%', background: 'var(--success)', borderRadius: '6px' }} />
        </div>
      </div>

      <div style={{ marginTop: '1rem' }}>
        <strong>Badges desbloqueadas</strong>
        {badges.length === 0 ? (
          <p style={{ color: 'var(--text-weak)' }}>Nehuma ainda. Continue registrando!</p>
        ) : (
          <ul style={{ paddingLeft: '1rem' }}>
            {badges.map((badge) => (<li key={badge}>{badge}</li>))}
          </ul>
        )}
      </div>

      <div style={{ marginTop: '1rem', color: 'var(--text-medium)' }}>
        Dica: Registre transações diariamente e mantenha o limite mensal abaixo de 80% para ganhar pontos extras.
      </div>
    </section>
  )
}
