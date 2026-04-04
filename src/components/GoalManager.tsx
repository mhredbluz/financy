import { useState } from 'react'
import type { Goal, GoalType } from '../types'
import { addGoal as persistAddGoal, updateGoal as persistUpdateGoal, deleteGoal as persistDeleteGoal, loadAppData } from '../storage'
import { useGoalsContext } from '../context/GoalsContext'

interface GoalManagerProps {
  onClose: () => void
  selectedMonth: string
}

export default function GoalManager({ onClose, selectedMonth }: GoalManagerProps) {
  const { goals, setGoals } = useGoalsContext()

  const [newGoal, setNewGoal] = useState({
    type: 'savings' as GoalType,
    title: '',
    description: '',
    targetAmount: 0,
    category: '',
    deadline: ''
  })

  const [editingId, setEditingId] = useState<string | null>(null)

  // Filtrar metas do mês selecionado
  const currentMonthGoals = goals.filter(goal => goal.month === selectedMonth)

  const handleSaveGoal = () => {
    if (!newGoal.title.trim() || newGoal.targetAmount <= 0) return

    const existing = editingId ? goals.find((g) => g.id === editingId) : undefined
    const goal: Goal = {
      id: existing?.id ?? crypto.randomUUID(),
      type: newGoal.type,
      title: newGoal.title.trim(),
      description: newGoal.description.trim() || undefined,
      targetAmount: newGoal.targetAmount,
      category: newGoal.type === 'category_limit' ? newGoal.category : undefined,
      month: existing?.month ?? selectedMonth,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      deadline: newGoal.deadline || undefined
    }

    if (editingId) {
      // Editando meta existente
      persistUpdateGoal(goal)
      setEditingId(null)
    } else {
      // Adicionando nova meta
      persistAddGoal(goal)
    }

    setGoals(loadAppData().goals ?? [])

    // Resetar formulário
    setNewGoal({
      type: 'savings',
      title: '',
      description: '',
      targetAmount: 0,
      category: '',
      deadline: ''
    })
  }

  const editGoal = (goal: Goal) => {
    setNewGoal({
      type: goal.type,
      title: goal.title,
      description: goal.description || '',
      targetAmount: goal.targetAmount,
      category: goal.category || '',
      deadline: goal.deadline || ''
    })
    setEditingId(goal.id)
  }

  const handleDeleteGoal = (goalId: string) => {
    if (confirm('Tem certeza que deseja excluir esta meta?')) {
      persistDeleteGoal(goalId)
      setGoals(loadAppData().goals ?? [])
    }
  }

  const getGoalTypeLabel = (type: GoalType) => {
    switch (type) {
      case 'savings': return 'Economia'
      case 'category_limit': return 'Limite por Categoria'
      case 'monthly_target': return 'Meta Mensal'
      default: return type
    }
  }

  const getGoalTypeIcon = (type: GoalType) => {
    switch (type) {
      case 'savings': return '💰'
      case 'category_limit': return '📊'
      case 'monthly_target': return '🎯'
      default: return '🎯'
    }
  }

  return (
    <div className="category-manager-overlay">
      <div className="category-manager">
        <div className="category-manager-header">
          <div>
            <h3>Gerenciar Metas e Objetivos</h3>
            <small style={{ fontSize: '0.8rem', color: 'var(--text-weak)' }}>
              💡 Pressione Esc para fechar
            </small>
          </div>
          <button onClick={onClose} className="close-btn">✕</button>
        </div>

        <div className="category-manager-content">
          {/* Formulário para adicionar/editar meta */}
          <div className="add-category-form">
            <h4>{editingId ? 'Editar Meta' : 'Adicionar Nova Meta'}</h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <label>
                Tipo de Meta
                <select
                  value={newGoal.type}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, type: e.target.value as GoalType }))}
                >
                  <option value="savings">💰 Economia</option>
                  <option value="category_limit">📊 Limite por Categoria</option>
                  <option value="monthly_target">🎯 Meta Mensal</option>
                </select>
              </label>

              <label>
                Valor Alvo (R$)
                <input
                  type="number"
                  step="0.01"
                  value={newGoal.targetAmount}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, targetAmount: Number(e.target.value) }))}
                  placeholder="Ex: 500.00"
                />
              </label>
            </div>

            <label>
              Título da Meta
              <input
                type="text"
                value={newGoal.title}
                onChange={(e) => setNewGoal(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: Guardar R$ 500/mês"
              />
            </label>

            <label>
              Descrição (opcional)
              <input
                type="text"
                value={newGoal.description}
                onChange={(e) => setNewGoal(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Detalhes da meta..."
              />
            </label>

            {newGoal.type === 'category_limit' && (
              <label>
                Categoria
                <input
                  type="text"
                  value={newGoal.category}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, category: e.target.value }))}
                  placeholder="Ex: Alimentação"
                />
              </label>
            )}

            <label>
              Prazo (opcional)
              <input
                type="date"
                value={newGoal.deadline}
                onChange={(e) => setNewGoal(prev => ({ ...prev, deadline: e.target.value }))}
              />
            </label>

            <div className="form-buttons">
              <button onClick={handleSaveGoal} style={{ background: 'var(--success)', color: 'white' }}>
                {editingId ? 'Atualizar Meta' : '+ Adicionar Meta'}
              </button>
              {editingId && (
                <button
                  onClick={() => {
                    setEditingId(null)
                    setNewGoal({
                      type: 'savings',
                      title: '',
                      description: '',
                      targetAmount: 0,
                      category: '',
                      deadline: ''
                    })
                  }}
                  className="cancel-btn"
                >
                  Cancelar Edição
                </button>
              )}
            </div>
          </div>

          {/* Lista de metas do mês atual */}
          <div className="custom-categories-list">
            <h4>Metas de {new Date(selectedMonth + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</h4>

            {currentMonthGoals.length === 0 ? (
              <div className="empty-state">
                <p>Nenhuma meta definida para este mês.</p>
                <p>💡 Crie metas para manter o foco nos seus objetivos financeiros!</p>
              </div>
            ) : (
              currentMonthGoals.map((goal) => (
                <div key={goal.id} className="category-item">
                  <div className="category-info">
                    <strong>
                      {getGoalTypeIcon(goal.type)} {goal.title}
                    </strong>
                    <small>
                      {getGoalTypeLabel(goal.type)} • R$ {goal.targetAmount.toFixed(2)}
                      {goal.category && ` • ${goal.category}`}
                      {goal.deadline && ` • Até ${new Date(goal.deadline).toLocaleDateString('pt-BR')}`}
                    </small>
                    {goal.description && (
                      <small style={{ display: 'block', marginTop: '0.25rem', fontStyle: 'italic' }}>
                        {goal.description}
                      </small>
                    )}
                  </div>
                  <div className="category-actions">
                    <button onClick={() => editGoal(goal)} className="edit-btn" title="Editar">✏️</button>
                    <button onClick={() => handleDeleteGoal(goal.id)} className="delete-btn" title="Excluir">🗑️</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="category-manager-footer">
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-medium)' }}>
            🎯 Metas ajudam você a manter o foco nos objetivos financeiros!
          </p>
        </div>
      </div>
    </div>
  )
}
