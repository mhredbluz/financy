export function calcSaldoDisponivel(saldo: number, investRate = 0.3): number {
  const rate = Math.min(1, Math.max(0, investRate))
  return saldo * (1 - rate)
}

export function calcLimiteDiarioBase(saldoDisponivel: number, diasRestantes: number): number {
  if (diasRestantes <= 0) return 0
  return saldoDisponivel / diasRestantes
}

export function calcLimiteHoje(limiteDiarioBase: number, diferencaDiaAnterior: number): number {
  return limiteDiarioBase + diferencaDiaAnterior
}
