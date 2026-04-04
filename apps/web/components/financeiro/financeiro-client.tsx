'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'
import { DreCard } from './dre-card'
import { IndicatorsGrid } from './indicators-grid'
import { RevenueChart } from './revenue-chart'
import { ExpensesPie } from './expenses-pie'
import { NovoLancamentoModal } from './novo-lancamento-modal'
import { LancamentosList } from './lancamentos-list'
import { ContratosList } from './contratos-list'
import { CustosFixos, type CustoFixo } from './custos-fixos'
import type { FinanceiroData } from './types'

export function FinanceiroClient({ pj, pf, custosFixos }: { pj: FinanceiroData; pf: FinanceiroData; custosFixos: CustoFixo[] }) {
  const [tab, setTab] = useState<'pj' | 'pf'>('pj')
  const data = tab === 'pj' ? pj : pf

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Financeiro</h1>
          <p className="text-sm text-gray-500 mt-0.5">Visão completa do seu negócio</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <NovoLancamentoModal />
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 transition-colors hover:bg-gray-50 flex-shrink-0"
            onClick={() => alert('Exportação para contador — em breve!')}
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Exportar</span>
          </button>
        </div>
      </div>

      {/* Abas PJ / PF */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {(['pj', 'pf'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              tab === t
                ? 'bg-white text-[#0F40CB] shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {/* DRE */}
      <DreCard month={data.month} items={data.dre} />

      {/* 6 Indicadores */}
      <section>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
          Indicadores do mês
        </p>
        <IndicatorsGrid data={data.indicators} />
      </section>

      {/* Gráficos lado a lado no desktop */}
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

      {/* Pagamentos recorrentes */}
      <ContratosList contratos={data.contratos} />

      {/* Custos Fixos */}
      <CustosFixos initial={custosFixos} />

      {/* Lista de lançamentos */}
      <LancamentosList items={data.lancamentos} />
    </div>
  )
}
