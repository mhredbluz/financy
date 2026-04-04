import { useState } from 'react'
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist'
import { parseReceiptText } from '../utils/receiptParser'
import type { TransactionType } from '../types'

GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

interface ReceiptUploaderProps {
  onApply: (data: { date?: string; amount?: number; note?: string; type?: TransactionType }) => void
}

export default function ReceiptUploader({ onApply }: ReceiptUploaderProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<{ date?: string; amount?: number; note?: string } | null>(null)

  const handleFile = async (file: File) => {
    setError(null)
    setPreview(null)
    setLoading(true)
    try {
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await getDocument({ data: arrayBuffer }).promise
      let fullText = ''
      for (let i = 1; i <= pdf.numPages; i += 1) {
        const page = await pdf.getPage(i)
        const content = await page.getTextContent()
        const text = content.items.map((item: any) => item.str).join(' ')
        fullText += `${text}\n`
      }
      const parsed = parseReceiptText(fullText)
      setPreview({
        date: parsed.date,
        amount: parsed.amount,
        note: parsed.merchant,
      })
    } catch (err) {
      setError('Não foi possível ler este PDF. Tente outro arquivo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="form-card">
      <h2>Importar PDF (rascunho)</h2>
      <p style={{ color: 'var(--text-weak)', marginTop: '0.3rem' }}>
        Leitura simples: tenta extrair data, valor e nome do estabelecimento.
      </p>

      <input
        type="file"
        accept="application/pdf"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
        }}
      />

      {loading && <p>Processando PDF...</p>}
      {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}

      {preview && (
        <div style={{ marginTop: '0.75rem', background: 'var(--surface)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <strong>Prévia:</strong>
          <p>Data: {preview.date || '—'}</p>
          <p>Valor: {preview.amount?.toFixed(2) ?? '—'}</p>
          <p>Nota: {preview.note || '—'}</p>
          <button
            type="button"
            onClick={() => onApply({ date: preview.date, amount: preview.amount, note: preview.note, type: 'expense' })}
            style={{ marginTop: '0.5rem' }}
          >
            Aplicar ao formulário
          </button>
        </div>
      )}
    </section>
  )
}
