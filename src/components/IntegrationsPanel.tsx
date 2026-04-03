import { useEffect, useState } from 'react'
import { getIntegrationSettings, setIntegrationSettings } from '../storage'
import type { IntegrationSettings } from '../types'

interface IntegrationsPanelProps {
  onClose: () => void
}

export default function IntegrationsPanel({ onClose }: IntegrationsPanelProps) {
  const [settings, setSettings] = useState<IntegrationSettings>({})
  const [message, setMessage] = useState('')

  useEffect(() => {
    const loaded = getIntegrationSettings()
    setSettings(loaded)
  }, [])

  const handleSave = () => {
    setIntegrationSettings(settings)
    setMessage('Configurações salvas com sucesso!')
    setTimeout(() => setMessage(''), 3000)
  }

  return (
    <div className="category-manager-overlay">
      <div className="category-manager" style={{ maxWidth: '600px' }}>
        <div className="category-manager-header">
          <div>
            <h3>🔌 Integrações externas</h3>
            <small style={{ fontSize: '0.8rem', color: 'var(--text-weak)' }}>
              Conecte Google Calendar e WhatsApp para lembretes e alertas.
            </small>
          </div>
          <button onClick={onClose} className="close-btn">✕</button>
        </div>

        <div className="category-manager-content">
          <label>
            Email do Google Calendar
            <input
              type="email"
              value={settings.googleCalendarEmail || ''}
              onChange={(e) => setSettings((prev) => ({ ...prev, googleCalendarEmail: e.target.value }))}
              placeholder="seu-email@gmail.com"
            />
          </label>
          <label>
            Telefone WhatsApp (com DDI)
            <input
              type="tel"
              value={settings.whatsappNumber || ''}
              onChange={(e) => setSettings((prev) => ({ ...prev, whatsappNumber: e.target.value }))}
              placeholder="5511999998888"
            />
          </label>
          <label>
            API WhatsApp URL
            <input
              type="text"
              value={settings.whatsappApiUrl || ''}
              onChange={(e) => setSettings((prev) => ({ ...prev, whatsappApiUrl: e.target.value }))}
              placeholder="https://api.whatsapp.example/send"
            />
          </label>
          <label>
            Token API WhatsApp
            <input
              type="text"
              value={settings.whatsappApiToken || ''}
              onChange={(e) => setSettings((prev) => ({ ...prev, whatsappApiToken: e.target.value }))}
              placeholder="token-secreto"
            />
          </label>

          <div className="form-buttons" style={{ marginTop: '1rem' }}>
            <button style={{ background: 'var(--success)', color: 'white' }} onClick={handleSave}>
              Salvar Integrações
            </button>
            <button style={{ background: 'var(--text-weak)', color: 'white' }} onClick={onClose}>
              Fechar
            </button>
          </div>

          {message && <p style={{ color: 'var(--success)', marginTop: '0.75rem' }}>{message}</p>}

          <div style={{ marginTop: '1rem', color: 'var(--text-medium)' }}>
            <p>💡 Esta plataforma guarda as configs, mas não envia mensagens por conta própria ainda.</p>
            <p>💡 Para ativar WhatsApp/Google Calendar, você deve rodar um serviço backend ou integrar via Zapier/Integromat usando o endpoint configurado.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
