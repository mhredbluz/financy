export interface CategorySummaryItemDTO {
  categoria: string
  total: number
  origem?: 'REAL' | 'PREVISTO'
}

export interface AnalyticsDTO {
  byCategoryReal: CategorySummaryItemDTO[]
  byCategoryPlanned: CategorySummaryItemDTO[]
  streakDiasDentro: number
  diasEstourados: number
}
