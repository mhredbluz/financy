import { useState } from 'react'
import { useAppContext } from '../context/AppContext'
import type { RecurringTransaction, RecurrenceType, TransactionType } from '../types'

interface RecurringManagerProps {
  onClose: () => void
}

export default function RecurringManager({ onClose }: RecurringManagerProps) {
  const { recurringTransactions, setRecurringTransactions } = useAppContext()

  const toLocalISODate = (date = new Date()) => {
    const d = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    return d.toISOString().slice(0, 10)
  }
  const parseLocalDate = (iso: string) => {
    const [year, month, day] = iso.split('-').map(Number)
    return new Date(year, month - 1, day)
  }
  const formatLocalDate = (iso: string) => parseLocalDate(iso).toLocaleDateString('pt-BR')

  const [newRecurring, setNewRecurring] = useState({
    type: 'expense' as TransactionType,
    amount: 0,
    category: '',
    note: '',
    recurrenceType: 'monthly' as RecurrenceType,
    startDate: toLocalISODate(),
    endDate: '',
    isActive: true
  })

  const [editingId, setEditingId] = useState<string | null>(null)

  const addRecurring = () => {
    if (!newRecurring.amount || !newRecurring.category.trim()) return

    const recurring: RecurringTransaction = {
      id: crypto.randomUUID(),
      type: newRecurring.type,
      amount: newRecurring.amount,
      category: newRecurring.category.trim(),
      note: newRecurring.note.trim() || undefined,
      recurrenceType: newRecurring.recurrenceType,
      startDate: newRecurring.startDate,
      endDate: newRecurring.endDate || undefined,
      isActive: newRecurring.isActive,
      createdAt: new Date().toISOString()
    }

    if (editingId) {
      // Editando recorrÃªncia existente
      setRecurringTransactions(recurringTransactions.map(r => r.id === editingId ? recurring : r))
      setEditingId(null)
    } else {
      // Adicionando nova recorrÃªncia
      setRecurringTransactions([...recurringTransactions, recurring])
    }

    // Resetar formulÃ¡rio
    setNewRecurring({
      type: 'expense',
      amount: 0,
      category: '',
      note: '',
      recurrenceType: 'monthly',
      startDate: toLocalISODate(),
      endDate: '',
      isActive: true
    })
  }

  const editRecurring = (recurring: RecurringTransaction) => {
    setNewRecurring({
      type: recurring.type,
      amount: recurring.amount,
      category: recurring.category,
      note: recurring.note || '',
      recurrenceType: recurring.recurrenceType,
      startDate: recurring.startDate,
      endDate: recurring.endDate || '',
      isActive: recurring.isActive
    })
    setEditingId(recurring.id)
  }

  const deleteRecurring = (recurringId: string) => {
    if (confirm('Tem certeza que deseja excluir esta recorrÃªncia? Todas as transaÃ§Ãµes futuras geradas por ela tambÃ©m serÃ£o removidas.')) {
      setRecurringTransactions(recurringTransactions.filter(r => r.id !== recurringId))
    }
  }

  const toggleActive = (recurringId: string) => {
    setRecurringTransactions(recurringTransactions.map(r =>
      r.id === recurringId ? { ...r, isActive: !r.isActive } : r
    ))
  }

  const getRecurrenceLabel = (type: RecurrenceType) => {
    switch (type) {
      case 'daily': return 'DiÃ¡ria'
      case 'weekly': return 'Semanal'
      case 'monthly': return 'Mensal'
      case 'yearly': return 'Anual'
      default: return type
    }
  }

  const getRecurrenceIcon = (type: RecurrenceType) => {
    switch (type) {
      case 'daily': return 'ðŸ“…'
      case 'weekly': return 'ðŸ“Š'
      case 'monthly': return 'ðŸ—“ï¸'
      case 'yearly': return 'ðŸŽ¯'
      default: return 'ðŸ”„'
    }
  }

  return (
    <div className="category-manager-overlay">
      <div className="category-manager">
        <div className="category-manager-header">
          <div>
            <h3>Gerenciar TransaÃ§Ãµes Recorrentes</h3>
            <small style={{ fontSize: '0.8rem', color: 'var(--text-weak)' }}>
              ðŸ’¡ Pressione Esc para fechar
            </small>
          </div>
          <button onClick={onClose} className="close-btn">âœ•</button>
        </div>

        <div className="category-manager-content">
          {/* FormulÃ¡rio para adicionar/editar recorrÃªncia */}
          <div className="add-category-form">
            <h4>{editingId ? 'Editar RecorrÃªncia' : 'Adicionar Nova RecorrÃªncia'}</h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <label>
                Tipo
                <select
                  value={newRecurring.type}
                  onChange={(e) => setNewRecurring(prev => ({ ...prev, type: e.target.value as TransactionType }))}
                >
                  <option value="expense">ðŸ’¸ Despesa</option>
                  <option value="income">ðŸ’° Receita</option>
                </select>
              </label>

              <label>
                Valor (R$)
                <input
                  type="number"
                  step="0.01"
                  value={newRecurring.amount}
                  onChange={(e) => setNewRecurring(prev => ({ ...prev, amount: Number(e.target.value) }))}
                  placeholder="0.00"
                />
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <label>
                Categoria
                <input
                  type="text"
                  value={newRecurring.category}
                  onChange={(e) => setNewRecurring(prev => ({ ...prev, category: e.target.value }))}
                  placeholder="Ex: Assinaturas"
                />
              </label>

              <label>
                FrequÃªncia
                <select
                  value={newRecurring.recurrenceType}
                  onChange={(e) => setNewRecurring(prev => ({ ...prev, recurrenceType: e.target.value as RecurrenceType }))}
                >
                  <option value="daily">ðŸ“… DiÃ¡ria</option>
                  <option value="weekly">ðŸ“Š Semanal</option>
                  <option value="monthly">ðŸ—“ï¸ Mensal</option>
                  <option value="yearly">ðŸŽ¯ Anual</option>
                </select>
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <label>
                Data de InÃ­cio
                <input
                  type="date"
                  value={newRecurring.startDate}
                  onChange={(e) => setNewRecurring(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </label>

              <label>
                Data de Fim (opcional)
                <input
                  type="date"
                  value={newRecurring.endDate}
                  onChange={(e) => setNewRecurring(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </label>
            </div>

            <label>
              DescriÃ§Ã£o
              <input
                type="text"
                value={newRecurring.note}
                onChange={(e) => setNewRecurring(prev => ({ ...prev, note: e.target.value }))}
                placeholder="Ex: Netflix Premium"
              />
            </label>

            <div className="form-buttons">
              <button onClick={addRecurring} style={{ background: 'var(--success)', color: 'white' }}>
                {editingId ? 'Atualizar RecorrÃªncia' : '+ Adicionar RecorrÃªncia'}
              </button>
              {editingId && (
                <button
                  onClick={() => {
                    setEditingId(null)
                    setNewRecurring({
                      type: 'expense',
                      amount: 0,
                      category: '',
                      note: '',
                      recurrenceType: 'monthly',
                      startDate: toLocalISODate(),
                      endDate: '',
                      isActive: true
                    })
                  }}
                  className="cancel-btn"
                >
                  Cancelar EdiÃ§Ã£o
                </button>
              )}
            </div>
          </div>

          {/* Lista de recorrÃªncias */}
          <div className="custom-categories-list">
            <h4>RecorrÃªncias Ativas</h4>

            {recurringTransactions.length === 0 ? (
              <div className="empty-state">
                <p>Nenhuma recorrÃªncia cadastrada.</p>
                <p>ðŸ’¡ Cadastre assinaturas, salÃ¡rios fixos e outras transaÃ§Ãµes que se repetem automaticamente!</p>
              </div>
            ) : (
              recurringTransactions.map((recurring) => (
                <div key={recurring.id} className="category-item">
                  <div className="category-info">
                    <strong>
                      {recurring.type === 'expense' ? 'ðŸ’¸' : 'ðŸ’°'} {recurring.category}
                      {!recurring.isActive && <span style={{ color: 'var(--text-weak)', fontSize: '0.8rem' }}> (Inativa)</span>}
                    </strong>
                    <small>
                      {getRecurrenceIcon(recurring.recurrenceType)} {getRecurrenceLabel(recurring.recurrenceType)} â€¢
                      R$ {recurring.amount.toFixed(2)} â€¢
                      InÃ­cio: {formatLocalDate(recurring.startDate)}
                      {recurring.endDate && ` â€¢ Fim: ${formatLocalDate(recurring.endDate)}`}
                    </small>
                    {recurring.note && (
                      <small style={{ display: 'block', marginTop: '0.25rem', fontStyle: 'italic' }}>
                        {recurring.note}
                      </small>
                    )}
                  </div>
                  <div className="category-actions">
                    <button
                      onClick={() => toggleActive(recurring.id)}
                      style={{
                        background: recurring.isActive ? 'var(--success)' : 'var(--text-weak)',
                        color: 'white',
                        border: 'none',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.8rem'
                      }}
                      title={recurring.isActive ? 'Desativar' : 'Ativar'}
                    >
                      {recurring.isActive ? 'âœ…' : 'â¸ï¸'}
                    </button>
                    <button onClick={() => editRecurring(recurring)} className="edit-btn" title="Editar">âœï¸</button>
                    <button onClick={() => deleteRecurring(recurring.id)} className="delete-btn" title="Excluir">ðŸ—‘ï¸</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="category-manager-footer">
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-medium)' }}>
            ðŸ”„ As recorrÃªncias geram transaÃ§Ãµes automaticamente todos os dias!
          </p>
        </div>
      </div>
    </div>
  )
}

