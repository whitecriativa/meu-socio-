'use client'

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ExpensesPieProps {
  data: { name: string; value: number; color: string }[]
}

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-3 py-2 text-sm">
      <p className="font-semibold text-gray-700">{d.name}</p>
      <p className="text-gray-500 tabular-nums">{fmt(d.value)}</p>
      <p className="text-gray-400 text-xs">{d.payload.percent}%</p>
    </div>
  )
}

function CustomLegend({ payload }: any) {
  return (
    <ul className="flex flex-col gap-1.5 mt-2">
      {payload.map((entry: any) => (
        <li key={entry.value} className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: entry.color }} />
            <span className="text-gray-600">{entry.value}</span>
          </span>
          <span className="text-gray-400 tabular-nums ml-3">{entry.payload.percent}%</span>
        </li>
      ))}
    </ul>
  )
}

export function ExpensesPie({ data }: ExpensesPieProps) {
  const total = data.reduce((s, d) => s + d.value, 0)
  const withPercent = data.map((d) => ({
    ...d,
    percent: Math.round((d.value / total) * 100),
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold text-gray-700">
          Despesas por categoria
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center">
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={withPercent}
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {withPercent.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          {/* Total no centro — posicionado sobre o gráfico via absolute não funciona com Recharts, usamos legenda abaixo */}
          <div className="text-center -mt-2 mb-3">
            <p className="text-xs text-gray-400">Total de despesas</p>
            <p className="text-lg font-bold text-gray-900">{fmt(total)}</p>
          </div>
          <CustomLegend payload={withPercent.map((d) => ({ value: d.name, color: d.color, payload: d }))} />
        </div>
      </CardContent>
    </Card>
  )
}
