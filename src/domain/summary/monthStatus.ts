import type { MonthStatus } from './types'

export interface MonthStatusInput {
  saldoPrevisto: number
  baseMensal: number
  baseRestante: number
  receitaPrevista: number
  despesaPrevista: number
}

export function calcMonthStatus(input: MonthStatusInput): MonthStatus {
  if (input.saldoPrevisto < 0) return 'NEGATIVO'
  if (input.baseMensal > 0 && input.baseRestante < input.baseMensal * 0.1) return 'RISCO'
  if (input.receitaPrevista > 0 && input.despesaPrevista >= input.receitaPrevista * 0.9) return 'ATENCAO'
  return 'SAUDAVEL'
}
