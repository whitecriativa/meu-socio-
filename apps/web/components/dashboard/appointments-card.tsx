'use client'

import { Calendar } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Appointment {
  id: string
  client_name: string
  service: string
  time: string
  status: 'confirmado' | 'aguardando'
}

interface AppointmentsCardProps {
  appointments: Appointment[]
}

const COLORS = ['#5B3FD4', '#52D68A', '#5B3FD4', '#52D68A', '#5B3FD4']
const TEXT_COLORS = ['text-white', 'text-[#5B3FD4]', 'text-white', 'text-[#5B3FD4]', 'text-white']

export function AppointmentsCard({ appointments }: AppointmentsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            Agenda de hoje
          </span>
          <span className="text-xs font-semibold text-[#5B3FD4] bg-[#5B3FD4]/10 px-2 py-0.5 rounded-full">
            {appointments.length} agendamentos
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-1">
        {appointments.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">Nenhum agendamento para hoje</p>
        ) : (
          <div className="space-y-2">
            {appointments.map((apt, i) => (
              <div key={apt.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm font-bold text-[#5B3FD4] tabular-nums w-11 flex-shrink-0">
                  {apt.time}
                </span>
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${TEXT_COLORS[i % TEXT_COLORS.length]}`}
                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
                >
                  {apt.client_name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{apt.client_name}</p>
                  <p className="text-xs text-gray-500 truncate">{apt.service}</p>
                </div>
                <Badge variant={apt.status === 'confirmado' ? 'success' : 'warning'}>
                  {apt.status === 'confirmado' ? 'Confirmado' : 'Aguardando'}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
