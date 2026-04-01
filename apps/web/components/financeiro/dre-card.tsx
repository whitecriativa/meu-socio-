'use client'

import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

interface DreItem {
  label: string
  value: number
  sub?: { label: string; value: number }[]
  isResult?: boolean
  isDeduction?: boolean
}

interface DreCardProps {
  month: string
  items: DreItem[]
}

function fmt(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function DreCard({ month, items }: DreCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-sm font-semibold text-gray-700">
          <span>DRE — {month}</span>
          <span className="text-xs text-gray-400 font-normal">Demonstrativo de Resultado</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="divide-y divide-gray-50">
          {items.map((item, i) => (
            <div key={i}>
              {/* Linha principal */}
              <div
                className={`flex items-center justify-between py-2.5 ${
                  item.isResult
                    ? 'bg-[#5B3FD4]/5 rounded-xl px-3 -mx-3 my-1'
                    : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  {item.isResult ? (
                    item.value >= 0
                      ? <TrendingUp className="w-3.5 h-3.5 text-[#52D68A]" />
                      : <TrendingDown className="w-3.5 h-3.5 text-red-400" />
                  ) : item.isDeduction ? (
                    <Minus className="w-3 h-3 text-gray-400" />
                  ) : null}
                  <span
                    className={`text-sm ${
                      item.isResult
                        ? 'font-bold text-gray-900'
                        : item.isDeduction
                        ? 'text-gray-600'
                        : 'font-semibold text-gray-800'
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
                <span
                  className={`text-sm tabular-nums ${
                    item.isResult
                      ? item.value >= 0
                        ? 'font-bold text-[#52D68A]'
                        : 'font-bold text-red-500'
                      : item.isDeduction
                      ? 'text-red-400'
                      : 'font-semibold text-gray-900'
                  }`}
                >
                  {item.isDeduction ? `- ${fmt(item.value)}` : fmt(item.value)}
                </span>
              </div>

              {/* Subitens */}
              {item.sub?.map((s, j) => (
                <div key={j} className="flex items-center justify-between py-1.5 pl-5">
                  <span className="text-xs text-gray-500">{s.label}</span>
                  <span className="text-xs text-gray-500 tabular-nums">{fmt(s.value)}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
