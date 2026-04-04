export interface CardStatementItem {
  date: string
  amount: number
  description: string
}

const dateRegex = /\b(\d{2})[\/\-](\d{2})[\/\-](\d{4})\b/
const amountRegex = /R\$\s*([\d.]+,[\d]{2})|\b([\d.]+,[\d]{2})\b/

function normalizeAmount(raw: string): number | null {
  const cleaned = raw.replace(/\./g, '').replace(',', '.')
  const value = Number(cleaned)
  return Number.isFinite(value) ? value : null
}

export function parseCardStatementText(rawText: string): CardStatementItem[] {
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  const items: CardStatementItem[] = []

  for (const line of lines) {
    const dateMatch = dateRegex.exec(line)
    const amountMatch = amountRegex.exec(line)
    if (!dateMatch || !amountMatch) continue

    const date = `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`
    const amountRaw = amountMatch[1] || amountMatch[2]
    const amount = normalizeAmount(amountRaw)
    if (amount === null) continue

    const description = line
      .replace(dateRegex, '')
      .replace(amountRegex, '')
      .replace(/\s{2,}/g, ' ')
      .trim()

    items.push({ date, amount, description })
  }

  // remove duplicates
  const seen = new Set<string>()
  return items.filter((item) => {
    const key = `${item.date}|${item.amount}|${item.description}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function isNubankStatement(rawText: string): boolean {
  const t = rawText.toLowerCase()
  return t.includes('nubank') || t.includes('nu pagamentos') || t.includes('fatura') && t.includes('nu')
}

const monthMap: Record<string, string> = {
  JAN: '01',
  FEV: '02',
  MAR: '03',
  ABR: '04',
  MAI: '05',
  JUN: '06',
  JUL: '07',
  AGO: '08',
  SET: '09',
  OUT: '10',
  NOV: '11',
  DEZ: '12',
}

function extractYear(rawText: string): string {
  const match = /FATURA\s+\d{2}\s+[A-Z]{3}\s+(\d{4})/.exec(rawText)
  if (match?.[1]) return match[1]
  const fallback = /EMISSÃO E ENVIO\s+\d{2}\s+[A-Z]{3}\s+(\d{4})/.exec(rawText)
  return fallback?.[1] || new Date().getFullYear().toString()
}

export function parseNubankStatementText(rawText: string): CardStatementItem[] {
  const year = extractYear(rawText)
  const dateMatchRegex = /\b(\d{2})\s+(JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ)\b/g
  const amountRegexAll = /[−-]?R\$\s*([\d.]+,[\d]{2})/g

  const normalize = (value: string) =>
    value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

  const normText = normalize(rawText)
  const startMatch = /transacoes/i.exec(normText)
  const startIdx = startMatch ? startMatch.index : -1

  const endCandidates = [
    /em cumprimento/i,
    /valido apenas/i,
    /válido apenas/i,
    /5 de 5/i,
  ]
  let endIdx = -1
  if (startIdx !== -1) {
    for (const rx of endCandidates) {
      const m = rx.exec(normText)
      if (m && m.index > startIdx) {
        endIdx = endIdx === -1 ? m.index : Math.min(endIdx, m.index)
      }
    }
  }

  const block = startIdx !== -1
    ? normText.slice(startIdx, endIdx !== -1 ? endIdx : normText.length)
    : normText

  const badKeywords = [
    'limite', 'fatura', 'pagamento', 'pagamentos', 'rotativo', 'juros',
    'iof', 'mora', 'multa', 'parcel', 'renegocia', 'saldo financiado',
    'total a pagar', 'pagamento mínimo', 'crédito de rotativo', 'pagamentos e financiamentos',
    'saldo em aberto', 'encargos', 'cet', 'parcelamento', 'financiamento',
    'resumo', 'próximas faturas', 'emissão', 'vencimento'
  ]

  const items: CardStatementItem[] = []

  // Prefer line-like matches: DD MON <desc> R$ 0,00
  const lineRegex = /(\d{2})\s+(JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ)\s+(.{3,80}?)\s+R\$\s*([\d.]+,[\d]{2})/g
  let lm: RegExpExecArray | null
  while ((lm = lineRegex.exec(block)) !== null) {
    const day = lm[1]
    const mon = lm[2]
    const descRaw = lm[3].replace(/\s{2,}/g, ' ').trim()
    const amountValue = normalizeAmount(lm[4])
    if (amountValue === null) continue
    const descLower = normalize(descRaw)
    if (badKeywords.some((k) => descLower.includes(normalize(k)))) continue
    if (descRaw.length > 80) continue
    if (amountValue <= 1) continue
    if (!/[a-z]{3,}/i.test(descRaw)) continue
    const monthNum = monthMap[mon]
    const date = `${year}-${monthNum}-${day}`
    items.push({ date, amount: Math.abs(amountValue), description: descRaw })
  }

  // Fallback: segment-based extraction
  if (items.length === 0) {
    const matches: { index: number; day: string; month: string }[] = []
    let m: RegExpExecArray | null
    while ((m = dateMatchRegex.exec(block)) !== null) {
      matches.push({ index: m.index, day: m[1], month: m[2] })
    }

    for (let i = 0; i < matches.length; i += 1) {
      const start = matches[i].index
      const end = i + 1 < matches.length ? matches[i + 1].index : block.length
      const segment = block.slice(start, end)

      const amounts: string[] = []
      let am: RegExpExecArray | null
      while ((am = amountRegexAll.exec(segment)) !== null) {
        amounts.push(am[0])
      }
      if (amounts.length === 0) continue

      const lastAmountRaw = amounts[amounts.length - 1].replace('−', '-')
      const amountValue = normalizeAmount(lastAmountRaw.replace(/[^0-9,.-]/g, ''))
      if (amountValue === null) continue

      const monthNum = monthMap[matches[i].month]
      const date = `${year}-${monthNum}-${matches[i].day}`

      let description = segment
        .replace(dateMatchRegex, '')
        .replace(amountRegexAll, '')
        .replace(/\s{2,}/g, ' ')
        .trim()

      if (description.includes('•')) {
        description = description.split('•')[0].trim()
      }

      const descLower = normalize(description)
      if (badKeywords.some((k) => descLower.includes(normalize(k)))) continue
      if (!description) description = 'Compra'
      if (description.length > 80) continue
      if (amountValue <= 1) continue
      if (!/[a-z]{3,}/i.test(description)) continue

      items.push({ date, amount: Math.abs(amountValue), description })
    }
  }

  const seen = new Set<string>()
  return items.filter((item) => {
    const key = `${item.date}|${item.amount}|${item.description}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
