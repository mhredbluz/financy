import { useState, useMemo } from 'react'
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

type SortField = 'date' | 'amount' | 'category' | 'type'
type SortDirection = 'asc' | 'desc'

export default function TransactionList({
  transactions,
  selectedTransactions,
  categoryFilter,
  onCategoryChange,
  onEdit,
  onDelete,
  formatCurrency,
}: TransactionListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

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

  // Filtrar por busca
  const filteredBySearch = useMemo(() => {
    if (!searchTerm.trim()) return displayTransactions
    return displayTransactions.filter(tx =>
      tx.note?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.type.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [displayTransactions, searchTerm])

  // Ordenar
  const sortedTransactions = useMemo(() => {
    return [...filteredBySearch].sort((a, b) => {
      let aValue: string | number | Date = a[sortField]
      let bValue: string | number | Date = b[sortField]

      if (sortField === 'date') {
        aValue = new Date(aValue as string).getTime()
        bValue = new Date(bValue as string).getTime()
      } else if (sortField === 'amount') {
        aValue = Number(aValue)
        bValue = Number(bValue)
      } else {
        aValue = String(aValue).toLowerCase()
        bValue = String(bValue).toLowerCase()
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }, [filteredBySearch, sortField, sortDirection])

  // Paginação
  const totalPages = Math.ceil(sortedTransactions.length / itemsPerPage)
  const paginatedTransactions = sortedTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
    setCurrentPage(1) // Reset para primeira página
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return '↕️'
    return sortDirection === 'asc' ? '↑' : '↓'
  }

  return (
    <section className="list-card">
      <h2>Transações ({filteredBySearch.length})</h2>

      {/* Controles de filtro e busca */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
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

        <label>
          Buscar nas notas
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Ex: mercado, uber, salário..."
          />
        </label>
      </div>

      {/* Controles de ordenação */}
      <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <span style={{ alignSelf: 'end', color: 'var(--text-weak)', fontSize: '0.9rem' }}>Ordenar por:</span>
        <button
          onClick={() => handleSort('date')}
          style={{
            background: sortField === 'date' ? 'var(--primary)' : 'var(--surface)',
            color: sortField === 'date' ? 'var(--text-strong)' : 'var(--text-medium)',
            border: '1px solid var(--border)',
            padding: '0.25rem 0.5rem',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.8rem'
          }}
        >
          Data {getSortIcon('date')}
        </button>
        <button
          onClick={() => handleSort('amount')}
          style={{
            background: sortField === 'amount' ? 'var(--primary)' : 'var(--surface)',
            color: sortField === 'amount' ? 'var(--text-strong)' : 'var(--text-medium)',
            border: '1px solid var(--border)',
            padding: '0.25rem 0.5rem',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.8rem'
          }}
        >
          Valor {getSortIcon('amount')}
        </button>
        <button
          onClick={() => handleSort('category')}
          style={{
            background: sortField === 'category' ? 'var(--primary)' : 'var(--surface)',
            color: sortField === 'category' ? 'var(--text-strong)' : 'var(--text-medium)',
            border: '1px solid var(--border)',
            padding: '0.25rem 0.5rem',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.8rem'
          }}
        >
          Categoria {getSortIcon('category')}
        </button>
        <button
          onClick={() => handleSort('type')}
          style={{
            background: sortField === 'type' ? 'var(--primary)' : 'var(--surface)',
            color: sortField === 'type' ? 'var(--text-strong)' : 'var(--text-medium)',
            border: '1px solid var(--border)',
            padding: '0.25rem 0.5rem',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.8rem'
          }}
        >
          Tipo {getSortIcon('type')}
        </button>
      </div>

      <ul>
        {paginatedTransactions.map((tx) => (
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

      {/* Paginação */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem', alignItems: 'center' }}>
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            style={{
              background: currentPage === 1 ? 'var(--text-weak)' : 'var(--primary)',
              color: 'var(--text-strong)',
              border: 'none',
              padding: '0.5rem',
              borderRadius: '4px',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
            }}
          >
            ‹ Anterior
          </button>

          <span style={{ color: 'var(--text-medium)', fontSize: '0.9rem' }}>
            Página {currentPage} de {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            style={{
              background: currentPage === totalPages ? 'var(--text-weak)' : 'var(--primary)',
              color: 'var(--text-strong)',
              border: 'none',
              padding: '0.5rem',
              borderRadius: '4px',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
            }}
          >
            Próxima ›
          </button>
        </div>
      )}
    </section>
  )
}
