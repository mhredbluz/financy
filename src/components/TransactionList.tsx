import type { Transaction } from '../types'
import { suggestCategory } from '../utils/categorySuggester'

interface TransactionListProps {
  transactions: Transaction[]
  selectedTransactions: Transaction[]
  categoryFilter: string
  onCategoryChange: (category: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  formatCurrency: (value: number) => string
}

export default function TransactionList({
  transactions,
  selectedTransactions,
  categoryFilter,
  onCategoryChange,
  onEdit,
  onDelete,
  formatCurrency,
}: TransactionListProps) {
  // Recategorizar automaticamente para o filtro
  const recategorizedTransactions = selectedTransactions.map((tx) => {
    if (!tx.category || tx.category.trim() === '' || tx.category.toLowerCase() === 'outros') {
      const suggestedCategory = suggestCategory(tx.note || '', tx.type)
      return { ...tx, category: suggestedCategory || tx.category }
    }
    return tx
  })

  const categories = Array.from(new Set(recategorizedTransactions.map((tx) => tx.category)))

  // Também recategorizar a lista de transações exibidas
  const displayTransactions = transactions.map((tx) => {
    if (!tx.category || tx.category.trim() === '' || tx.category.toLowerCase() === 'outros') {
      const suggestedCategory = suggestCategory(tx.note || '', tx.type)
      return { ...tx, category: suggestedCategory || tx.category }
    }
    return tx
  })

  return (
    <section className="list-card">
      <h2>Transações ({transactions.length})</h2>
      <label>
        Filtrar por categoria
        <select value={categoryFilter} onChange={(e) => onCategoryChange(e.target.value)}>
          <option value="all">Todas</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </label>
      <ul>
        {displayTransactions
          .slice()
          .sort((a, b) => b.date.localeCompare(a.date))
          .map((tx) => (
            <li key={tx.id} className={tx.type === 'expense' ? 'expense' : 'income'}>
              <span>{tx.date}</span>
              <span>{tx.category}</span>
              <span>{tx.type}</span>
              <span>{formatCurrency(tx.amount)}</span>
              <button onClick={() => onEdit(tx.id)}>Editar</button>
              <button onClick={() => onDelete(tx.id)}>Remover</button>
            </li>
          ))}
      </ul>
    </section>
  )
}
