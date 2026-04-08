'use client'

import { useState, useTransition } from 'react'
import {
  Clock, Tag, DollarSign, Calendar, CheckCircle,
  XCircle, CheckCheck, Trash2, Star, MessageCircle, X, Phone,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { atualizarStatusAgendamento, excluirAgendamento } from '@/app/(dashboard)/agenda/actions'
import type { Appointment, AppointmentStatus } from './types'

interface AppointmentsListProps {
  date: string
  appointments: Appointment[]
  seasonalLabel?: string | undefined
}

const STATUS_STYLES: Record<AppointmentStatus, { badge: string; bar: string; label: string }> = {
  confirmado: { badge: 'bg-[#B6F273]/15 text-[#0F40CB]', bar: '#B6F273', label: 'Confirmado' },
  concluido:  { badge: 'bg-gray-100 text-gray-500',       bar: '#9ca3af', label: 'Concluído'  },
  pendente:   { badge: 'bg-amber-50 text-amber-600',      bar: '#fbbf24', label: 'Pendente'   },
  cancelado:  { badge: 'bg-red-50 text-red-500',          bar: '#f87171', label: 'Cancelado'  },
}

const AVATAR_COLORS = ['#0F40CB', '#B6F273', '#a78bfa', '#34d399', '#818cf8']

const NEXT_ACTIONS: Record<AppointmentStatus, { label: string; next: AppointmentStatus; icon: React.ReactNode; color: string }[]> = {
  pendente:   [
    { label: 'Confirmar', next: 'confirmado', icon: <CheckCircle className="w-3 h-3" />, color: 'text-[#0F40CB] hover:bg-[#B6F273]/10' },
    { label: 'Cancelar',  next: 'cancelado',  icon: <XCircle className="w-3 h-3" />,    color: 'text-red-500 hover:bg-red-50' },
  ],
  confirmado: [
    { label: 'Concluído', next: 'concluido', icon: <CheckCheck className="w-3 h-3" />, color: 'text-[#0F40CB] hover:bg-[#0F40CB]/10' },
    { label: 'Cancelar',  next: 'cancelado', icon: <XCircle className="w-3 h-3" />,   color: 'text-red-500 hover:bg-red-50' },
  ],
  concluido: [],
  cancelado: [
    { label: 'Reabrir', next: 'pendente', icon: <CheckCircle className="w-3 h-3" />, color: 'text-amber-600 hover:bg-amber-50' },
  ],
}

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

function formatDate(dateStr: string) {
  const parts = dateStr.split('-').map(Number)
  const y = parts[0]!
  const m = parts[1]!
  const d = parts[2]!
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
}

function whatsappUrl(phone: string, clientName: string, service: string, time: string) {
  const digits = phone.replace(/\D/g, '')
  const num    = digits.startsWith('55') ? digits : `55${digits}`
  const msg    = `Olá, ${clientName}! Confirmando seu agendamento de ${service} às ${time}. Qualquer dúvida é só chamar! 😊`
  return `https://wa.me/${num}?text=${encodeURIComponent(msg)}`
}

// Modal de detalhes do agendamento
function AptDetailModal({ apt, onClose }: { apt: Appointment; onClose: () => void }) {
  const [phone, setPhone] = useState(apt.client_phone ?? '')
  const s = STATUS_STYLES[apt.status]

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <p className="text-base font-bold text-gray-900">{apt.client_name}</p>
            <p className="text-xs text-gray-400">{apt.service}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="px-5 pb-5 space-y-3">
          {/* Info */}
          <div className="rounded-xl bg-gray-50 p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-3.5 h-3.5 text-[#0F40CB]" />
              <span>{formatDate(apt.date)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-3.5 h-3.5 text-[#0F40CB]" />
              <span>{apt.time} · {apt.duration_min}min</span>
            </div>
            {apt.price > 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <DollarSign className="w-3.5 h-3.5 text-[#0F40CB]" />
                <span>{fmt(apt.price)}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.badge}`}>{s.label}</span>
            </div>
            {apt.notes_raw && (
              <p className="text-xs text-gray-400 pt-1">{apt.notes_raw}</p>
            )}
          </div>

          {/* WhatsApp */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 flex items-center gap-1">
              <Phone className="w-3 h-3" /> Número do cliente
            </label>
            <div className="flex gap-2">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="11999999999"
                className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#25D366] transition"
              />
              <a
                href={phone ? whatsappUrl(phone, apt.client_name, apt.service, apt.time) : '#'}
                target={phone ? '_blank' : undefined}
                rel="noopener noreferrer"
                onClick={(e) => { if (!phone) e.preventDefault() }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-white transition-opacity"
                style={{ backgroundColor: phone ? '#25D366' : '#D1D5DB' }}
              >
                <MessageCircle className="w-4 h-4" />
                Enviar
              </a>
            </div>
            {phone && (
              <p className="text-[11px] text-gray-400 mt-1.5">
                Vai abrir o WhatsApp com mensagem de confirmação pré-preenchida
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function AptCard({ apt, index, onDelete }: { apt: Appointment; index: number; onDelete: () => void }) {
  const [status, setStatus]       = useState<AppointmentStatus>(apt.status)
  const [phoneInput, setPhoneInput] = useState(apt.client_phone ?? '')
  const [showPhone, setShowPhone] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [, startTransition]       = useTransition()

  const s       = STATUS_STYLES[status]
  const actions = NEXT_ACTIONS[status]
  const displayName = apt.client_name && apt.client_name !== 'Sem nome' ? apt.client_name : '—'

  function handleAction(next: AppointmentStatus) {
    setStatus(next)
    startTransition(() => { atualizarStatusAgendamento(apt.id, next) })
  }

  function handleWhatsApp() {
    if (phoneInput.trim()) {
      const digits = phoneInput.replace(/\D/g, '')
      const num = digits.startsWith('55') ? digits : `55${digits}`
      const msg = `Olá${apt.client_name && apt.client_name !== 'Sem nome' ? `, ${apt.client_name}` : ''}! Confirmo seu agendamento de *${apt.service}* para hoje às *${apt.time}*. Até lá! 😊`
      window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, '_blank')
      setShowPhone(false)
    } else {
      setShowPhone(true)
    }
  }

  return (
    <>
      <div className="flex items-start gap-3 p-3 rounded-xl border border-gray-50 hover:border-gray-100 transition-colors relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-xl" style={{ backgroundColor: s.bar }} />

        {/* Avatar */}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 cursor-pointer"
          style={{ backgroundColor: AVATAR_COLORS[index % AVATAR_COLORS.length] }}
          onClick={() => setDetailOpen(true)}
        >
          {displayName.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <button
              className="text-sm font-semibold text-gray-900 truncate text-left hover:text-[#0F40CB] transition-colors"
              onClick={() => setDetailOpen(true)}
            >
              {displayName}
            </button>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${s.badge}`}>
              {s.label}
            </span>
          </div>

          <p className="text-xs text-gray-500 flex items-center gap-1 truncate">
            <Tag className="w-3 h-3 flex-shrink-0" />
            {apt.service}
          </p>

          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-xs text-[#0F40CB] font-semibold flex items-center gap-0.5">
              <Clock className="w-3 h-3" />
              {apt.time}
            </span>
            <span className="text-xs text-gray-400">{apt.duration_min}min</span>
            {apt.price > 0 && (
              <span className="text-xs text-gray-500 font-medium flex items-center gap-0.5 ml-auto">
                <DollarSign className="w-3 h-3" />
                {fmt(apt.price)}
              </span>
            )}
          </div>

          {/* Input de telefone inline (aparece ao clicar WhatsApp sem número) */}
          {showPhone && (
            <div className="flex items-center gap-2 mt-2">
              <input
                type="tel"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder="DDD + número (ex: 11999999999)"
                autoFocus
                className="flex-1 px-2.5 py-1.5 rounded-lg border border-[#25D366] text-xs outline-none"
              />
              <button
                onClick={handleWhatsApp}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white"
                style={{ backgroundColor: '#25D366' }}
              >
                <MessageCircle className="w-3 h-3" />
                Enviar
              </button>
              <button onClick={() => setShowPhone(false)} className="p-1">
                <X className="w-3 h-3 text-gray-400" />
              </button>
            </div>
          )}

          {/* Botões de ação */}
          {!showPhone && (
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              {actions.map((action) => (
                <button
                  key={action.next}
                  onClick={() => handleAction(action.next)}
                  className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg transition-colors ${action.color}`}
                >
                  {action.icon}
                  {action.label}
                </button>
              ))}
              <button
                onClick={handleWhatsApp}
                className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg ml-auto transition-colors"
                style={{ color: '#25D366' }}
              >
                <MessageCircle className="w-3 h-3" />
                WhatsApp
              </button>
            </div>
          )}
        </div>

        <button
          onClick={onDelete}
          className="absolute top-2 right-2 opacity-0 group-hover/apt:opacity-100 p-1 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400 transition-all"
          title="Excluir agendamento"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {detailOpen && (
        <AptDetailModal apt={{ ...apt, status }} onClose={() => setDetailOpen(false)} />
      )}
    </>
  )
}

export function AppointmentsList({ date, appointments: initialAppointments, seasonalLabel }: AppointmentsListProps) {
  const [appointments, setAppointments] = useState(initialAppointments)
  const [, startTransitionList] = useTransition()
  const today   = new Date().toISOString().slice(0, 10)
  const isToday = date === today
  const label   = isToday ? 'Hoje' : formatDate(date)

  function handleDeleteApt(id: string) {
    setAppointments((prev) => prev.filter((a) => a.id !== id))
    startTransitionList(() => { excluirAgendamento(id) })
  }

  const totalRevenue = appointments
    .filter((a) => a.status !== 'cancelado')
    .reduce((s, a) => s + a.price, 0)

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-sm font-semibold text-gray-800 capitalize">
            <Calendar className="w-3.5 h-3.5 text-[#0F40CB]" />
            {label}
          </span>
          {appointments.length > 0 && (
            <span className="text-xs text-gray-400">
              {fmt(totalRevenue)} esperado
            </span>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 pt-0">
        {seasonalLabel && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 mb-3">
            <Star className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
            <p className="text-xs font-medium text-amber-700">{seasonalLabel}</p>
          </div>
        )}

        {appointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center mb-3">
              <Calendar className="w-5 h-5 text-gray-300" />
            </div>
            <p className="text-sm text-gray-400">Nenhum agendamento para este dia</p>
            <p className="text-xs text-gray-300 mt-1">Clique em "Novo agendamento" para adicionar</p>
          </div>
        ) : (
          <div className="space-y-3">
            {appointments
              .sort((a, b) => a.time.localeCompare(b.time))
              .map((apt, i) => (
                <div key={apt.id} className="group/apt relative">
                  <AptCard
                    apt={apt}
                    index={i}
                    onDelete={() => handleDeleteApt(apt.id)}
                  />
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
