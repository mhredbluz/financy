export interface ReceiptParseResult {
  date?: string
  amount?: number
  merchant?: string
  rawText: string
}

const datePatterns = [
  /\b(\d{2})[\/\-](\d{2})[\/\-](\d{4})\b/,
  /\b(\d{4})[\/\-](\d{2})[\/\-](\d{2})\b/,
]

const amountPatterns = [
  /R\$\s*([\d.]+,[\d]{2})/,
  /\b([\d.]+,[\d]{2})\b/,
  /\b([\d]+(?:\.[\d]{2}))\b/,
]

function normalizeAmount(raw: string): number | null {
  if (!raw) return null
  const cleaned = raw.replace(/\./g, '').replace(',', '.')
  const value = Number(cleaned)
  return Number.isFinite(value) ? value : null
}

function normalizeDate(match: RegExpExecArray): string | null {
  if (!match) return null
  if (match[0].includes('/')) {
    if (match[1].length === 4) {
      // yyyy/mm/dd
      return `${match[1]}-${match[2]}-${match[3]}`
    }
    // dd/mm/yyyy
    return `${match[3]}-${match[2]}-${match[1]}`
  }
  if (match[0].includes('-')) {
    if (match[1].length === 4) {
      return `${match[1]}-${match[2]}-${match[3]}`
    }
    return `${match[3]}-${match[2]}-${match[1]}`
  }
  return null
}

export function parseReceiptText(rawText: string): ReceiptParseResult {
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  let date: string | undefined
  for (const pattern of datePatterns) {
    const match = pattern.exec(rawText)
    if (match) {
      const normalized = normalizeDate(match)
      if (normalized) {
        date = normalized
        break
      }
    }
  }

  let amount: number | undefined
  for (const pattern of amountPatterns) {
    const match = pattern.exec(rawText)
    if (match) {
      const parsed = normalizeAmount(match[1])
      if (parsed !== null) {
        amount = parsed
        break
      }
    }
  }

  const merchant = lines.find((line) => /[a-zA-ZÀ-ÿ]{3,}/.test(line))

  return { date, amount, merchant, rawText }
}
