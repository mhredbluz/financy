import { useAppContext } from '../context/AppContext'

const dayKey = (date: Date) => date.toISOString().slice(0, 10)

export default function GamificationPanel() {
  const { transactions, selectedMonth, budgetLimit } = useAppContext()
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

  const monthBudgetPoints = currentMonthExpense <= monthlyChallengeBudget ? 150 : 0
  const basePoints = consistencyPoints + monthBudgetPoints + Math.min(200, monthsWithActivity * 10)

  // Leveling
  const level = Math.max(1, Math.floor(basePoints / 200) + 1)
  const levelFloor = (level - 1) * 200
  const levelCeil = level * 200
  const levelProgress = ((basePoints - levelFloor) / (levelCeil - levelFloor)) * 100

  const streakBonus = Math.min(50, streak * 2)
  const totalPoints = basePoints + streakBonus

  // Weekly challenge (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    return dayKey(d)
  })
  const weeklySpend = last7Days.reduce((sum, day) => sum + (expensesByDay[day] || 0), 0)
  const weeklyBudget = dailyBudget * 7
  const weeklyProgress = weeklyBudget > 0 ? Math.min(100, (1 - weeklySpend / weeklyBudget) * 100) : 0
  const weeklyStatus = weeklySpend <= weeklyBudget ? 'Sob controle' : 'Estourado'

  const badges = [] as string[]
  if (totalTransactions >= 50) badges.push('🏁 50 transações')
  if (totalTransactions >= 200) badges.push('🏆 200 transações')
  if (monthsWithActivity >= 3) badges.push('🥉 3 meses de controle')
  if (monthsWithActivity >= 6) badges.push('🥈 6 meses de controle')
  if (monthsWithActivity >= 12) badges.push('🥇 12 meses de controle')
  if (streak >= 7) badges.push('🔥 Streak 7 dias')
  if (streak >= 30) badges.push('💎 Streak 30 dias')
  if (currentMonthExpense <= monthlyChallengeBudget) badges.push('📉 Orçamento 80% ou menos')

  return (
    <section className="budget-card" style={{ marginTop: '1rem' }}>
      <div className="reports-header">
        <div>
          <h2>Gamificação</h2>
          <p className="reports-sub">Ganhos reais vêm da consistência. Veja seu progresso.</p>
        </div>
        <div className="pill">Nível {level}</div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Streak atual</div>
          <div className="kpi-value">{streak} dias</div>
          <div className="kpi-sub">Bônus: +{streakBonus} pts</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Pontos totais</div>
          <div className="kpi-value">{totalPoints}</div>
          <div className="kpi-sub">Base: {basePoints} pts</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Meses ativos</div>
          <div className="kpi-value">{monthsWithActivity}</div>
          <div className="kpi-sub">Consistência histórica</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Transações</div>
          <div className="kpi-value">{totalTransactions}</div>
          <div className="kpi-sub">Total acumulado</div>
        </div>
      </div>

      <div style={{ marginTop: '1rem', background: 'rgba(30, 41, 59, 0.45)', borderRadius: '10px', padding: '0.9rem' }}>
        <strong>Progresso de Nível</strong>
        <p style={{ margin: '0.25rem 0' }}>{basePoints} / {levelCeil} pts</p>
        <div style={{ marginTop: '0.5rem', width: '100%', height: '8px', background: 'var(--border)', borderRadius: '6px' }}>
          <div style={{ width: `${Math.min(100, Math.max(0, levelProgress))}%`, height: '100%', background: 'var(--primary)', borderRadius: '6px' }} />
        </div>
      </div>

      <div style={{ marginTop: '1rem', background: 'rgba(30, 41, 59, 0.45)', borderRadius: '10px', padding: '0.9rem' }}>
        <strong>Desafio Semanal</strong>
        <p>Gastos 7 dias: {weeklySpend.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} / {weeklyBudget.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
        <p>Status: {weeklyStatus}</p>
        <div style={{ marginTop: '0.5rem', width: '100%', height: '8px', background: 'var(--border)', borderRadius: '6px' }}>
          <div style={{ width: `${Math.min(100, Math.max(0, weeklyProgress))}%`, height: '100%', background: 'var(--info)', borderRadius: '6px' }} />
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
          <p style={{ color: 'var(--text-weak)' }}>Nenhuma ainda. Continue registrando!</p>
        ) : (
          <ul style={{ paddingLeft: '1rem' }}>
            {badges.map((badge) => (<li key={badge}>{badge}</li>))}
          </ul>
        )}
      </div>

      <div style={{ marginTop: '1rem', color: 'var(--text-medium)' }}>
        Próximo objetivo: manter 7 dias seguidos abaixo do limite diário para bônus extra.
      </div>
    </section>
  )
}
