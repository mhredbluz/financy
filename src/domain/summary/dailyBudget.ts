import type { DayStatus } from './types'

export interface DailyBudgetInput {
  baseMensal: number
  despesasConsumidas: number
  diasRestantes: number
  gastoHoje: number
  gastoOntem: number
  carryOverMode: 'off' | 'daily_simple'
}

export interface DailyBudgetResult {
  baseRestante: number
  orcamentoDiario: number
  orcamentoHoje: number
  diferencaOntem: number
  diferencaHoje: number
  statusDia: DayStatus
}

export function calcDailyBudget(input: DailyBudgetInput): DailyBudgetResult {
  const baseRestante = input.baseMensal - input.despesasConsumidas
  const diasValidos = Math.max(0, input.diasRestantes)

  const orcamentoDiario = baseRestante > 0 && diasValidos > 0 ? baseRestante / diasValidos : 0
  const diferencaOntem = orcamentoDiario - input.gastoOntem

  const carry =
    input.carryOverMode === 'daily_simple' ? Math.max(0, diferencaOntem) : 0

  const orcamentoHoje = baseRestante > 0 ? orcamentoDiario + carry : 0
  const diferencaHoje = orcamentoHoje - input.gastoHoje

  let statusDia: DayStatus = 'DENTRO'
  if (baseRestante <= 0) {
    statusDia = 'BLOQUEADO'
  } else if (input.gastoHoje > orcamentoHoje) {
    statusDia = 'ESTOURO'
  } else if (orcamentoHoje > 0 && input.gastoHoje >= orcamentoHoje * 0.85) {
    statusDia = 'PERTO_DO_LIMITE'
  }

  return { baseRestante, orcamentoDiario, orcamentoHoje, diferencaOntem, diferencaHoje, statusDia }
}
