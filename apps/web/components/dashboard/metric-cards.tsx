'use client'

import { TrendingUp, TrendingDown, Ticket, Users, Target } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

function fmt(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

interface MetricCardsProps {
  revenue: number
  expenses: number
  avg_ticket: number
  active_clients: number
  new_clients: number
  goal_achieved: number
  goal_target: number
  dream_note: string
}

export function MetricCards({
  revenue, expenses, avg_ticket, active_clients,
  new_clients, goal_achieved, goal_target, dream_note,
}: MetricCardsProps) {
  const balance = revenue - expenses
  const goalPercent = Math.min(100, Math.round((goal_achieved / goal_target) * 100))
  const goalColor = goalPercent >= 100 ? '#52D68A' : '#5B3FD4'

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {/* Faturamento */}
      <Card>
        <CardHeader>
          <CardTitle>Faturamento hoje</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-7 h-7 rounded-lg bg-[#5B3FD4]/10 flex items-center justify-center mb-2">
            <TrendingUp className="w-3.5 h-3.5 text-[#5B3FD4]" />
          </div>
          <p className="text-xl font-bold text-gray-900">{fmt(revenue)}</p>
          <p className="text-xs text-gray-400 mt-0.5">Saldo: {fmt(balance)}</p>
        </CardContent>
      </Card>

      {/* Meta do mês com barra */}
      <Card className="col-span-2 lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5" />
            Meta do mês
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between mb-2">
            <p className="text-xl font-bold text-gray-900">{goalPercent}%</p>
            <p className="text-xs text-gray-400 text-right max-w-[100px] leading-tight">{dream_note}</p>
          </div>
          <Progress value={goalPercent} indicatorColor={goalColor} />
          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-400">{fmt(goal_achieved)}</span>
            <span className="text-xs text-gray-400">{fmt(goal_target)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Ticket médio */}
      <Card>
        <CardHeader>
          <CardTitle>Ticket médio</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-7 h-7 rounded-lg bg-[#52D68A]/15 flex items-center justify-center mb-2">
            <Ticket className="w-3.5 h-3.5 text-[#52D68A]" style={{ filter: 'saturate(1.5)' }} />
          </div>
          <p className="text-xl font-bold text-gray-900">{fmt(avg_ticket)}</p>
          <p className="text-xs text-gray-400 mt-0.5">por atendimento</p>
        </CardContent>
      </Card>

      {/* Clientes ativos */}
      <Card>
        <CardHeader>
          <CardTitle>Clientes ativos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-7 h-7 rounded-lg bg-[#5B3FD4]/10 flex items-center justify-center mb-2">
            <Users className="w-3.5 h-3.5 text-[#5B3FD4]" />
          </div>
          <p className="text-xl font-bold text-gray-900">{active_clients}</p>
          <p className="text-xs text-gray-400 mt-0.5">+{new_clients} novos hoje</p>
        </CardContent>
      </Card>
    </div>
  )
}
