import { useMemo, useState } from 'react'
import './App.css'
import type { FormEvent } from 'react'
import type { Transaction, TransactionType } from './types'
import TodayCard from './components/TodayCard'
import BudgetSummary from './components/BudgetSummary'
import TransactionForm from './components/TransactionForm'
import TransactionList from './components/TransactionList'
import CategoryManager from './components/CategoryManager'
import { addTransaction, deleteTransaction, loadAppData, saveAppData, setBudget, updateTransaction } from './storage'
import { getDashboardSummary, getCategorySummary, type DashboardSummary, type CategorySummaryItem } from './api/dashboard'

function App() {
  const [transactions, setTransactions] = useState<Transaction[]>(() => loadAppData().transactions)
  const [selectedMonth, setSelectedMonth] = useState<string>(() => new Date().toISOString().slice(0, 7))
  const [budgetLimit, setBudgetLimit] = useState<number>(() => loadAppData().budget?.limit ?? 1200)
  const [editingTxId, setEditingTxId] = useState<string | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [form, setForm] = useState({ type: 'expense' as TransactionType, date: new Date().toISOString().slice(0, 10), amount: 0, category: '', note: '' })
  const [feedback, setFeedback] = useState<string | null>(null)
  const [showCategoryManager, setShowCategoryManager] = useState(false)

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

  const filteredTransactions = useMemo(
    () =>
      categoryFilter === 'all'
        ? selectedTransactions
        : selectedTransactions.filter((tx) => tx.category === categoryFilter),
    [selectedTransactions, categoryFilter],
  )

  const dashboardSummary: DashboardSummary = useMemo(
    () => {
      const today = new Date()
      const monthRef = selectedMonth === today.toISOString().slice(0, 7) ? today : new Date(`${selectedMonth}-01`)
      return getDashboardSummary(selectedTransactions, budgetLimit, monthRef)
    },
    [selectedTransactions, budgetLimit, selectedMonth],
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

      <TodayCard summary={dashboardSummary} />

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
    </div>
  )
}

export default App
