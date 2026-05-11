export type DayStatus = 'DENTRO' | 'PERTO_DO_LIMITE' | 'ESTOURO' | 'BLOQUEADO'
export type MonthStatus = 'SAUDAVEL' | 'ATENCAO' | 'RISCO' | 'NEGATIVO'

export interface DashboardSummaryDTO {
  month: string
  receitaReal: number
  despesaReal: number
  receitaPrevista: number
  despesaPrevista: number
  saldoReal: number
  saldoPrevisto: number
  savingsRate: number
  baseMensalBruta: number
  reservaInvestimento: number
  baseMensal: number
  baseRestante: number
  diasRestantes: number
  orcamentoDiario: number
  orcamentoHoje: number
  gastoHoje: number
  gastoOntem: number
  diferencaOntem: number
  diferencaHoje: number
  statusDia: DayStatus
  statusMes: MonthStatus
}
