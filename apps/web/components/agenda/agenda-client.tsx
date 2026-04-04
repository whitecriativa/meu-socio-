'use client'

import { useState } from 'react'
import { Calendar } from './calendar'
import { AppointmentsList } from './appointments-list'
import { NovoAgendamentoModal } from './novo-agendamento-modal'
import type { Appointment, AppointmentStatus } from './types'

interface AgendaClientProps {
  appointments: Appointment[]
  initialDate: string   // 'YYYY-MM-DD'
}

export function AgendaClient({ appointments, initialDate }: AgendaClientProps) {
  const [selected, setSelected] = useState(initialDate)
  const [navYear,  setNavYear]  = useState(() => Number(initialDate.slice(0, 4)))
  const [navMonth, setNavMonth] = useState(() => Number(initialDate.slice(5, 7)) - 1)

  // Mapa: 'YYYY-MM-DD' → statuses presentes (para os dots do calendário)
  const dotMap: Record<string, AppointmentStatus[]> = {}
  for (const apt of appointments) {
    const list = dotMap[apt.date] ?? []
    dotMap[apt.date] = list
    if (!list.includes(apt.status)) list.push(apt.status)
  }

  const dayAppointments = appointments.filter((a) => a.date === selected)

  // Resumo do mês visível
  const monthStr = `${navYear}-${String(navMonth + 1).padStart(2, '0')}`
  const monthApts = appointments.filter((a) => a.date.startsWith(monthStr))
  const confirmed = monthApts.filter((a) => a.status === 'confirmado' || a.status === 'concluido').length
  const pending   = monthApts.filter((a) => a.status === 'pendente').length

  function prevMonth() {
    if (navMonth === 0) { setNavYear((y) => y - 1); setNavMonth(11) }
    else setNavMonth((m) => m - 1)
  }
  function nextMonth() {
    if (navMonth === 11) { setNavYear((y) => y + 1); setNavMonth(0) }
    else setNavMonth((m) => m + 1)
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Agenda</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {confirmed} confirmado{confirmed !== 1 ? 's' : ''}
            {pending > 0 && ` · ${pending} pendente${pending !== 1 ? 's' : ''}`}
            {' '}este mês
          </p>
        </div>
        <NovoAgendamentoModal />
      </div>

      {/* Calendário + Lista lado a lado no desktop */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Calendar
            year={navYear}
            month={navMonth}
            selected={selected}
            dotMap={dotMap}
            onSelect={setSelected}
            onPrev={prevMonth}
            onNext={nextMonth}
          />
        </div>
        <div className="lg:col-span-3">
          <AppointmentsList key={selected} date={selected} appointments={dayAppointments} />
        </div>
      </div>
    </div>
  )
}
