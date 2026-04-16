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
import { PeriodSelector } from './period-selector'
import { ProximosPagamentos, type PagamentoFuturo } from './proximos-pagamentos'
import type { FinanceiroData } from './types'

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

function exportPDF(dre: FinanceiroData['dreStructured'], monthLabel: string) {
  const rows: string[] = []

  function row(label: string, value: string, bold = false, indent = 0) {
    const pad = '&nbsp;'.repeat(indent * 4)
    rows.push(`
      <tr style="border-bottom:1px solid #f0f0f0">
        <td style="padding:6px 8px;${bold ? 'font-weight:700;' : ''}color:#1a1a1a;font-size:13px">${pad}${label}</td>
        <td style="padding:6px 8px;text-align:right;${bold ? 'font-weight:700;' : ''}color:#1a1a1a;font-size:13px;white-space:nowrap">${value}</td>
      </tr>`)
  }

  function section(title: string) {
    rows.push(`
      <tr><td colspan="2" style="padding:14px 8px 4px;font-size:10px;font-weight:700;color:#888;letter-spacing:0.08em;text-transform:uppercase;background:#fafafa">${title}</td></tr>`)
  }

  function subtotal(label: string, value: number, highlight = false) {
    const color = highlight ? (value >= 0 ? '#166534' : '#dc2626') : '#374151'
    const bg = highlight ? (value >= 0 ? '#f0fdf4' : '#fef2f2') : '#f8fafc'
    rows.push(`
      <tr style="background:${bg}">
        <td style="padding:8px;font-weight:700;font-size:13px;color:${color}">${label}</td>
        <td style="padding:8px;text-align:right;font-weight:700;font-size:13px;color:${color};white-space:nowrap">${fmt(value)}</td>
      </tr>`)
  }

  // Receitas
  section('Receitas')
  for (const g of dre.receitas) {
    row(g.title, fmt(g.total), true)
    for (const item of g.items) row(item.label, fmt(item.value), false, 1)
  }
  subtotal('(=) Total Receitas', dre.totalReceitas)

  // CSP
  if (dre.csp) {
    section('Custo dos Serviços Prestados')
    row(dre.csp.title, `(${fmt(dre.csp.total)})`, true)
    for (const item of dre.csp.items) row(item.label, `(${fmt(item.value)})`, false, 1)
    subtotal('(=) Lucro Bruto', dre.lucroBruto)
  }

  // Despesas operacionais
  if (dre.despesasOperacionais.length > 0) {
    section('Despesas Operacionais')
    for (const g of dre.despesasOperacionais) {
      row(g.title, `(${fmt(g.total)})`, true)
      for (const item of g.items) row(item.label, `(${fmt(item.value)})`, false, 1)
    }
    subtotal('(=) Resultado Operacional', dre.resultadoOperacional)
  }

  // Impostos e financeiras
  if (dre.impostosETaxas || dre.despesasFinanceiras) {
    section('Impostos e Encargos')
    if (dre.impostosETaxas) {
      row(dre.impostosETaxas.title, `(${fmt(dre.impostosETaxas.total)})`, true)
      for (const item of dre.impostosETaxas.items) row(item.label, `(${fmt(item.value)})`, false, 1)
    }
    if (dre.despesasFinanceiras) {
      row(dre.despesasFinanceiras.title, `(${fmt(dre.despesasFinanceiras.total)})`, true)
      for (const item of dre.despesasFinanceiras.items) row(item.label, `(${fmt(item.value)})`, false, 1)
    }
  }

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>DRE — ${monthLabel}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a1a1a; background: #fff; padding: 40px; }
    .header { border-bottom: 3px solid #0F40CB; padding-bottom: 20px; margin-bottom: 24px; }
    .header h1 { font-size: 22px; font-weight: 800; color: #0F40CB; }
    .header p { font-size: 13px; color: #666; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; }
    .result-row { background: ${dre.resultado >= 0 ? '#f0fdf4' : '#fef2f2'}; }
    .result-row td { padding: 14px 8px; font-size: 16px; font-weight: 800;
      color: ${dre.resultado >= 0 ? '#166534' : '#dc2626'}; }
    .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb;
      font-size: 11px; color: #9ca3af; display: flex; justify-content: space-between; }
    @media print {
      body { padding: 20px; }
      @page { margin: 1cm; size: A4; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Demonstrativo de Resultado</h1>
    <p>${monthLabel} &nbsp;·&nbsp; Emitido em ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
  </div>
  <table>
    ${rows.join('')}
    <tr class="result-row">
      <td>(=) Resultado Líquido do Período</td>
      <td style="text-align:right">${fmt(dre.resultado)}</td>
    </tr>
    <tr>
      <td style="padding:6px 8px;font-size:12px;color:#6b7280">
        Receitas: ${fmt(dre.totalReceitas)} &nbsp;·&nbsp; Despesas: ${fmt(dre.totalDespesas)} &nbsp;·&nbsp; Margem líquida: ${dre.margem}%
      </td>
      <td></td>
    </tr>
  </table>
  <div class="footer">
    <span>Meu Sócio — Gestão para Microempreendedores</span>
    <span>meusocioapp.com</span>
  </div>
  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`

  const win = window.open('', '_blank')
  if (win) {
    win.document.write(html)
    win.document.close()
  }
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
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 transition-colors hover:bg-gray-50 flex-shrink-0"
            onClick={() => exportPDF(data.dreStructured, data.month)}
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Exportar PDF</span>
          </button>
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

      {/* DRE Estruturado */}
      <DreCard dre={data.dreStructured} />

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
