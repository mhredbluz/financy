import { useMemo, useState, useEffect } from 'react'
import './App.css'
import type { FormEvent } from 'react'
import type { Transaction, TransactionType, RecurringTransaction } from './types'
import TodayCard from './components/TodayCard'
import BudgetSummary from './components/BudgetSummary'
import VisualReports from './components/VisualReports'
import BudgetAlerts from './components/BudgetAlerts'
import GoalProgress from './components/GoalProgress'
import GamificationPanel from './components/GamificationPanel'
import TransactionForm from './components/TransactionForm'
import TransactionList from './components/TransactionList'
import CategoryManager from './components/CategoryManager'
import GoalManager from './components/GoalManager'
import RecurringManager from './components/RecurringManager'
import RecurringAlerts from './components/RecurringAlerts'
import BackupManager from './components/BackupManager'
import NotificationsPanel from './components/NotificationsPanel'
import IntegrationsPanel from './components/IntegrationsPanel'
import { addTransaction, deleteTransaction, loadAppData, saveAppData, setBudget, updateTransaction, generateRecurringTransactions } from './storage'
import { getDashboardSummary, getCategorySummary, type DashboardSummary, type CategorySummaryItem } from './api/dashboard'

function App() {
  const [transactions, setTransactions] = useState<Transaction[]>(() => loadAppData().transactions)
  const [selectedMonth, setSelectedMonth] = useState<string>(() => new Date().toISOString().slice(0, 7))
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().slice(0, 10))
  const [calendarView, setCalendarView] = useState<'day'|'week'|'month'|'year'>('day')
  const [budgetLimit, setBudgetLimit] = useState<number>(() => loadAppData().budget?.limit ?? 1200)
  const [editingTxId, setEditingTxId] = useState<string | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [form, setForm] = useState({ type: 'expense' as TransactionType, date: new Date().toISOString().slice(0, 10), amount: 0, category: '', note: '' })
  const [feedback, setFeedback] = useState<string | null>(null)
  const [showCategoryManager, setShowCategoryManager] = useState(false)
  const [showGoalManager, setShowGoalManager] = useState(false)
  const [showRecurringManager, setShowRecurringManager] = useState(false)
  const [showBackupManager, setShowBackupManager] = useState(false)
  const [showRecurringAlerts, setShowRecurringAlerts] = useState(false)
  const [showIntegrations, setShowIntegrations] = useState(false)

  const getNextDueDate = (lastDate: Date, recurrenceType: string): Date => {
    const nextDate = new Date(lastDate)

    switch (recurrenceType) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + 1)
        break
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7)
        break
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1)
        break
      case 'yearly':
        nextDate.setFullYear(nextDate.getFullYear() + 1)
        break
    }

    return nextDate
  }

  // Contar alertas de recorrências pendentes
  const pendingAlertsCount = useMemo(() => {
    const recurringTransactions: RecurringTransaction[] = JSON.parse(
      localStorage.getItem('financy-recurring-transactions') || '[]'
    )
    const dismissedAlerts: string[] = JSON.parse(
      localStorage.getItem('financy-dismissed-recurring-alerts') || '[]'
    )
    const dismissedSet = new Set(dismissedAlerts)

    const today = new Date()
    const nextWeek = new Date(today)
    nextWeek.setDate(today.getDate() + 7)

    return recurringTransactions.filter(recurring => {
      if (!recurring.isActive) return false
      if (dismissedSet.has(recurring.id)) return false

      const lastGenerated = recurring.lastGenerated ? new Date(recurring.lastGenerated) : new Date(recurring.startDate)
      const nextDue = getNextDueDate(lastGenerated, recurring.recurrenceType)

      return nextDue <= nextWeek && nextDue >= today
    }).length
  }, [transactions]) // Recalcular quando transactions mudam


  // Gerar transações recorrentes automaticamente ao carregar o app
  useEffect(() => {
    generateRecurringTransactions()
    setTransactions(loadAppData().transactions)
  }, [])

  const monthOptions = useMemo(() => {
    const months = [] as string[]
    const today = new Date()
    const base = new Date(today.getFullYear(), today.getMonth(), 1)
    for (let i = 0; i < 12; i += 1) {
      const d = new Date(base.getFullYear(), base.getMonth() - i, 1)
      months.push(d.toISOString().slice(0, 7))
    }
    return months
  }, [])

  const selectedTransactions = useMemo(
    () => transactions.filter((tx) => tx.date.startsWith(selectedMonth)),
    [transactions, selectedMonth],
  )

  useEffect(() => {
    const newMonth = selectedDate.slice(0, 7)
    if (selectedMonth !== newMonth) setSelectedMonth(newMonth)
  }, [selectedDate, selectedMonth])

  const filteredTransactions = useMemo(
    () =>
      categoryFilter === 'all'
        ? selectedTransactions
        : selectedTransactions.filter((tx) => tx.category === categoryFilter),
    [selectedTransactions, categoryFilter],
  )

  const dashboardSummary: DashboardSummary = useMemo(
    () => {
      const now = new Date(selectedDate)
      return getDashboardSummary(selectedTransactions, budgetLimit, now)
    },
    [selectedTransactions, budgetLimit, selectedDate],
  )

  const categorySummary: CategorySummaryItem[] = useMemo(
    () => getCategorySummary(transactions, selectedMonth),
    [transactions, selectedMonth],
  )

  const todayISO = new Date().toISOString().slice(0, 10)
  const status = dashboardSummary.saldo < 0 ? 'danger' : 'ok'
  const statusHoje = dashboardSummary.statusHoje.toLowerCase() === 'ok' ? 'ok' : 'danger'

  const handleQuickExpense = () => {
    setForm((f) => ({
      ...f,
      type: 'expense',
      date: todayISO,
    }))
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!form.amount || !form.category) return

    if (editingTxId) {
      const updatedTx: Transaction = {
        id: editingTxId,
        date: form.date,
        type: form.type,
        amount: form.amount,
        category: form.category,
        note: form.note,
      }

      updateTransaction(updatedTx)
      setEditingTxId(null)
      setTransactions(loadAppData().transactions)
      setForm({ type: 'expense', date: new Date().toISOString().slice(0, 10), amount: 0, category: '', note: '' })
      return
    }

    const tx: Transaction = {
      id: crypto.randomUUID(),
      date: form.date,
      type: form.type,
      amount: form.amount,
      category: form.category,
      note: form.note,
    }

    addTransaction(tx)
    setTransactions(loadAppData().transactions)

    const { orcamentoHoje, gastoHoje } = dashboardSummary
    const novoGastoHoje = form.type === 'expense' && form.date === todayISO ? gastoHoje + form.amount : gastoHoje
    const limiteRestanteHoje = Math.max(0, orcamentoHoje - novoGastoHoje)

    if (form.type === 'expense') {
      setFeedback(`-R$ ${form.amount.toFixed(2)} do seu limite diário (${formatCurrency(limiteRestanteHoje)} restante)`)
    } else {
      setFeedback('Boa! ainda dentro do limite')
    }

    setTimeout(() => setFeedback(null), 3000)

    setForm({ ...form, amount: 0, category: '', note: '' })
  }

  const handleDelete = (id: string) => {
    deleteTransaction(id)
    setTransactions(loadAppData().transactions)
  }

  const handleEdit = (id: string) => {
    const tx = transactions.find((item) => item.id === id)
    if (!tx) return
    setEditingTxId(id)
    setForm({ type: tx.type, date: tx.date, amount: tx.amount, category: tx.category, note: tx.note ?? '' })
  }

  const updateBudget = () => {
    setBudget(selectedMonth, budgetLimit)
    const all = loadAppData()
    all.budget = { month: selectedMonth, limit: budgetLimit }
    saveAppData(all)
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

  return (
    <div className="App">
      <header>
        <h1>Financy</h1>
        <p>Orçamento mensal + controle diário de gastos</p>
      </header>

      <TodayCard
        summary={dashboardSummary}
        selectedDate={selectedDate}
        calendarView={calendarView}
        onDateChange={setSelectedDate}
        onViewChange={setCalendarView}
      />

      <BudgetAlerts
        transactions={transactions}
        selectedMonth={selectedMonth}
        budgetLimit={budgetLimit}
      />

      <section className={`app-status ${status}`}>
        <div>
          <strong>💰 Saldo</strong>
          <p>{formatCurrency(dashboardSummary.saldo)}</p>
        </div>
        <div>
          <strong>📅 Dias restantes</strong>
          <p>{dashboardSummary.diasRestantes}</p>
        </div>
        <div>
          <strong>🔥 Hoje pode gastar</strong>
          <p>{formatCurrency(Math.max(0, dashboardSummary.orcamentoDiario))}</p>
        </div>        <div>
          <strong>💸 Gasto hoje</strong>
          <p className={statusHoje}>{formatCurrency(dashboardSummary.gastoHoje)}</p>
        </div>
        <div>
          <strong>⚖️ Diferença hoje</strong>
          <p className={statusHoje}>{formatCurrency(dashboardSummary.diferencaHoje)}</p>
        </div>      </section>

      <BudgetSummary
        month={selectedMonth}
        monthOptions={monthOptions}
        selectedMonth={selectedMonth}
        onMonthChange={(next) => {
          setSelectedMonth(next)
          const stored = loadAppData().budget
          if (stored?.month === next) setBudgetLimit(stored.limit)
        }}
        budgetLimit={budgetLimit}
        onBudgetLimitChange={setBudgetLimit}
        onSaveBudget={updateBudget}
        summary={dashboardSummary}
      />

      <VisualReports
        transactions={transactions}
        selectedMonth={selectedMonth}
        formatCurrency={formatCurrency}
      />

      <GoalProgress
        goals={JSON.parse(localStorage.getItem('financy-custom-goals') || '[]')}
        transactions={transactions}
        selectedMonth={selectedMonth}
        formatCurrency={formatCurrency}
      />

      <GamificationPanel
        transactions={transactions}
        selectedMonth={selectedMonth}
        budgetLimit={budgetLimit}
      />

      <NotificationsPanel
        transactions={transactions}
        selectedMonth={selectedMonth}
        budgetLimit={budgetLimit}
      />

      {feedback && <p className="feedback">{feedback}</p>}

      <TransactionForm
        form={form}
        setForm={setForm}
        onSubmit={handleSubmit}
        isEditing={!!editingTxId}
        onCancelEdit={() => {
          setEditingTxId(null)
          setForm({ type: 'expense', date: new Date().toISOString().slice(0, 10), amount: 0, category: '', note: '' })
        }}
      />

      <div className="category-manager-btn">
        <button onClick={() => setShowCategoryManager(true)} className="manage-categories-btn">
          🧠 Gerenciar Categorias Inteligentes
        </button>
        <button
          onClick={() => setShowGoalManager(true)}
          className="manage-categories-btn"
          style={{ marginLeft: '0.5rem', background: 'var(--primary)' }}
        >
          🎯 Gerenciar Metas
        </button>
        <button
          onClick={() => setShowRecurringManager(true)}
          className="manage-categories-btn"
          style={{ marginLeft: '0.5rem', background: 'var(--success)' }}
        >
          🔄 Gerenciar Recorrências
        </button>
        <button
          onClick={() => setShowIntegrations(true)}
          className="manage-categories-btn"
          style={{ marginLeft: '0.5rem', background: 'var(--info)' }}
        >
          🔌 Configurar Integrações
        </button>
        <button
          onClick={() => setShowBackupManager(true)}
          className="manage-categories-btn"
          style={{ marginLeft: '0.5rem', background: 'var(--primary)' }}
        >
          💾 Backup/Exportação
        </button>
        <button
          onClick={() => setShowRecurringAlerts(true)}
          className="manage-categories-btn"
          style={{ marginLeft: '0.5rem', background: 'var(--warning)', position: 'relative' }}
        >
          🔔 Ver Alertas
          {pendingAlertsCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '-8px',
              right: '-8px',
              background: 'var(--danger)',
              color: 'white',
              borderRadius: '50%',
              width: '20px',
              height: '20px',
              fontSize: '0.7rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold'
            }}>
              {pendingAlertsCount}
            </span>
          )}
        </button>
      </div>
      <div className="quick-input">
        <button type="button" onClick={handleQuickExpense}>
          + Gastei agora
        </button>
      </div>

      <TransactionList
        transactions={filteredTransactions}
        selectedTransactions={selectedTransactions}
        categoryFilter={categoryFilter}
        onCategoryChange={setCategoryFilter}
        onEdit={handleEdit}
        onDelete={handleDelete}
        formatCurrency={formatCurrency}
      />

      <section className="list-card">
        <h2>Agregação por categoria (despesas)</h2>
        <ul>
          {categorySummary.length === 0 ? (
            <li>Nenhuma despesa cadastrada no mês.</li>
          ) : (
            categorySummary.map((item) => (
              <li key={item.categoria}>
                <strong>{item.categoria}</strong>: {formatCurrency(item.total)}
              </li>
            ))
          )}
        </ul>
      </section>

      {showCategoryManager && (
        <CategoryManager onClose={() => setShowCategoryManager(false)} />
      )}

      {showGoalManager && (
        <GoalManager
          onClose={() => setShowGoalManager(false)}
          selectedMonth={selectedMonth}
        />
      )}

      {showRecurringManager && (
        <RecurringManager onClose={() => setShowRecurringManager(false)} />
      )}

      {showBackupManager && (
        <BackupManager
          onClose={() => setShowBackupManager(false)}
          formatCurrency={formatCurrency}
        />
      )}

      {showIntegrations && (
        <IntegrationsPanel onClose={() => setShowIntegrations(false)} />
      )}

      {showRecurringAlerts && (
        <RecurringAlerts onClose={() => setShowRecurringAlerts(false)} />
      )}
    </div>
  )
}

export default App
