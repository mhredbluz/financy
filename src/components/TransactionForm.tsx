import { useEffect, useState, useMemo } from 'react'
import type { FormEvent } from 'react'
import type { TransactionType, PaymentMethod } from '../types'
import { getCategorySuggestions } from '../utils/categorySuggester'

interface TransactionFormProps {
  form: { type: TransactionType; date: string; amount: number; category: string; note: string; paymentMethod: PaymentMethod }
  setForm: React.Dispatch<React.SetStateAction<{ type: TransactionType; date: string; amount: number; category: string; note: string; paymentMethod: PaymentMethod }>>
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  isEditing: boolean
  onCancelEdit: () => void
}

export default function TransactionForm({ form, setForm, onSubmit, isEditing, onCancelEdit }: TransactionFormProps) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  // Validação de data - não permitir datas futuras para despesas
  const validateDate = (date: string, type: TransactionType): string | null => {
    if (type === 'expense') {
      const selectedDate = new Date(date)
      const today = new Date()
      today.setHours(23, 59, 59, 999) // Fim do dia atual

      if (selectedDate > today) {
        return 'Não é possível registrar despesas com data futura'
      }
    }
    return null
  }

  // Validação geral do formulário
  const validateForm = (): boolean => {
    const errors: string[] = []

    if (!form.amount || form.amount <= 0) {
      errors.push('Valor deve ser maior que zero')
    }

    if (!form.category.trim()) {
      errors.push('Categoria é obrigatória')
    }

    const dateError = validateDate(form.date, form.type)
    if (dateError) {
      errors.push(dateError)
    }

    setValidationErrors(errors)
    return errors.length === 0
  }

  // Handler customizado para submit com validação
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (validateForm()) {
      onSubmit(event)
      setValidationErrors([])
    }
  }

  // Calcular sugestões usando useMemo
  const suggestions = useMemo(() => {
    if (form.note && form.note.length > 2) {
      return getCategorySuggestions(form.note, form.type)
    }
    return []
  }, [form.note, form.type])

  // Atalhos de teclado
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
        // Ctrl/Cmd + Enter para submeter o formulário
        event.preventDefault()
        const form = document.querySelector('form') as HTMLFormElement
        if (form) form.requestSubmit()
      } else if (event.key === 'Escape' && isEditing) {
        // Esc para cancelar edição
        event.preventDefault()
        onCancelEdit()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isEditing, onCancelEdit])

  const handleNoteChange = (value: string) => {
    setForm((old) => ({ ...old, note: value }))
    setShowSuggestions(value.length > 2)
  }

  const selectSuggestion = (category: string) => {
    setForm((old) => ({ ...old, category }))
    setShowSuggestions(false)
  }

  return (
    <section className="form-card">
      <h2>{isEditing ? 'Editar transação' : 'Nova transação'}</h2>

      {/* Exibir erros de validação */}
      {validationErrors.length > 0 && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '8px',
          padding: '0.75rem',
          marginBottom: '1rem'
        }}>
          <strong style={{ color: 'var(--danger)', fontSize: '0.9rem' }}>⚠️ Erros encontrados:</strong>
          <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.2rem', color: 'var(--danger)' }}>
            {validationErrors.map((error, index) => (
              <li key={index} style={{ fontSize: '0.85rem' }}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <label>
          Tipo
          <select
            value={form.type}
            onChange={(e) => setForm((old) => ({ ...old, type: e.target.value as TransactionType }))}
          >
            <option value="expense">Despesa</option>
            <option value="income">Receita</option>
          </select>
        </label>
        <label>
          Meio de pagamento
          <select
            value={form.paymentMethod}
            onChange={(e) => setForm((old) => ({ ...old, paymentMethod: e.target.value as PaymentMethod }))}
          >
            <option value="debit">Débito</option>
            <option value="credit">Crédito</option>
            <option value="pix">PIX</option>
            <option value="cash">Dinheiro</option>
            <option value="transfer">Transferência</option>
          </select>
        </label>
        <label>
          Data
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm((old) => ({ ...old, date: e.target.value }))}
          />
        </label>
        <label>
          Valor
          <input
            type="number"
            step="0.01"
            value={form.amount}
            onChange={(e) => setForm((old) => ({ ...old, amount: Number(e.target.value) }))}
          />
        </label>
        <label>
          Categoria
          <input
            type="text"
            value={form.category}
            onChange={(e) => setForm((old) => ({ ...old, category: e.target.value }))}
            placeholder="Digite ou selecione uma sugestão"
          />
          {showSuggestions && suggestions.length > 0 && (
            <div className="suggestions">
              <small>Sugestões baseadas na nota:</small>
              <div className="suggestion-buttons">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => selectSuggestion(suggestion)}
                    className="suggestion-btn"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
        </label>
        <label>
          Nota
          <input
            type="text"
            value={form.note}
            onChange={(e) => handleNoteChange(e.target.value)}
            placeholder="Ex: Nota fiscal do mercado Extra"
          />
        </label>

        <div className="button-row">
          <button type="submit">+ Adicionar</button>
          {isEditing && (
            <button type="button" onClick={onCancelEdit} style={{ marginLeft: '0.5rem' }}>
              Cancelar edição
            </button>
          )}
          <small style={{ marginLeft: 'auto', color: 'var(--text-weak)', fontSize: '0.8rem' }}>
            💡 Ctrl+Enter para salvar • Esc para cancelar
          </small>
        </div>
      </form>
    </section>
  )
}
