'use client'

import { DollarSign, Users, Scissors, TrendingUp, Scale, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Indicator {
  label: string
  value: string
  sub: string
  icon: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
  accentColor: string
  bgColor: string
}

export interface IndicatorsData {
  avg_ticket: number
  retention: number
  cost_per_service: number
  net_margin: number
  break_even: number
  default_rate: number
}

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

export function IndicatorsGrid({ data }: { data: IndicatorsData }) {
  const indicators: Indicator[] = [
    {
      label: 'Ticket médio',
      value: fmt(data.avg_ticket),
      sub: 'por atendimento',
      icon: <DollarSign className="w-4 h-4" />,
      trend: 'up',
      accentColor: '#0F40CB',
      bgColor: '#0F40CB',
    },
    {
      label: 'Retenção',
      value: `${data.retention}%`,
      sub: 'clientes que voltam',
      icon: <Users className="w-4 h-4" />,
      trend: data.retention >= 70 ? 'up' : 'down',
      accentColor: '#B6F273',
      bgColor: '#B6F273',
    },
    {
      label: 'Custo por atend.',
      value: fmt(data.cost_per_service),
      sub: 'insumos + operacional',
      icon: <Scissors className="w-4 h-4" />,
      trend: 'neutral',
      accentColor: '#0F40CB',
      bgColor: '#0F40CB',
    },
    {
      label: 'Margem líquida',
      value: `${data.net_margin}%`,
      sub: 'sobre a receita total',
      icon: <TrendingUp className="w-4 h-4" />,
      trend: data.net_margin >= 30 ? 'up' : 'down',
      accentColor: '#B6F273',
      bgColor: '#B6F273',
    },
    {
      label: 'Ponto de equilíbrio',
      value: fmt(data.break_even),
      sub: 'mínimo para cobrir custos',
      icon: <Scale className="w-4 h-4" />,
      trend: 'neutral',
      accentColor: '#0F40CB',
      bgColor: '#0F40CB',
    },
    {
      label: 'Inadimplência',
      value: `${data.default_rate}%`,
      sub: 'sobre receita prevista',
      icon: <AlertCircle className="w-4 h-4" />,
      trend: data.default_rate <= 3 ? 'up' : 'down',
      accentColor: data.default_rate <= 3 ? '#B6F273' : '#ef4444',
      bgColor: data.default_rate <= 3 ? '#B6F273' : '#ef4444',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
      {indicators.map((ind) => (
        <Card key={ind.label}>
          <CardHeader>
            <CardTitle>{ind.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center mb-2"
              style={{ backgroundColor: `${ind.bgColor}18`, color: ind.accentColor }}
            >
              {ind.icon}
            </div>
            <p className="text-xl font-bold text-gray-900">{ind.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{ind.sub}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
