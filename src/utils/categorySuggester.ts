export interface CategoryKeyword {
  category: string
  keywords: string[]
  priority: number // 1-10, higher = more specific
}

export const categoryKeywords: CategoryKeyword[] = [
  // Alimentação
  {
    category: 'Alimentação',
    keywords: ['mercado', 'supermercado', 'feira', 'hortifruti', 'padaria', 'açougue', 'peixaria', 'laticínios', 'mercearia', 'comida', 'alimento', 'refeição', 'restaurante', 'lanche', 'café', 'suco', 'sorvete', 'doces', 'churrasco', 'pizza', 'hambúrguer', 'sushi', 'japonês', 'italiano', 'chines', 'mexicano'],
    priority: 8
  },
  // Transporte
  {
    category: 'Transporte',
    keywords: ['gasolina', 'combustível', 'posto', 'uber', 'taxi', 'ônibus', 'metrô', 'trem', 'avião', 'passagem', 'estacionamento', 'pedágio', 'multa', 'transito', 'veículo', 'carro', 'moto', 'bicicleta', 'taxi', 'cabify', '99', 'rappi'],
    priority: 9
  },
  // Saúde
  {
    category: 'Saúde',
    keywords: ['farmácia', 'remédio', 'medicamento', 'consulta', 'médico', 'dentista', 'hospital', 'exame', 'laboratório', 'plano de saúde', 'seguro saúde', 'vacina', 'cirurgia', 'fisioterapia', 'psicólogo', 'terapia', 'massagem', 'academia', 'ginástica', 'esporte'],
    priority: 9
  },
  // Educação
  {
    category: 'Educação',
    keywords: ['escola', 'faculdade', 'universidade', 'curso', 'aula', 'professor', 'material', 'livro', 'caderno', 'caneta', 'mochila', 'uniforme', 'mensalidade', 'matrícula', 'certificado', 'diploma', 'treinamento', 'workshop', 'palestra'],
    priority: 8
  },
  // Lazer
  {
    category: 'Lazer',
    keywords: ['cinema', 'teatro', 'show', 'concerto', 'festa', 'bar', 'boate', 'viagem', 'hotel', 'pousada', 'resort', 'praia', 'montanha', 'parque', 'museu', 'shopping', 'loja', 'roupa', 'sapato', 'acessório', 'beleza', 'cabeleireiro', 'manicure', 'pedicure', 'spa', 'massagem'],
    priority: 7
  },
  // Casa
  {
    category: 'Casa',
    keywords: ['aluguel', 'condomínio', 'água', 'luz', 'energia', 'gás', 'internet', 'telefone', 'celular', 'tv', 'cabo', 'netflix', 'spotify', 'amazon', 'mercado livre', 'shopee', 'aliexpress', 'magazine', 'luiza', 'casas bahia', 'extra', 'pão de açúcar', 'carrefour'],
    priority: 8
  },
  // Serviços
  {
    category: 'Serviços',
    keywords: ['manutenção', 'reparo', 'conserto', 'limpeza', 'faxina', 'jardim', 'piscina', 'eletricista', 'encanador', 'pedreiro', 'pintor', 'marceneiro', 'segurança', 'vigilante', 'porteiro', 'zelador', 'advogado', 'contador', 'consultoria'],
    priority: 7
  },
  // Eletrônicos
  {
    category: 'Eletrônicos',
    keywords: ['celular', 'smartphone', 'tablet', 'notebook', 'computador', 'monitor', 'teclado', 'mouse', 'fone', 'headset', 'caixa de som', 'tv', 'smart tv', 'console', 'playstation', 'xbox', 'nintendo', 'game', 'jogo', 'apple', 'samsung', 'motorola', 'xiaomi'],
    priority: 8
  },
  // Vestuário
  {
    category: 'Vestuário',
    keywords: ['roupa', 'camisa', 'calça', 'short', 'saia', 'vestido', 'blusa', 'jaqueta', 'casaco', 'moletom', 'cueca', 'sutiã', 'meia', 'sapato', 'tênis', 'sandália', 'chinelo', 'boné', 'chapéu', 'óculos', 'relógio', 'joia', 'bijuteria'],
    priority: 8
  },
  // Outros
  {
    category: 'Outros',
    keywords: ['outros', 'diversos', 'vários', 'miscelânea'],
    priority: 1
  }
]

export function getAllCategories(): CategoryKeyword[] {
  const customCategories: CategoryKeyword[] = (() => {
    try {
      const saved = localStorage.getItem('financy-custom-categories')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })()

  return [...categoryKeywords, ...customCategories]
}

export function suggestCategory(note: string, type: 'expense' | 'income'): string {
  if (!note || note.trim() === '') return ''

  const noteLower = note.toLowerCase().trim()

  // Para receitas, categorias mais simples
  if (type === 'income') {
    if (noteLower.includes('salário') || noteLower.includes('salario')) return 'Salário'
    if (noteLower.includes('freelance') || noteLower.includes('freela')) return 'Freelance'
    if (noteLower.includes('investimento') || noteLower.includes('dividendo')) return 'Investimentos'
    if (noteLower.includes('aluguel')) return 'Aluguel'
    return 'Outros'
  }

  // Para despesas, usar análise de palavras-chave
  let bestMatch = { category: '', priority: 0, matches: 0 }

  for (const cat of getAllCategories()) {
    let matches = 0
    for (const keyword of cat.keywords) {
      if (noteLower.includes(keyword.toLowerCase())) {
        matches++
      }
    }

    // Calcular score baseado em matches e prioridade
    const score = matches * cat.priority

    if (score > bestMatch.priority * bestMatch.matches) {
      bestMatch = { category: cat.category, priority: cat.priority, matches }
    }
  }

  return bestMatch.category || 'Outros'
}

export function getCategorySuggestions(note: string, type: 'expense' | 'income'): string[] {
  if (!note || note.trim() === '') return []

  const noteLower = note.toLowerCase().trim()
  const suggestions: string[] = []

  if (type === 'income') {
    if (noteLower.includes('salário') || noteLower.includes('salario')) suggestions.push('Salário')
    if (noteLower.includes('freelance') || noteLower.includes('freela')) suggestions.push('Freelance')
    if (noteLower.includes('investimento') || noteLower.includes('dividendo')) suggestions.push('Investimentos')
    if (noteLower.includes('aluguel')) suggestions.push('Aluguel')
    return suggestions.length > 0 ? suggestions : ['Salário', 'Freelance', 'Investimentos', 'Aluguel']
  }

  // Para despesas, retornar top 3 sugestões
  const scoredCategories = getAllCategories()
    .map(cat => {
      let matches = 0
      for (const keyword of cat.keywords) {
        if (noteLower.includes(keyword.toLowerCase())) {
          matches++
        }
      }
      return { category: cat.category, score: matches * cat.priority }
    })
    .filter(cat => cat.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(cat => cat.category)

  return scoredCategories.length > 0 ? scoredCategories : ['Alimentação', 'Transporte', 'Casa']
}