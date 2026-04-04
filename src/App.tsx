import { useMemo, useState, useEffect } from 'react'
import './App.css'
import type { FormEvent } from 'react'
import type { Transaction, TransactionType, RecurringTransaction, Goal } from './types'
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
import ReceiptUploader from './components/ReceiptUploader'
import RecurringOverview from './components/RecurringOverview'
import CardStatementImporter from './components/CardStatementImporter'
import { AppProvider } from './context/AppContext'
import { GoalsProvider } from './context/GoalsContext'
import { addTransaction, deleteTransaction, loadAppData, saveAppData, setBudget, updateTransaction, generateRecurringTransactions } from './storage'
import { getDashboardSummary, getCategorySummary, type DashboardSummary, type CategorySummaryItem } from './api/dashboard'

function App() {
  const toLocalISODate = (date = new Date()) => {
    const d = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    return d.toISOString().slice(0, 10)
  }
  const parseLocalDate = (iso: string) => {
    const [year, month, day] = iso.split('-').map(Number)
    return new Date(year, month - 1, day)
  }
  const [transactions, setTransactions] = useState<Transaction[]>(() => loadAppData().transactions)
  const [goals, setGoals] = useState<Goal[]>(() => loadAppData().goals ?? [])
  const [selectedMonth, setSelectedMonth] = useState<string>(() => toLocalISODate().slice(0, 7))
  const [selectedDate, setSelectedDate] = useState<string>(() => toLocalISODate())
  const [calendarView, setCalendarView] = useState<'day'|'week'|'month'|'year'>('day')
  const [budgetLimit, setBudgetLimit] = useState<number>(() => loadAppData().budget?.limit ?? 1200)
  const [editingTxId, setEditingTxId] = useState<string | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [form, setForm] = useState({ type: 'expense' as TransactionType, date: toLocalISODate(), amount: 0, category: '', note: '', allocatedToGoal: undefined as string | undefined, paymentMethod: 'debit' as const })
  const [feedback, setFeedback] = useState<string | null>(null)
  const [showCategoryManager, setShowCategoryManager] = useState(false)
  const [showGoalManager, setShowGoalManager] = useState(false)
  const [showRecurringManager, setShowRecurringManager] = useState(false)
  const [showBackupManager, setShowBackupManager] = useState(false)
  const [showRecurringAlerts, setShowRecurringAlerts] = useState(false)
  const [showIntegrations, setShowIntegrations] = useState(false)
  const [activeTab, setActiveTab] = useState<'summary' | 'reports' | 'goals' | 'gamification' | 'notifications'>('summary')
  const [currentView, setCurrentView] = useState<'dashboard' | 'transactions' | 'cards' | 'settings'>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>(() => loadAppData().recurringTransactions ?? [])

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

      const lastGenerated = recurring.lastGenerated ? parseLocalDate(recurring.lastGenerated) : parseLocalDate(recurring.startDate)
      const nextDue = getNextDueDate(lastGenerated, recurring.recurrenceType)

      return nextDue <= nextWeek && nextDue >= today
    }).length
  }, [recurringTransactions]) // Recalcular quando recorrÃªncias mudam


  // Gerar transações recorrentes automaticamente ao carregar o app
  useEffect(() => {
    generateRecurringTransactions()
    setTransactions(loadAppData().transactions)
  }, [])

  useEffect(() => {
    const data = loadAppData()
    data.recurringTransactions = recurringTransactions
    saveAppData(data, false)
    generateRecurringTransactions()
    setTransactions(loadAppData().transactions)
  }, [recurringTransactions])

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
      const now = parseLocalDate(selectedDate)
      return getDashboardSummary(transactions, recurringTransactions, budgetLimit, now)
    },
    [transactions, recurringTransactions, budgetLimit, selectedDate],
  )

  const categorySummary: CategorySummaryItem[] = useMemo(
    () => getCategorySummary(transactions, selectedMonth),
    [transactions, selectedMonth],
  )

  const todayISO = toLocalISODate()
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
        paymentMethod: form.paymentMethod,
        allocatedToGoal: form.allocatedToGoal,
      }

      updateTransaction(updatedTx)
      
      // Update goal's allocated amount if goal is set
      if (form.allocatedToGoal) {
        const updatedGoals = goals.map((goal) => {
          if (goal.id === form.allocatedToGoal) {
            const allocatedAmount = (goal.allocatedAmount ?? 0) + form.amount
            return { ...goal, allocatedAmount }
          }
          return goal
        })
        setGoals(updatedGoals)
        const appData = loadAppData()
        appData.goals = updatedGoals
        saveAppData(appData)
      }

      setEditingTxId(null)
      setTransactions(loadAppData().transactions)
      setForm({ type: 'expense', date: toLocalISODate(), amount: 0, category: '', note: '', paymentMethod: 'debit', allocatedToGoal: undefined })
      return
    }

    const tx: Transaction = {
      id: crypto.randomUUID(),
      date: form.date,
      type: form.type,
      amount: form.amount,
      category: form.category,
      note: form.note,
      paymentMethod: form.paymentMethod,
      allocatedToGoal: form.allocatedToGoal,
    }

    addTransaction(tx)
    setTransactions(loadAppData().transactions)

    // Update goal's allocated amount if goal is set
    if (form.allocatedToGoal) {
      const updatedGoals = goals.map((goal) => {
        if (goal.id === form.allocatedToGoal) {
          const allocatedAmount = (goal.allocatedAmount ?? 0) + form.amount
          return { ...goal, allocatedAmount }
        }
        return goal
      })
      setGoals(updatedGoals)
      const appData = loadAppData()
      appData.goals = updatedGoals
      saveAppData(appData)
    }

    const { orcamentoHoje, gastoHoje } = dashboardSummary
    const novoGastoHoje = form.type === 'expense' && form.date === todayISO ? gastoHoje + form.amount : gastoHoje
    const limiteRestanteHoje = Math.max(0, orcamentoHoje - novoGastoHoje)

    if (form.type === 'expense') {
      setFeedback(`-R$ ${form.amount.toFixed(2)} do seu limite diário (${formatCurrency(limiteRestanteHoje)} restante)`)
    } else {
      setFeedback('Boa! ainda dentro do limite')
    }

    setTimeout(() => setFeedback(null), 3000)

    setForm({ ...form, amount: 0, category: '', note: '', paymentMethod: 'debit', allocatedToGoal: undefined })
  }

  const handleDelete = (id: string) => {
    deleteTransaction(id)
    setTransactions(loadAppData().transactions)
  }

  const handleImportCardStatement = (items: { date: string; amount: number; description: string }[]) => {
    if (items.length === 0) return
    items.forEach((item) => {
      const tx: Transaction = {
        id: crypto.randomUUID(),
        date: item.date,
        type: 'expense',
        amount: item.amount,
        category: 'Cartão',
        note: item.description,
        paymentMethod: 'credit',
      }
      addTransaction(tx)
    })
    setTransactions(loadAppData().transactions)
  }

  const handleEdit = (id: string) => {
    const tx = transactions.find((item) => item.id === id)
    if (!tx) return
    setEditingTxId(id)
    setForm({ type: tx.type, date: tx.date, amount: tx.amount, category: tx.category, note: tx.note ?? '', paymentMethod: tx.paymentMethod ?? 'debit', allocatedToGoal: tx.allocatedToGoal })
  }

  const updateBudget = () => {
    setBudget(selectedMonth, budgetLimit)
    const all = loadAppData()
    all.budget = { month: selectedMonth, limit: budgetLimit }
    saveAppData(all)
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

  const appContextValue = { transactions, selectedMonth, selectedDate, budgetLimit, recurringTransactions, setRecurringTransactions }

  const goalsContextValue = { goals, setGoals }

  return (
    <AppProvider value={appContextValue}>
    <GoalsProvider value={goalsContextValue}>
    <div className="App">
      <nav className="sidebar" data-open={sidebarOpen}>
        <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle sidebar">
          {sidebarOpen ? '✕' : '☰'}
        </button>
        <div className="sidebar-brand">
          <div className="brand-mark">F</div>
          {sidebarOpen && (
            <div className="brand-text">
              <strong>Financy</strong>
              <span>controle real</span>
            </div>
          )}
        </div>
        <div className="sidebar-content">
          {sidebarOpen && <div className="sidebar-section">Principal</div>}
          <button className={`nav-btn ${currentView === 'dashboard' ? 'active' : ''}`} onClick={() => { setCurrentView('dashboard'); setSidebarOpen(false); }}>
            <span className="icon">🏠</span>
            {sidebarOpen && <span className="label">Dashboard</span>}
          </button>
          <button className={`nav-btn ${currentView === 'transactions' ? 'active' : ''}`} onClick={() => { setCurrentView('transactions'); setSidebarOpen(false); }}>
            <span className="icon">💳</span>
            {sidebarOpen && <span className="label">Transações</span>}
          </button>
          <button className={`nav-btn ${currentView === 'cards' ? 'active' : ''}`} onClick={() => { setCurrentView('cards'); setSidebarOpen(false); }}>
            <span className="icon">💼</span>
            {sidebarOpen && <span className="label">Cartões</span>}
          </button>
          {sidebarOpen && <div className="sidebar-section">Configurações</div>}
          <button className={`nav-btn ${currentView === 'settings' ? 'active' : ''}`} onClick={() => { setCurrentView('settings'); setSidebarOpen(false); }}>
            <span className="icon">⚙️</span>
            {sidebarOpen && <span className="label">Configurações</span>}
          </button>
        </div>
        {sidebarOpen && (
          <div className="sidebar-footer">
            <span>v0.1 • local-first</span>
          </div>
        )}
      </nav>

      <main className="main-content">
        <header>
          <h1>Financy</h1>
          <p>Orçamento mensal + controle diário de gastos</p>
        </header>

        {currentView === 'dashboard' && (
          <div className="main-grid">
          <div className="left-column">
            <TodayCard
              summary={dashboardSummary}
              selectedDate={selectedDate}
              calendarView={calendarView}
              onDateChange={(nextDate) => {
                setSelectedDate(nextDate)
                const newMonth = nextDate.slice(0, 7)
                if (selectedMonth !== newMonth) setSelectedMonth(newMonth)
              }}
              onViewChange={setCalendarView}
            />

            <BudgetAlerts />

            <RecurringOverview />

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
              </div>
              <div>
                <strong>💸 Gasto hoje</strong>
                <p className={statusHoje}>{formatCurrency(dashboardSummary.gastoHoje)}</p>
              </div>
              <div>
                <strong>⚖️ Diferença hoje</strong>
                <p className={statusHoje}>{formatCurrency(dashboardSummary.diferencaHoje)}</p>
              </div>
            </section>
          </div>

          <div className="right-column">
            <div className="tabs">
              <button className={activeTab === 'summary' ? 'active' : ''} onClick={() => setActiveTab('summary')}>📊 Resumo</button>
              <button className={activeTab === 'reports' ? 'active' : ''} onClick={() => setActiveTab('reports')}>📈 Relatórios</button>
              <button className={activeTab === 'goals' ? 'active' : ''} onClick={() => setActiveTab('goals')}>🎯 Metas</button>
              <button className={activeTab === 'gamification' ? 'active' : ''} onClick={() => setActiveTab('gamification')}>🏆 Gamificação</button>
              <button className={activeTab === 'notifications' ? 'active' : ''} onClick={() => setActiveTab('notifications')}>🔔 Notificações</button>
            </div>

            {activeTab === 'summary' && (
              <BudgetSummary
                selectedDate={selectedDate}
                summary={dashboardSummary}
              />
            )}

            {activeTab === 'reports' && (
              <VisualReports formatCurrency={formatCurrency} />
            )}

            {activeTab === 'goals' && (
              <GoalProgress
                transactions={transactions}
                selectedMonth={selectedMonth}
                formatCurrency={formatCurrency}
              />
            )}

            {activeTab === 'gamification' && (
              <GamificationPanel />
            )}

            {activeTab === 'notifications' && (
              <NotificationsPanel />
            )}
          </div>
        </div>
      )}

      {currentView === 'transactions' && (
        <div className="transactions-view">
          <ReceiptUploader
            onApply={(data) => {
              setForm((old) => ({
                ...old,
                type: data.type ?? old.type,
                date: data.date ?? old.date,
                amount: data.amount ?? old.amount,
                note: data.note ?? old.note,
                paymentMethod: old.paymentMethod ?? 'debit',
              }))
            }}
          />
          <TransactionForm
            form={form}
            setForm={setForm}
            onSubmit={handleSubmit}
            isEditing={!!editingTxId}
            onCancelEdit={() => {
              setEditingTxId(null)
              setForm({ type: 'expense', date: toLocalISODate(), amount: 0, category: '', note: '', paymentMethod: 'debit' })
            }}
          />

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
        </div>
      )}

      {currentView === 'settings' && (
        <div className="settings-view">
          <h2>Configurações e Gerenciamento</h2>
          <div className="settings-grid">
            <button onClick={() => setShowCategoryManager(true)} className="setting-btn">
              🧠 Gerenciar Categorias Inteligentes
            </button>
            <button onClick={() => setShowGoalManager(true)} className="setting-btn">
              🎯 Gerenciar Metas
            </button>
            <button onClick={() => setShowRecurringManager(true)} className="setting-btn">
              🔄 Gerenciar Recorrências
            </button>
            <button onClick={() => setShowIntegrations(true)} className="setting-btn">
              🔌 Configurar Integrações
            </button>
            <button onClick={() => setShowBackupManager(true)} className="setting-btn">
              💾 Backup/Exportação
            </button>
            <button onClick={() => setShowRecurringAlerts(true)} className="setting-btn">
              🔔 Ver Alertas
              {pendingAlertsCount > 0 && (
                <span className="badge">{pendingAlertsCount}</span>
              )}
            </button>
          </div>
        </div>
      )}

      {feedback && <p className="feedback">{feedback}</p>}

      {showCategoryManager && (
        <CategoryManager onClose={() => setShowCategoryManager(false)} />
      )}

      {showGoalManager && (
        <GoalManager
          onClose={() => setShowGoalManager(false)}
          selectedMonth={selectedMonth}
        />
      )}

      {currentView === 'cards' && (
        <div className="transactions-view">
          <CardStatementImporter onImport={handleImportCardStatement} />
          <section className="list-card tips-card">
            <div className="reports-header">
              <div>
                <h2>Dicas rápidas</h2>
                <p className="reports-sub">Boas práticas para cartão de crédito</p>
              </div>
              <div className="pill">Guia</div>
            </div>
            <ul className="tips-list">
              <li>Importe sua fatura e gere lançamentos no crédito.</li>
              <li>O pagamento da fatura não entra como gasto novo.</li>
              <li>Você pode ajustar categoria depois, se necessário.</li>
            </ul>
          </section>
        </div>
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
      </main>
    </div>
    </GoalsProvider>
    </AppProvider>
  )
}

export default App

