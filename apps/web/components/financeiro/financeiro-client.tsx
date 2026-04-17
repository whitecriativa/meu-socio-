'use client'

import { useState } from 'react'
import { IndicatorsGrid } from './indicators-grid'
import { RevenueChart } from './revenue-chart'
import { ExpensesPie } from './expenses-pie'
import { NovoLancamentoModal } from './novo-lancamento-modal'
import { LancamentosList } from './lancamentos-list'
import { ContratosList } from './contratos-list'
import { CustosFixos, type CustoFixo } from './custos-fixos'
import { PeriodSelector } from './period-selector'
import { ProximosPagamentos, type PagamentoFuturo } from './proximos-pagamentos'
import type { FinanceiroData } from './types'

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

export function FinanceiroClient({
  pj,
  pf,
  custosFixos,
  currentPeriod,
  pagamentosFuturos,
}: {
  pj: FinanceiroData
  pf: FinanceiroData
  custosFixos: CustoFixo[]
  currentPeriod: string
  pagamentosFuturos: PagamentoFuturo[]
}) {
  const [tab, setTab] = useState<'pj' | 'pf'>('pj')
  const data = tab === 'pj' ? pj : pf

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Financeiro</h1>
          <PeriodSelector currentPeriod={currentPeriod} />
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <NovoLancamentoModal />
        </div>
      </div>

      {/* Abas PJ / PF */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setTab('pj')}
          className={`px-5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
            tab === 'pj' ? 'bg-white text-[#0F40CB] shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          PJ
        </button>
        <button
          disabled
          className="px-5 py-1.5 rounded-lg text-sm font-semibold text-gray-300 cursor-not-allowed"
          title="Em breve"
        >
          PF
        </button>
      </div>

      {/* Resumo rápido do mês */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-400 mb-1">Receitas</p>
          <p className="text-lg font-bold text-[#0F40CB] tabular-nums">{fmt(data.dreStructured.totalReceitas)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-400 mb-1">Despesas</p>
          <p className="text-lg font-bold text-red-500 tabular-nums">{fmt(data.dreStructured.totalDespesas)}</p>
        </div>
        <div className={`rounded-2xl border shadow-sm p-4 ${data.dreStructured.resultado >= 0 ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
          <p className="text-xs text-gray-400 mb-1">Resultado</p>
          <p className={`text-lg font-bold tabular-nums ${data.dreStructured.resultado >= 0 ? 'text-[#2D6A4F]' : 'text-red-600'}`}>{fmt(data.dreStructured.resultado)}</p>
        </div>
      </div>

      {/* 6 Indicadores */}
      <section>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
          Indicadores do mês
        </p>
        <IndicatorsGrid data={data.indicators} />
      </section>

      {/* Gráficos */}
      <section>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
          Análise visual
        </p>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <RevenueChart data={data.revenueHistory} />
          </div>
          <div>
            <ExpensesPie data={data.expensesByCategory} />
          </div>
        </div>
      </section>

      {/* Contratos */}
      <ContratosList contratos={data.contratos} />

      {/* Pagamentos futuros */}
      <ProximosPagamentos items={pagamentosFuturos} />

      {/* Custos fixos */}
      <CustosFixos initial={custosFixos} />

      {/* Lançamentos */}
      <LancamentosList items={data.lancamentos} />
    </div>
  )
}
