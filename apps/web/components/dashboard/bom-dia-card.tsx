'use client'

import { Sparkles } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface BomDiaCardProps {
  name: string
  message: string
  revenue_yesterday: number
  goal_percent: number
}

function fmt(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function BomDiaCard({ name, message, revenue_yesterday, goal_percent }: BomDiaCardProps) {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'

  return (
    <Card className="bg-[#5B3FD4] border-0 text-white overflow-hidden relative">
      {/* Decoração de fundo */}
      <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/5 -translate-y-10 translate-x-10" />
      <div className="absolute bottom-0 right-16 w-24 h-24 rounded-full bg-[#52D68A]/20 translate-y-8" />

      <CardContent className="p-5 relative">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-white/70 text-sm">{greeting},</p>
            <h2 className="text-xl font-bold text-white">{name} 👋</h2>
          </div>
          <div className="w-9 h-9 rounded-xl bg-[#52D68A] flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
        </div>

        <p className="text-white/85 text-sm leading-relaxed mb-4">{message}</p>

        <div className="flex gap-4">
          <div className="bg-white/10 rounded-xl px-3 py-2 flex-1">
            <p className="text-white/60 text-xs mb-0.5">Ontem</p>
            <p className="text-white font-bold text-sm">{fmt(revenue_yesterday)}</p>
          </div>
          <div className="bg-white/10 rounded-xl px-3 py-2 flex-1">
            <p className="text-white/60 text-xs mb-0.5">Meta do mês</p>
            <p className="text-white font-bold text-sm">{goal_percent}%</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
