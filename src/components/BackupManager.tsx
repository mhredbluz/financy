import { useState, useEffect } from 'react'
import { loadAppData, saveAppData, getBackupHistory, restoreBackup, clearBackupHistory, importAppData, prepareTransactionsCSV } from '../storage'
import type { BackupSnapshot } from '../types'

interface BackupManagerProps {
  onClose: () => void
  formatCurrency: (value: number) => string
}

export default function BackupManager({ onClose, formatCurrency }: BackupManagerProps) {
  const [backups, setBackups] = useState<BackupSnapshot[]>([])
  const [importRaw, setImportRaw] = useState('')
  const [importFeedback, setImportFeedback] = useState('')

  useEffect(() => {
    setBackups(getBackupHistory())
  }, [])

  const handleManualBackup = () => {
    const current = loadAppData()
    saveAppData(current)
    setBackups(getBackupHistory())
  }

  const handleRestore = (backupId: string) => {
    const success = restoreBackup(backupId)
    if (success) {
      setBackups(getBackupHistory())
      onClose()
      window.location.reload()
    }
  }

  const handleExportCSV = () => {
    const data = loadAppData()
    const csvText = prepareTransactionsCSV(data)
    const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `financy-transacoes-${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleExportPDF = () => {
    const db = loadAppData()
    const rows = db.transactions.map((tx) => `
      <tr>
        <td>${tx.date}</td>
        <td>${tx.type}</td>
        <td>${formatCurrency(tx.amount)}</td>
        <td>${tx.category}</td>
        <td>${tx.note || ''}</td>
      </tr>
    `).join('')

    const html = `
      <html><head><title>Relatório Financeiro</title><style>
      body { font-family: Inter, system-ui, sans-serif; color: #0F172A; }
      table { width: 100%; border-collapse: collapse; }
      td, th { border: 1px solid #CBD5F5; padding: 0.55rem; }
      th { background: #E2E8F0; }
      </style></head>
      <body>
        <h1>Relatório Financeiro</h1>
        <p>Gerado em ${new Date().toLocaleString('pt-BR')}</p>
        <table>
          <thead>
            <tr><th>Data</th><th>Tipo</th><th>Valor</th><th>Categoria</th><th>Nota</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </body></html>
    `

    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(html)
    win.document.close()
    win.print()
  }

  const handleImport = () => {
    const result = importAppData(importRaw)
    setImportFeedback(result.message)
    if (result.success) {
      setImportRaw('')
      setTimeout(() => setImportFeedback(''), 3000)
      onClose()
      window.location.reload()
    }
  }

  const handleClearHistory = () => {
    clearBackupHistory()
    setBackups([])
  }

  const totalTransactions = loadAppData().transactions.length
  const totalBackupCount = backups.length

  return (
    <div className="category-manager-overlay">
      <div className="category-manager" style={{ maxWidth: '700px' }}>
        <div className="category-manager-header">
          <div>
            <h3>💾 Exportação / Backup</h3>
            <small style={{ fontSize: '0.8rem', color: 'var(--text-weak)' }}>
              Exportar CSV/PDF, backups automáticos e restauração
            </small>
          </div>
          <button onClick={onClose} className="close-btn">✕</button>
        </div>

        <div className="category-manager-content">
          <div style={{ marginBottom: '1rem', background: 'rgba(30, 41, 59, 0.45)', borderRadius: '8px', padding: '1rem' }}>
            <strong>Dados atuais:</strong> {totalTransactions} transações, {totalBackupCount} backups salvos
          </div>

          <div className="form-buttons" style={{ marginBottom: '1rem' }}>
            <button style={{ background: 'var(--primary)', color: '#fff' }} type="button" onClick={handleExportCSV}>Exportar CSV</button>
            <button style={{ background: 'var(--warning)', color: '#fff' }} type="button" onClick={handleExportPDF}>Exportar PDF</button>
            <button style={{ background: 'var(--success)', color: '#fff' }} type="button" onClick={handleManualBackup}>Criar Backup Agora</button>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <h4>Importação de dados externos (JSON)</h4>
            <textarea
              value={importRaw}
              onChange={(e) => setImportRaw(e.target.value)}
              placeholder='Cole JSON do app aqui (ex: {"transactions": [...], "budget": {...}})'
              style={{ width: '100%', minHeight: '120px', background: 'var(--surface)', color: 'var(--text-strong)', border: '1px solid var(--border)', borderRadius: '6px', padding: '0.75rem' }}
            />
            <button
              type="button"
              onClick={handleImport}
              style={{ marginTop: '0.5rem', background: 'var(--primary)', color: '#fff' }}
            >
              Importar JSON
            </button>
            {importFeedback && <p style={{ marginTop: '0.5rem', color: 'var(--text-strong)' }}>{importFeedback}</p>}
          </div>

          <section style={{ marginBottom: '1rem' }}>
            <h4>Histórico de Backups</h4>
            {backups.length === 0 ? (
              <p style={{ color: 'var(--text-weak)' }}>Nenhum backup disponível.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {backups.map((backup) => (
                  <li key={backup.id} style={{ marginBottom: '0.5rem', background: 'rgba(30, 41, 59, 0.25)', border: '1px solid var(--border)', borderRadius: '6px', padding: '0.6rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>
                      {new Date(backup.timestamp).toLocaleString('pt-BR')} {backup.label ? `- ${backup.label}` : ''}
                    </span>
                    <button
                      type='button'
                      onClick={() => handleRestore(backup.id)}
                      style={{ background: 'var(--danger)', color: '#fff', border: 'none', borderRadius: '4px', padding: '0.35rem 0.65rem' }}
                    >
                      Restaurar
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {backups.length > 0 && (
              <button style={{ marginTop: '0.4rem', background: 'var(--text-weak)', color: '#fff' }} type='button' onClick={handleClearHistory}>Limpar Histórico</button>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
