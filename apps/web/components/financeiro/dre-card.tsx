'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import type { DreStructured, DreGroup } from './types'

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

function pct(v: number) {
  return `${v > 0 ? '+' : ''}${v}%`
}

function GroupRow({ group, deduction = false }: { group: DreGroup; deduction?: boolean }) {
  const [open, setOpen] = useState(false)

  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between py-2 hover:bg-gray-50 rounded-lg px-1 -mx-1 transition-colors group"
      >
        <span className="flex items-center gap-1.5 text-sm text-gray-700">
          {open
            ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            : <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600" />
          }
          {group.title}
        </span>
        <span className={`text-sm tabular-nums font-medium ${deduction ? 'text-red-500' : 'text-gray-800'}`}>
          {deduction ? `(${fmt(group.total)})` : fmt(group.total)}
        </span>
      </button>

      {open && group.items.length > 0 && (
        <div className="ml-5 mb-1 space-y-0.5">
          {group.items.map((item, i) => (
            <div key={i} className="flex items-center justify-between py-1 border-l-2 border-gray-100 pl-3">
              <span className="text-xs text-gray-500 truncate pr-2">{item.label}</span>
              <span className="text-xs text-gray-500 tabular-nums flex-shrink-0">
                {deduction ? `(${fmt(item.value)})` : fmt(item.value)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Subtotal({ label, value, highlight = false, negative = false }: {
  label: string; value: number; highlight?: boolean; negative?: boolean
}) {
  const isPositive = value >= 0
  return (
    <div className={`flex items-center justify-between py-2 px-3 -mx-3 rounded-xl ${highlight ? 'bg-gray-50 my-1' : 'border-t border-gray-100 mt-1'}`}>
      <span className={`text-sm font-semibold ${highlight ? 'text-gray-900' : 'text-gray-700'}`}>
        {label}
      </span>
      <span className={`text-sm tabular-nums font-bold ${
        highlight
          ? isPositive ? 'text-[#2D6A4F]' : 'text-red-500'
          : negative ? 'text-red-500' : 'text-gray-800'
      }`}>
        {fmt(value)}
      </span>
    </div>
  )
}

interface DreCardProps {
  dre: DreStructured
}

export function DreCard({ dre }: DreCardProps) {
  const hasData = dre.totalReceitas > 0 || dre.totalDespesas > 0

  return (
    <Card id="dre-print-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-gray-800">Demonstrativo de Resultado</p>
            <p className="text-xs text-gray-400 font-normal mt-0.5">{dre.period}</p>
          </div>
          <div className="flex items-center gap-2">
            {dre.resultado !== 0 && (
              <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
                dre.resultado >= 0
                  ? 'bg-green-50 text-green-700'
                  : 'bg-red-50 text-red-600'
              }`}>
                {dre.resultado >= 0
                  ? <TrendingUp className="w-3 h-3" />
                  : <TrendingDown className="w-3 h-3" />
                }
                {pct(dre.margem)} margem
              </span>
            )}
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-0">
        {!hasData ? (
          <div className="py-8 text-center">
            <p className="text-sm text-gray-400">Nenhum lançamento neste período</p>
            <p className="text-xs text-gray-300 mt-1">Registre receitas e despesas para ver o DRE</p>
          </div>
        ) : (
          <div className="space-y-0">

            {/* ── RECEITAS ─────────────────────────────── */}
            <div className="mb-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                Receitas
              </p>
              {dre.receitas.map((g, i) => (
                <GroupRow key={i} group={g} />
              ))}
              <Subtotal label="(=) Total Receitas" value={dre.totalReceitas} />
            </div>

            {/* ── CUSTO DOS SERVIÇOS ────────────────────── */}
            {dre.csp && (
              <div className="pt-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                  Custo dos Serviços
                </p>
                <GroupRow group={dre.csp} deduction />
                <Subtotal label="(=) Lucro Bruto" value={dre.lucroBruto} negative={dre.lucroBruto < 0} />
              </div>
            )}

            {/* ── DESPESAS OPERACIONAIS ─────────────────── */}
            {dre.despesasOperacionais.length > 0 && (
              <div className="pt-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                  Despesas Operacionais
                </p>
                {dre.despesasOperacionais.map((g, i) => (
                  <GroupRow key={i} group={g} deduction />
                ))}
                <Subtotal
                  label="(=) Resultado Operacional"
                  value={dre.resultadoOperacional}
                  negative={dre.resultadoOperacional < 0}
                />
              </div>
            )}

            {/* ── IMPOSTOS E DESPESAS FINANCEIRAS ──────── */}
            {(dre.impostosETaxas || dre.despesasFinanceiras) && (
              <div className="pt-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                  Impostos e Encargos
                </p>
                {dre.impostosETaxas && <GroupRow group={dre.impostosETaxas} deduction />}
                {dre.despesasFinanceiras && <GroupRow group={dre.despesasFinanceiras} deduction />}
              </div>
            )}

            {/* ── RESULTADO FINAL ───────────────────────── */}
            <div className={`mt-3 pt-2 ${dre.resultado >= 0 ? 'bg-green-50' : 'bg-red-50'} rounded-xl px-3 -mx-3 py-3`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-gray-900">(=) Resultado Líquido</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Receitas: {fmt(dre.totalReceitas)} · Despesas: {fmt(dre.totalDespesas)}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold tabular-nums ${dre.resultado >= 0 ? 'text-[#2D6A4F]' : 'text-red-600'}`}>
                    {fmt(dre.resultado)}
                  </p>
                  <p className="text-xs text-gray-400">Margem {dre.margem}%</p>
                </div>
              </div>
            </div>

          </div>
        )}
      </CardContent>
    </Card>
  )
}
