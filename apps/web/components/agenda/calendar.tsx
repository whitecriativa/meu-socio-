'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import type { AppointmentStatus } from './types'

interface CalendarProps {
  year: number
  month: number             // 0-indexed
  selected: string          // 'YYYY-MM-DD'
  dotMap: Record<string, AppointmentStatus[]>   // date → statuses present
  onSelect: (date: string) => void
  onPrev: () => void
  onNext: () => void
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MONTHS = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
]

const STATUS_COLOR: Record<AppointmentStatus, string> = {
  confirmado: '#B6F273',
  concluido:  '#B6F273',
  pendente:   '#fbbf24',
  cancelado:  '#f87171',
}

function pad(n: number) { return String(n).padStart(2, '0') }

export function Calendar({ year, month, selected, dotMap, onSelect, onPrev, onNext }: CalendarProps) {
  const today = new Date().toISOString().slice(0, 10)

  // Dias do mês
  const firstDay  = new Date(year, month, 1).getDay()   // 0=Dom
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  // Preencher até múltiplo de 7
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <Card>
      <CardContent className="p-4">
        {/* Navegação */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onPrev}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <p className="text-sm font-semibold text-gray-900">
            {MONTHS[month]} {year}
          </p>
          <button
            onClick={onNext}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Cabeçalho dias da semana */}
        <div className="grid grid-cols-7 mb-1">
          {WEEKDAYS.map((d) => (
            <div key={d} className="text-center text-[10px] font-semibold text-gray-400 py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Grade de dias */}
        <div className="grid grid-cols-7 gap-y-1">
          {cells.map((day, i) => {
            if (!day) return <div key={`empty-${i}`} />

            const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`
            const isSelected = dateStr === selected
            const isToday    = dateStr === today
            const dots       = dotMap[dateStr] ?? []

            return (
              <button
                key={dateStr}
                onClick={() => onSelect(dateStr)}
                className={`relative flex flex-col items-center justify-center rounded-xl py-1.5 transition-all text-sm font-medium ${
                  isSelected
                    ? 'bg-[#0F40CB] text-white'
                    : isToday
                    ? 'border border-[#0F40CB] text-[#0F40CB]'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {day}
                {/* Dots de status */}
                {dots.length > 0 && (
                  <div className="flex gap-0.5 mt-0.5">
                    {[...new Set(dots)].slice(0, 3).map((s) => (
                      <span
                        key={s}
                        className="w-1 h-1 rounded-full"
                        style={{
                          backgroundColor: isSelected ? 'rgba(255,255,255,0.8)' : STATUS_COLOR[s],
                        }}
                      />
                    ))}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Legenda */}
        <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-gray-50">
          {Object.entries(STATUS_COLOR).filter(([k]) => k !== 'concluido').map(([status, color]) => (
            <span key={status} className="flex items-center gap-1 text-xs text-gray-500 capitalize">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              {status}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
