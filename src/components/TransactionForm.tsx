import { useEffect, useState, useMemo } from 'react'
import type { FormEvent } from 'react'
import type { TransactionType } from '../types'
import { suggestCategory, getCategorySuggestions } from '../utils/categorySuggester'

interface TransactionFormProps {
  form: { type: TransactionType; date: string; amount: number; category: string; note: string }
  setForm: React.Dispatch<React.SetStateAction<{ type: TransactionType; date: string; amount: number; category: string; note: string }>>
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  isEditing: boolean
  onCancelEdit: () => void
}

export default function TransactionForm({ form, setForm, onSubmit, isEditing, onCancelEdit }: TransactionFormProps) {
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Calcular sugestões usando useMemo
  const suggestions = useMemo(() => {
    if (form.note && form.note.length > 2) {
      return getCategorySuggestions(form.note, form.type)
    }
    return []
  }, [form.note, form.type])

  // Sugestão automática de categoria baseada na nota
  useEffect(() => {
    if (form.note && form.note.length > 2 && !isEditing && !form.category) {
      const suggested = suggestCategory(form.note, form.type)
      if (suggested) {
        setForm(prev => ({ ...prev, category: suggested }))
      }
    }
  }, [form.note, form.type, isEditing, form.category, setForm])

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
      <form onSubmit={onSubmit}>
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
        </div>
      </form>
    </section>
  )
}
