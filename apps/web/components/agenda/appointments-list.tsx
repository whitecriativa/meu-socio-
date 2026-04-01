'use client'

import { useState, useTransition } from 'react'
import { Clock, Scissors, DollarSign, Calendar, CheckCircle, XCircle, CheckCheck } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { atualizarStatusAgendamento } from '@/app/(dashboard)/agenda/actions'
import type { Appointment, AppointmentStatus } from './types'

interface AppointmentsListProps {
  date: string
  appointments: Appointment[]
}

const STATUS_STYLES: Record<AppointmentStatus, { badge: string; bar: string; label: string }> = {
  confirmado: { badge: 'bg-[#52D68A]/15 text-[#1a9e5c]',  bar: '#52D68A', label: 'Confirmado' },
  concluido:  { badge: 'bg-gray-100 text-gray-500',         bar: '#9ca3af', label: 'Concluído'  },
  pendente:   { badge: 'bg-amber-50 text-amber-600',        bar: '#fbbf24', label: 'Pendente'   },
  cancelado:  { badge: 'bg-red-50 text-red-500',            bar: '#f87171', label: 'Cancelado'  },
}

const AVATAR_COLORS = ['#5B3FD4', '#52D68A', '#a78bfa', '#34d399', '#818cf8']

// Actions disponíveis para cada status
const NEXT_ACTIONS: Record<AppointmentStatus, { label: string; next: AppointmentStatus; icon: React.ReactNode; color: string }[]> = {
  pendente:   [
    { label: 'Confirmar',  next: 'confirmado', icon: <CheckCircle className="w-3 h-3" />,  color: 'text-[#1a9e5c] hover:bg-[#52D68A]/10' },
    { label: 'Cancelar',   next: 'cancelado',  icon: <XCircle className="w-3 h-3" />,      color: 'text-red-500 hover:bg-red-50' },
  ],
  confirmado: [
    { label: 'Concluído',  next: 'concluido',  icon: <CheckCheck className="w-3 h-3" />,   color: 'text-[#5B3FD4] hover:bg-[#5B3FD4]/10' },
    { label: 'Cancelar',   next: 'cancelado',  icon: <XCircle className="w-3 h-3" />,      color: 'text-red-500 hover:bg-red-50' },
  ],
  concluido:  [],
  cancelado:  [
    { label: 'Reabrir',    next: 'pendente',   icon: <CheckCircle className="w-3 h-3" />,  color: 'text-amber-600 hover:bg-amber-50' },
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

function AptCard({ apt, index }: { apt: Appointment; index: number }) {
  const [status, setStatus] = useState<AppointmentStatus>(apt.status)
  const [, startTransition] = useTransition()

  const s = STATUS_STYLES[status]
  const actions = NEXT_ACTIONS[status]

  function handleAction(next: AppointmentStatus) {
    setStatus(next)
    startTransition(() => { atualizarStatusAgendamento(apt.id, next) })
  }

  return (
    <div className="flex items-start gap-3 p-3 rounded-xl border border-gray-50 hover:border-gray-100 transition-colors relative overflow-hidden">
      {/* Barra lateral de status */}
      <div
        className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-xl"
        style={{ backgroundColor: s.bar }}
      />

      {/* Avatar */}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
        style={{ backgroundColor: AVATAR_COLORS[index % AVATAR_COLORS.length] }}
      >
        {apt.client_name.charAt(0)}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <p className="text-sm font-semibold text-gray-900 truncate">{apt.client_name}</p>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${s.badge}`}>
            {s.label}
          </span>
        </div>
        <p className="text-xs text-gray-500 flex items-center gap-1 truncate">
          <Scissors className="w-3 h-3 flex-shrink-0" />
          {apt.service}
        </p>
        <div className="flex items-center gap-3 mt-1.5">
          <span className="text-xs text-[#5B3FD4] font-semibold flex items-center gap-0.5">
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

        {/* Botões de ação */}
        {actions.length > 0 && (
          <div className="flex items-center gap-1.5 mt-2">
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
          </div>
        )}
      </div>
    </div>
  )
}

export function AppointmentsList({ date, appointments }: AppointmentsListProps) {
  const today = new Date().toISOString().slice(0, 10)
  const isToday = date === today
  const label = isToday ? 'Hoje' : formatDate(date)

  const totalRevenue = appointments
    .filter((a) => a.status !== 'cancelado')
    .reduce((s, a) => s + a.price, 0)

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-sm font-semibold text-gray-800 capitalize">
            <Calendar className="w-3.5 h-3.5 text-[#5B3FD4]" />
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
                <AptCard key={apt.id} apt={apt} index={i} />
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
