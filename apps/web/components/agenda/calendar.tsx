'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import type { AppointmentStatus } from './types'

interface CalendarProps {
  year: number
  month: number             // 0-indexed
  selected: string          // 'YYYY-MM-DD'
  dotMap: Record<string, AppointmentStatus[]>   // date → statuses present
  finDotMap?: Record<string, boolean>           // date → has financial commitment
  seasonalDates?: Record<string, string>        // date → label
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

export function Calendar({ year, month, selected, dotMap, finDotMap = {}, seasonalDates = {}, onSelect, onPrev, onNext }: CalendarProps) {
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

  // Datas sazonais do mês ordenadas
  const monthSeasonals = Object.entries(seasonalDates).sort(([a], [b]) => a.localeCompare(b))

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
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
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
            const hasFin     = finDotMap[dateStr] ?? false
            const seasonal   = seasonalDates[dateStr]

            return (
              <button
                key={dateStr}
                onClick={() => onSelect(dateStr)}
                title={seasonal}
                className={`relative flex flex-col items-center justify-center rounded-xl py-1.5 transition-all text-sm font-medium ${
                  isSelected
                    ? 'bg-[#0F40CB] text-white'
                    : isToday
                    ? 'border border-[#0F40CB] text-[#0F40CB]'
                    : 'hover:bg-gray-50'
                }`}
                style={{ color: isSelected ? 'white' : isToday ? '#0F40CB' : 'var(--text-primary)' }}
              >
                {day}
                {/* Dots de status + indicador sazonal */}
                <div className="flex gap-0.5 mt-0.5 items-center">
                  {[...new Set(dots)].slice(0, 3).map((s) => (
                    <span
                      key={s}
                      className="w-1 h-1 rounded-full"
                      style={{
                        backgroundColor: isSelected ? 'rgba(255,255,255,0.8)' : STATUS_COLOR[s],
                      }}
                    />
                  ))}
                  {hasFin && (
                    <span
                      className="w-1 h-1 rounded-full flex-shrink-0"
                      style={{ backgroundColor: isSelected ? 'rgba(255,255,255,0.8)' : '#F4845F' }}
                    />
                  )}
                  {seasonal && (
                    <span
                      className="text-[7px] leading-none"
                      style={{ opacity: isSelected ? 0.9 : 1 }}
                    >
                      ⭐
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* Legenda status */}
        <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
          {Object.entries(STATUS_COLOR).filter(([k]) => k !== 'concluido').map(([status, color]) => (
            <span key={status} className="flex items-center gap-1 text-xs text-gray-500 capitalize">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              {status}
            </span>
          ))}
          <span className="flex items-center gap-1 text-xs text-gray-500">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#F4845F' }} />
            pagamento
          </span>
          <span className="flex items-center gap-1 text-xs text-gray-500">
            ⭐ Data especial
          </span>
        </div>

        {/* Datas sazonais do mês */}
        {monthSeasonals.length > 0 && (
          <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Datas do mês
            </p>
            <div className="flex flex-col gap-1">
              {monthSeasonals.map(([date, label]) => {
                const d = new Date(date + 'T12:00:00')
                const dayNum = d.getDate()
                const weekday = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'][d.getDay()]
                return (
                  <button
                    key={date}
                    onClick={() => onSelect(date)}
                    className="flex items-center gap-2 text-xs rounded-lg px-2 py-1 transition-colors hover:bg-gray-50 text-left"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <span
                      className="text-[10px] font-bold w-8 text-center flex-shrink-0 rounded-md py-0.5"
                      style={{ backgroundColor: '#0F40CB18', color: '#0F40CB' }}
                    >
                      {pad(dayNum)}
                    </span>
                    <span className="text-gray-400 text-[10px] w-6 flex-shrink-0">{weekday}</span>
                    <span className="flex-1">{label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
