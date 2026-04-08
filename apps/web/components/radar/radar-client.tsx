'use client'

import { useState, useTransition } from 'react'
import { Radio, MessageCircle, Clock, Star, UserPlus, RefreshCw, Bell, BellOff } from 'lucide-react'
import type { UnansweredConv } from '@/app/(dashboard)/radar/page'
import { saveRadarSettings } from '@/app/(dashboard)/radar/actions'

interface Props {
  userId: string
  conversations: UnansweredConv[]
  radarEnabled: boolean
  alertMinutes: number
}

const TYPE_CONFIG = {
  novo_lead:  { label: 'Novo Lead',   color: '#0F40CB', bg: '#EEF2FF', icon: UserPlus },
  recorrente: { label: 'Recorrente',  color: '#2D6A4F', bg: '#ECFDF5', icon: RefreshCw },
  vip:        { label: 'VIP',         color: '#B45309', bg: '#FEF3C7', icon: Star },
}

function formatPhone(phone: string) {
  const digits = phone.replace(/\D/g, '').replace(/^55/, '')
  if (digits.length === 11) return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}`
  if (digits.length === 10) return `(${digits.slice(0,2)}) ${digits.slice(2,6)}-${digits.slice(6)}`
  return phone
}

function formatTime(minutesAgo: number) {
  if (minutesAgo < 60) return `${minutesAgo} min atrás`
  const h = Math.floor(minutesAgo / 60)
  const m = minutesAgo % 60
  if (h < 24) return `${h}h${m > 0 ? ` ${m}min` : ''} atrás`
  return `${Math.floor(h / 24)} dia(s) atrás`
}

function whatsappUrl(phone: string, clientName: string | null) {
  const digits = phone.replace(/\D/g, '')
  const text = clientName
    ? encodeURIComponent(`Oi ${clientName}, tudo bem?`)
    : encodeURIComponent('Oi, tudo bem?')
  return `https://wa.me/${digits}?text=${text}`
}

export function RadarClient({ userId, conversations, radarEnabled: initialEnabled, alertMinutes: initialMinutes }: Props) {
  const [enabled,  setEnabled]  = useState(initialEnabled)
  const [minutes,  setMinutes]  = useState(String(initialMinutes))
  const [saved,    setSaved]    = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    startTransition(async () => {
      await saveRadarSettings(userId, enabled, parseInt(minutes, 10) || 30)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#EEF2FF' }}>
          <Radio className="w-5 h-5" style={{ color: '#0F40CB' }} />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Sócio Radar</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Conversas sem resposta no WhatsApp</p>
        </div>
      </div>

      {/* Configurações */}
      <div
        className="rounded-2xl p-4 border space-y-3"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Configurações</p>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Radar ativo</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Monitorar mensagens sem resposta</p>
          </div>
          <button
            onClick={() => setEnabled((v) => !v)}
            className="w-11 h-6 rounded-full transition-colors relative"
            style={{ backgroundColor: enabled ? '#0F40CB' : 'var(--border)' }}
          >
            <span
              className="absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all"
              style={{ left: enabled ? '1.375rem' : '0.25rem' }}
            />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm flex-1" style={{ color: 'var(--text-primary)' }}>
            Alertar após (minutos sem resposta)
          </label>
          <input
            type="number"
            min={5}
            max={1440}
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            className="w-20 px-2 py-1 rounded-lg border text-sm text-center"
            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)' }}
          />
        </div>

        <button
          onClick={handleSave}
          disabled={isPending}
          className="w-full py-2 rounded-xl text-sm font-semibold transition-colors"
          style={{ backgroundColor: saved ? '#2D6A4F' : '#0F40CB', color: '#fff' }}
        >
          {isPending ? 'Salvando…' : saved ? 'Salvo!' : 'Salvar configurações'}
        </button>
      </div>

      {/* Lista de conversas */}
      {!enabled ? (
        <div className="flex flex-col items-center gap-2 py-12">
          <BellOff className="w-10 h-10" style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Radar desativado</p>
        </div>
      ) : conversations.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12">
          <Bell className="w-10 h-10" style={{ color: '#2D6A4F' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Tudo em dia!</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Nenhuma conversa sem resposta há mais de {initialMinutes} min</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            {conversations.length} conversa{conversations.length > 1 ? 's' : ''} aguardando resposta
          </p>

          {conversations.map((conv) => {
            const cfg = TYPE_CONFIG[conv.clientType]
            const TypeIcon = cfg.icon
            return (
              <div
                key={conv.phone}
                className="rounded-2xl p-4 border flex flex-col gap-2"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                      {conv.clientName ?? formatPhone(conv.phone)}
                    </p>
                    {conv.clientName && (
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatPhone(conv.phone)}</p>
                    )}
                  </div>

                  <span
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold flex-shrink-0"
                    style={{ backgroundColor: cfg.bg, color: cfg.color }}
                  >
                    <TypeIcon className="w-3 h-3" />
                    {cfg.label}
                  </span>
                </div>

                <p
                  className="text-sm line-clamp-2"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {conv.lastMessage}
                </p>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <Clock className="w-3 h-3" />
                    {formatTime(conv.minutesAgo)}
                  </span>

                  <a
                    href={whatsappUrl(conv.phone, conv.clientName)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors"
                    style={{ backgroundColor: '#25D366', color: '#fff' }}
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    Responder
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
