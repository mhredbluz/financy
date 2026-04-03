import { useState, useEffect } from 'react'
import type { RecurringTransaction, RecurrenceType, TransactionType } from '../types'

interface RecurringManagerProps {
  onClose: () => void
}

export default function RecurringManager({ onClose }: RecurringManagerProps) {
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>(() => {
    const saved = localStorage.getItem('financy-recurring-transactions')
    return saved ? JSON.parse(saved) : []
  })

  const [newRecurring, setNewRecurring] = useState({
    type: 'expense' as TransactionType,
    amount: 0,
    category: '',
    note: '',
    recurrenceType: 'monthly' as RecurrenceType,
    startDate: new Date().toISOString().slice(0, 10),
    endDate: '',
    isActive: true
  })

  const [editingId, setEditingId] = useState<string | null>(null)

  // Salvar recorrências no localStorage
  useEffect(() => {
    localStorage.setItem('financy-recurring-transactions', JSON.stringify(recurringTransactions))
  }, [recurringTransactions])

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
      // Editando recorrência existente
      setRecurringTransactions(recurringTransactions.map(r => r.id === editingId ? recurring : r))
      setEditingId(null)
    } else {
      // Adicionando nova recorrência
      setRecurringTransactions([...recurringTransactions, recurring])
    }

    // Resetar formulário
    setNewRecurring({
      type: 'expense',
      amount: 0,
      category: '',
      note: '',
      recurrenceType: 'monthly',
      startDate: new Date().toISOString().slice(0, 10),
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
    if (confirm('Tem certeza que deseja excluir esta recorrência? Todas as transações futuras geradas por ela também serão removidas.')) {
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
      case 'daily': return 'Diária'
      case 'weekly': return 'Semanal'
      case 'monthly': return 'Mensal'
      case 'yearly': return 'Anual'
      default: return type
    }
  }

  const getRecurrenceIcon = (type: RecurrenceType) => {
    switch (type) {
      case 'daily': return '📅'
      case 'weekly': return '📊'
      case 'monthly': return '🗓️'
      case 'yearly': return '🎯'
      default: return '🔄'
    }
  }

  return (
    <div className="category-manager-overlay">
      <div className="category-manager">
        <div className="category-manager-header">
          <div>
            <h3>Gerenciar Transações Recorrentes</h3>
            <small style={{ fontSize: '0.8rem', color: 'var(--text-weak)' }}>
              💡 Pressione Esc para fechar
            </small>
          </div>
          <button onClick={onClose} className="close-btn">✕</button>
        </div>

        <div className="category-manager-content">
          {/* Formulário para adicionar/editar recorrência */}
          <div className="add-category-form">
            <h4>{editingId ? 'Editar Recorrência' : 'Adicionar Nova Recorrência'}</h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <label>
                Tipo
                <select
                  value={newRecurring.type}
                  onChange={(e) => setNewRecurring(prev => ({ ...prev, type: e.target.value as TransactionType }))}
                >
                  <option value="expense">💸 Despesa</option>
                  <option value="income">💰 Receita</option>
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
                Frequência
                <select
                  value={newRecurring.recurrenceType}
                  onChange={(e) => setNewRecurring(prev => ({ ...prev, recurrenceType: e.target.value as RecurrenceType }))}
                >
                  <option value="daily">📅 Diária</option>
                  <option value="weekly">📊 Semanal</option>
                  <option value="monthly">🗓️ Mensal</option>
                  <option value="yearly">🎯 Anual</option>
                </select>
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <label>
                Data de Início
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
              Descrição
              <input
                type="text"
                value={newRecurring.note}
                onChange={(e) => setNewRecurring(prev => ({ ...prev, note: e.target.value }))}
                placeholder="Ex: Netflix Premium"
              />
            </label>

            <div className="form-buttons">
              <button onClick={addRecurring} style={{ background: 'var(--success)', color: 'white' }}>
                {editingId ? 'Atualizar Recorrência' : '+ Adicionar Recorrência'}
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
                      startDate: new Date().toISOString().slice(0, 10),
                      endDate: '',
                      isActive: true
                    })
                  }}
                  className="cancel-btn"
                >
                  Cancelar Edição
                </button>
              )}
            </div>
          </div>

          {/* Lista de recorrências */}
          <div className="custom-categories-list">
            <h4>Recorrências Ativas</h4>

            {recurringTransactions.length === 0 ? (
              <div className="empty-state">
                <p>Nenhuma recorrência cadastrada.</p>
                <p>💡 Cadastre assinaturas, salários fixos e outras transações que se repetem automaticamente!</p>
              </div>
            ) : (
              recurringTransactions.map((recurring) => (
                <div key={recurring.id} className="category-item">
                  <div className="category-info">
                    <strong>
                      {recurring.type === 'expense' ? '💸' : '💰'} {recurring.category}
                      {!recurring.isActive && <span style={{ color: 'var(--text-weak)', fontSize: '0.8rem' }}> (Inativa)</span>}
                    </strong>
                    <small>
                      {getRecurrenceIcon(recurring.recurrenceType)} {getRecurrenceLabel(recurring.recurrenceType)} •
                      R$ {recurring.amount.toFixed(2)} •
                      Início: {new Date(recurring.startDate).toLocaleDateString('pt-BR')}
                      {recurring.endDate && ` • Fim: ${new Date(recurring.endDate).toLocaleDateString('pt-BR')}`}
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
                      {recurring.isActive ? '✅' : '⏸️'}
                    </button>
                    <button onClick={() => editRecurring(recurring)} className="edit-btn" title="Editar">✏️</button>
                    <button onClick={() => deleteRecurring(recurring.id)} className="delete-btn" title="Excluir">🗑️</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="category-manager-footer">
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-medium)' }}>
            🔄 As recorrências geram transações automaticamente todos os dias!
          </p>
        </div>
      </div>
    </div>
  )
}