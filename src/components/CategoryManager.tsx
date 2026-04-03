import { useState, useEffect } from 'react'
import type { CategoryKeyword } from '../utils/categorySuggester'

interface CategoryManagerProps {
  onClose: () => void
}

export default function CategoryManager({ onClose }: CategoryManagerProps) {
  const [customCategories, setCustomCategories] = useState<CategoryKeyword[]>(() => {
    const saved = localStorage.getItem('financy-custom-categories')
    return saved ? JSON.parse(saved) : []
  })

  const [newCategory, setNewCategory] = useState('')
  const [newKeywords, setNewKeywords] = useState('')
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  // Salvar categorias personalizadas no localStorage
  useEffect(() => {
    localStorage.setItem('financy-custom-categories', JSON.stringify(customCategories))
  }, [customCategories])

  const addCategory = () => {
    if (!newCategory.trim() || !newKeywords.trim()) return

    const keywords = newKeywords.split(',').map(k => k.trim()).filter(k => k.length > 0)

    if (keywords.length === 0) return

    const category: CategoryKeyword = {
      category: newCategory.trim(),
      keywords,
      priority: 10 // Categorias personalizadas têm prioridade alta
    }

    if (editingIndex !== null) {
      // Editando categoria existente
      const updated = [...customCategories]
      updated[editingIndex] = category
      setCustomCategories(updated)
      setEditingIndex(null)
    } else {
      // Adicionando nova categoria
      setCustomCategories([...customCategories, category])
    }

    setNewCategory('')
    setNewKeywords('')
  }

  const editCategory = (index: number) => {
    const category = customCategories[index]
    setNewCategory(category.category)
    setNewKeywords(category.keywords.join(', '))
    setEditingIndex(index)
  }

  const deleteCategory = (index: number) => {
    if (confirm('Tem certeza que deseja excluir esta categoria?')) {
      setCustomCategories(customCategories.filter((_, i) => i !== index))
    }
  }

  const cancelEdit = () => {
    setNewCategory('')
    setNewKeywords('')
    setEditingIndex(null)
  }

  return (
    <div className="category-manager-overlay">
      <div className="category-manager">
        <div className="category-manager-header">
          <h3>Gerenciar Categorias Inteligentes</h3>
          <button onClick={onClose} className="close-btn">✕</button>
        </div>

        <div className="category-manager-content">
          <div className="add-category-form">
            <h4>{editingIndex !== null ? 'Editar Categoria' : 'Adicionar Nova Categoria'}</h4>
            <label>
              Nome da Categoria
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Ex: Streaming, Assinaturas, etc."
              />
            </label>
            <label>
              Palavras-chave (separadas por vírgula)
              <input
                type="text"
                value={newKeywords}
                onChange={(e) => setNewKeywords(e.target.value)}
                placeholder="Ex: netflix, spotify, amazon prime"
              />
            </label>
            <div className="form-buttons">
              <button onClick={addCategory}>
                {editingIndex !== null ? 'Atualizar' : 'Adicionar'}
              </button>
              {editingIndex !== null && (
                <button onClick={cancelEdit} className="cancel-btn">
                  Cancelar
                </button>
              )}
            </div>
          </div>

          <div className="custom-categories-list">
            <h4>Suas Categorias Personalizadas ({customCategories.length})</h4>
            {customCategories.length === 0 ? (
              <p className="empty-state">
                Nenhuma categoria personalizada ainda. Adicione uma acima!
              </p>
            ) : (
              <ul>
                {customCategories.map((cat, index) => (
                  <li key={index} className="category-item">
                    <div className="category-info">
                      <strong>{cat.category}</strong>
                      <small>{cat.keywords.join(', ')}</small>
                    </div>
                    <div className="category-actions">
                      <button onClick={() => editCategory(index)} className="edit-btn">
                        ✏️
                      </button>
                      <button onClick={() => deleteCategory(index)} className="delete-btn">
                        🗑️
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="category-manager-footer">
          <small>
            💡 Dica: Use palavras comuns que aparecem em suas notas fiscais ou recibos
          </small>
        </div>
      </div>
    </div>
  )
}