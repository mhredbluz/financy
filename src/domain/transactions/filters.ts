import type { Transaction, TransactionType } from '../../types'

export function isConfirmed(tx: Transaction): boolean {
  return tx.status === 'confirmed'
}

export function isPlanned(tx: Transaction): boolean {
  return tx.status === 'planned'
}

export function isActive(tx: Transaction): boolean {
  return tx.status !== 'canceled'
}

export function sumByType(transactions: Transaction[], type: TransactionType): number {
  return transactions
    .filter((tx) => tx.type === type)
    .reduce((sum, tx) => sum + tx.amount, 0)
}

export function splitByStatus(transactions: Transaction[]) {
  const confirmed = transactions.filter((tx) => isConfirmed(tx))
  const planned = transactions.filter((tx) => isPlanned(tx))
  return { confirmed, planned }
}
