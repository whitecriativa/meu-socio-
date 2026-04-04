'use client'

import { useRouter } from 'next/navigation'
import { TrendingUp, TrendingDown, CalendarPlus, Users } from 'lucide-react'

const ACTIONS = [
  { label: 'Nova venda',    icon: TrendingUp,   color: '#B6F273', bg: '#B6F27315', href: '/financeiro?tipo=receita' },
  { label: 'Nova despesa',  icon: TrendingDown, color: '#F87171', bg: '#F8717115', href: '/financeiro?tipo=despesa' },
  { label: 'Agendar',       icon: CalendarPlus, color: '#0F40CB', bg: '#0F40CB15', href: '/agenda' },
  { label: 'Ver clientes',  icon: Users,        color: '#F59E0B', bg: '#F59E0B15', href: '/clientes' },
]

export function QuickAccess() {
  const router = useRouter()

  return (
    <div className="grid grid-cols-4 gap-2.5">
      {ACTIONS.map(({ label, icon: Icon, color, bg, href }) => (
        <button
          key={label}
          onClick={() => router.push(href)}
          className="flex flex-col items-center gap-2 p-3 rounded-2xl transition-all active:scale-95"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: bg }}>
            <Icon className="w-5 h-5" style={{ color }} />
          </div>
          <span className="text-[11px] font-medium text-center leading-tight" style={{ color: 'var(--text-muted)' }}>
            {label}
          </span>
        </button>
      ))}
    </div>
  )
}
