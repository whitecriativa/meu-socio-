'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TrendingUp, TrendingDown, CalendarPlus, Users, Info } from 'lucide-react'

const ACTIONS = [
  {
    label: 'Nova venda',
    icon: TrendingUp,
    color: '#B6F273',
    bg: '#B6F27315',
    href: '/financeiro?tipo=receita',
    hint: 'Registre uma receita: venda, serviço prestado ou qualquer entrada de dinheiro.',
  },
  {
    label: 'Nova despesa',
    icon: TrendingDown,
    color: '#F87171',
    bg: '#F8717115',
    href: '/financeiro?tipo=despesa',
    hint: 'Lance um gasto: aluguel, material, ferramenta ou qualquer saída de dinheiro.',
  },
  {
    label: 'Agendar',
    icon: CalendarPlus,
    color: '#0F40CB',
    bg: '#0F40CB15',
    href: '/agenda',
    hint: 'Crie um novo agendamento para um cliente — data, horário e serviço.',
  },
  {
    label: 'Ver clientes',
    icon: Users,
    color: '#F59E0B',
    bg: '#F59E0B15',
    href: '/clientes',
    hint: 'Acesse sua carteira de clientes, histórico de atendimentos e alertas de inativos.',
  },
]

export function QuickAccess() {
  const router = useRouter()
  const [openHint, setOpenHint] = useState<string | null>(null)

  function toggleHint(label: string, e: React.MouseEvent) {
    e.stopPropagation()
    setOpenHint((prev) => (prev === label ? null : label))
  }

  return (
    <div className="grid grid-cols-4 gap-2.5">
      {ACTIONS.map(({ label, icon: Icon, color, bg, href, hint }) => (
        <div key={label} className="relative">
          <button
            onClick={() => router.push(href)}
            className="w-full flex flex-col items-center gap-2 p-3 rounded-2xl transition-all active:scale-95"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            {/* Ícone de info no canto superior direito */}
            <button
              onClick={(e) => toggleHint(label, e)}
              className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center transition-colors z-10"
              style={{
                backgroundColor: openHint === label ? '#0F40CB' : '#0F40CB18',
                color: openHint === label ? 'white' : '#0F40CB',
              }}
              aria-label={`Saiba mais sobre ${label}`}
            >
              <Info className="w-2.5 h-2.5" />
            </button>

            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: bg }}
            >
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <span
              className="text-[11px] font-medium text-center leading-tight"
              style={{ color: 'var(--text-muted)' }}
            >
              {label}
            </span>
          </button>

          {/* Tooltip / hint */}
          {openHint === label && (
            <div
              className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 z-50 w-52 rounded-xl px-3 py-2 text-xs leading-snug shadow-lg"
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border)',
                color: 'var(--text-muted)',
              }}
            >
              {/* Seta */}
              <span
                className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderTop: '1px solid var(--border)',
                  borderLeft: '1px solid var(--border)',
                }}
              />
              {hint}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
