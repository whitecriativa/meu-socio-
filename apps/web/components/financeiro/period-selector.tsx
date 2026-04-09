'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PeriodSelectorProps {
  currentPeriod: string // YYYY-MM
}

function parsePeriod(p: string): { year: number; month: number } {
  return { year: parseInt(p.split('-')[0]!), month: parseInt(p.split('-')[1]!) }
}

function addMonths(period: string, delta: number): string {
  const { year, month } = parsePeriod(period)
  const d = new Date(year, month - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function formatLabel(period: string): string {
  const { year, month } = parsePeriod(period)
  const d = new Date(year, month - 1, 1)
  const name = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  return name.charAt(0).toUpperCase() + name.slice(1)
}

function buildOptions(): { value: string; label: string }[] {
  const now = new Date()
  const options = []
  for (let i = 23; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const name = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    const label = name.charAt(0).toUpperCase() + name.slice(1)
    options.push({ value, label })
  }
  return options
}

export function PeriodSelector({ currentPeriod }: PeriodSelectorProps) {
  const router = useRouter()
  const now    = new Date()
  const maxPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const isCurrentMonth = currentPeriod === maxPeriod

  function navigate(period: string) {
    router.push(`/financeiro?mes=${period}`)
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => navigate(addMonths(currentPeriod, -1))}
        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
        title="Mês anterior"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <select
        value={currentPeriod}
        onChange={(e) => navigate(e.target.value)}
        className="text-sm font-semibold text-gray-700 bg-transparent border-0 outline-none cursor-pointer hover:text-[#0F40CB] transition-colors px-1"
      >
        {buildOptions().map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      <button
        onClick={() => navigate(addMonths(currentPeriod, 1))}
        disabled={isCurrentMonth}
        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        title="Próximo mês"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}
