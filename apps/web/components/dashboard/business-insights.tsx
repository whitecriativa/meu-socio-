import { TrendingUp, Users, ShoppingBag, Target } from 'lucide-react'

interface Props {
  totalVendas:    number
  ticketMedio:    number
  clientesUnicos: number
  projecao:       number
  goalTarget:     number
}

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)
}

export function BusinessInsights({ totalVendas, ticketMedio, clientesUnicos, projecao, goalTarget }: Props) {
  const projectionGap = goalTarget > 0 ? projecao - goalTarget : null

  const cards = [
    {
      icon:  <ShoppingBag className="w-4 h-4" />,
      label: 'Vendas no mês',
      value: String(totalVendas),
      sub:   totalVendas === 0 ? 'Nenhuma venda ainda' : `${totalVendas} venda${totalVendas > 1 ? 's' : ''} registrada${totalVendas > 1 ? 's' : ''}`,
      color: '#0F40CB',
      bg:    '#0F40CB',
    },
    {
      icon:  <TrendingUp className="w-4 h-4" />,
      label: 'Ticket médio',
      value: ticketMedio > 0 ? fmt(ticketMedio) : '—',
      sub:   ticketMedio > 0 ? 'por venda/serviço' : 'Registre vendas para calcular',
      color: '#0F40CB',
      bg:    '#B6F273',
    },
    {
      icon:  <Users className="w-4 h-4" />,
      label: 'Clientes atendidos',
      value: String(clientesUnicos),
      sub:   clientesUnicos === 0 ? 'Nenhum cliente vinculado' : `cliente${clientesUnicos > 1 ? 's' : ''} únicos`,
      color: '#0F40CB',
      bg:    '#0F40CB',
    },
    {
      icon:  <Target className="w-4 h-4" />,
      label: 'Projeção do mês',
      value: projecao > 0 ? fmt(projecao) : '—',
      sub:   goalTarget > 0 && projectionGap !== null
        ? projectionGap >= 0
          ? `+${fmt(projectionGap)} acima da meta`
          : `${fmt(Math.abs(projectionGap))} abaixo da meta`
        : 'No ritmo atual',
      color: projectionGap !== null ? (projectionGap >= 0 ? '#0F40CB' : '#ef4444') : '#6b7280',
      bg:    '#B6F273',
    },
  ]

  return (
    <div className="rounded-2xl bg-white border border-gray-100 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
        Indicadores do negócio
      </p>
      <div className="grid grid-cols-2 gap-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl bg-gray-50 px-3 py-3 flex flex-col gap-1">
            <div className="flex items-center gap-1.5" style={{ color: c.color }}>
              {c.icon}
              <p className="text-[11px] font-medium text-gray-500">{c.label}</p>
            </div>
            <p className="text-lg font-bold text-gray-900 leading-tight">{c.value}</p>
            <p className="text-[10px] leading-tight" style={{ color: c.color }}>{c.sub}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
