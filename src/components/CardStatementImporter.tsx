import { useState } from 'react'
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist'
import { parseCardStatementText, parseNubankStatementText, isNubankStatement, type CardStatementItem } from '../utils/cardStatementParser'

GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

interface CardStatementImporterProps {
  onImport: (items: CardStatementItem[]) => void
}

export default function CardStatementImporter({ onImport }: CardStatementImporterProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<CardStatementItem[]>([])
  const [selected, setSelected] = useState<Record<number, boolean>>({})
  const [parserUsed, setParserUsed] = useState<string>('')
  const [debugText, setDebugText] = useState<string>('')
  const [showDebug, setShowDebug] = useState(false)

  const toggleAll = (value: boolean) => {
    const next: Record<number, boolean> = {}
    items.forEach((_, idx) => { next[idx] = value })
    setSelected(next)
  }

  const handleFile = async (file: File) => {
    setError(null)
    setItems([])
    setSelected({})
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
      const isNu = isNubankStatement(fullText)
      let parsed = isNu ? parseNubankStatementText(fullText) : parseCardStatementText(fullText)
      let used = isNu ? 'Nubank' : 'Genérico'

      // Fallback: se o parser Nubank não encontrar itens, tenta o genérico
      if (parsed.length === 0 && isNu) {
        parsed = parseCardStatementText(fullText)
        used = 'Nubank (fallback genérico)'
      }

      setParserUsed(used)
      setItems(parsed)
      setDebugText(fullText.slice(0, 2500))
      const nextSelected: Record<number, boolean> = {}
      parsed.forEach((_, idx) => { nextSelected[idx] = true })
      setSelected(nextSelected)
      if (parsed.length === 0) {
        setError('Não encontrei compras na fatura. Tente outro PDF ou um CSV exportado.')
      }
    } catch {
      setError('Não foi possível ler a fatura. Tente outro PDF.')
    } finally {
      setLoading(false)
    }
  }

  const selectedItems = items.filter((_, idx) => selected[idx])
  const selectedTotal = selectedItems.reduce((sum, item) => sum + item.amount, 0)

  return (
    <section className="form-card card-importer">
      <div className="reports-header">
        <div>
          <h2>Importar Fatura (Cartão)</h2>
          <p className="reports-sub">Leitura simples: procura linhas com data + valor e cria lançamentos de crédito.</p>
        </div>
        <div className="pill">PDF</div>
      </div>

      <div className="uploader">
        <label className="file-drop">
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFile(file)
            }}
          />
          <div>
            <strong>Selecione o PDF</strong>
            <span>Arraste e solte ou clique para escolher</span>
          </div>
        </label>
      </div>

      {loading && <p>Processando fatura...</p>}
      {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}

      {(items.length > 0 || error) && (
        <div style={{ marginTop: '0.75rem' }}>
          {parserUsed && (
            <div style={{ color: 'var(--text-weak)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
              Parser: {parserUsed}
            </div>
          )}
          <button type="button" onClick={() => setShowDebug((v) => !v)} className="ghost-btn">
            {showDebug ? 'Ocultar debug' : 'Mostrar debug'}
          </button>
          {showDebug && (
            <pre style={{ marginTop: '0.5rem', maxHeight: '220px', overflow: 'auto', background: 'rgba(15, 23, 42, 0.5)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', whiteSpace: 'pre-wrap' }}>
              {debugText || 'Sem texto extraído'}
            </pre>
          )}
          <div className="list-actions">
            <button type="button" onClick={() => toggleAll(true)} className="ghost-btn">Selecionar tudo</button>
            <button type="button" onClick={() => toggleAll(false)} className="ghost-btn">Limpar seleção</button>
            <button type="button" onClick={() => onImport(selectedItems)} className="ghost-btn primary" disabled={selectedItems.length === 0}>
              Importar selecionados ({selectedItems.length}) • {selectedTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </button>
          </div>

          <div className="list-table">
            <div className="list-row list-header-row">
              <span>Data</span>
              <span>Descrição</span>
              <span>Valor</span>
              <span>Selecionar</span>
            </div>
            {items.length === 0 ? (
              <div className="list-empty">Nenhum item encontrado.</div>
            ) : items.map((item, idx) => (
              <div key={`${item.date}-${item.amount}-${idx}`} className="list-row">
                <span>{item.date}</span>
                <span>{item.description || 'Compra'}</span>
                <span className="amount">{item.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                <span>
                  <input
                    type="checkbox"
                    checked={!!selected[idx]}
                    onChange={(e) => setSelected((prev) => ({ ...prev, [idx]: e.target.checked }))}
                  />
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
