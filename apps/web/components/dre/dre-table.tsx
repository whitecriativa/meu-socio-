'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, TrendingUp, TrendingDown, Download, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { PeriodSelector } from '@/components/financeiro/period-selector'
import type { DreStructured, DreGroup } from '@/components/financeiro/types'

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

function pct(v: number, total: number) {
  if (total === 0) return '—'
  return Math.round(Math.abs(v / total) * 100) + '%'
}

function exportPDF(dre: DreStructured) {
  const rows: string[] = []

  function sectionHeader(title: string) {
    rows.push(`<tr style="background:#f8fafc"><td colspan="3" style="padding:12px 8px 4px;font-size:10px;font-weight:800;color:#6b7280;letter-spacing:0.1em;text-transform:uppercase">${title}</td></tr>`)
  }

  function groupRow(label: string, value: number, pctVal: string, deduction = false) {
    const color = deduction ? '#dc2626' : '#111827'
    const display = deduction ? `(${fmt(value)})` : fmt(value)
    rows.push(`<tr style="border-bottom:1px solid #f3f4f6"><td style="padding:7px 8px 7px 20px;font-size:13px;font-weight:600;color:${color}">${label}</td><td style="padding:7px 8px;text-align:right;font-size:13px;font-weight:600;color:${color};white-space:nowrap">${display}</td><td style="padding:7px 8px;text-align:right;font-size:12px;color:#9ca3af">${pctVal}</td></tr>`)
  }

  function itemRow(label: string, value: number, pctVal: string, deduction = false) {
    const display = deduction ? `(${fmt(value)})` : fmt(value)
    rows.push(`<tr style="border-bottom:1px solid #f9fafb"><td style="padding:5px 8px 5px 36px;font-size:12px;color:#6b7280">${label}</td><td style="padding:5px 8px;text-align:right;font-size:12px;color:#6b7280;white-space:nowrap">${display}</td><td style="padding:5px 8px;text-align:right;font-size:11px;color:#d1d5db">${pctVal}</td></tr>`)
  }

  function subtotalRow(label: string, value: number, highlight = false) {
    const isPos = value >= 0
    const bg = highlight ? (isPos ? '#f0fdf4' : '#fef2f2') : '#f8fafc'
    const color = highlight ? (isPos ? '#166534' : '#dc2626') : '#374151'
    rows.push(`<tr style="background:${bg}"><td style="padding:9px 8px;font-size:13px;font-weight:700;color:${color}">${label}</td><td style="padding:9px 8px;text-align:right;font-size:13px;font-weight:700;color:${color};white-space:nowrap">${fmt(value)}</td><td style="padding:9px 8px;text-align:right;font-size:12px;color:${color}">${dre.totalReceitas > 0 ? Math.abs(Math.round((value / dre.totalReceitas) * 100)) + '%' : '—'}</td></tr>`)
  }

  const total = dre.totalReceitas

  sectionHeader('Receitas')
  for (const g of dre.receitas) {
    groupRow(g.title, g.total, pct(g.total, total))
    for (const item of g.items) itemRow(item.label, item.value, pct(item.value, total))
  }
  subtotalRow('(=) Total Receitas', dre.totalReceitas)

  if (dre.csp) {
    sectionHeader('Custo dos Serviços Prestados')
    groupRow(dre.csp.title, dre.csp.total, pct(dre.csp.total, total), true)
    for (const item of dre.csp.items) itemRow(item.label, item.value, pct(item.value, total), true)
    subtotalRow('(=) Lucro Bruto', dre.lucroBruto)
  }

  if (dre.despesasOperacionais.length > 0) {
    sectionHeader('Despesas Operacionais')
    for (const g of dre.despesasOperacionais) {
      groupRow(g.title, g.total, pct(g.total, total), true)
      for (const item of g.items) itemRow(item.label, item.value, pct(item.value, total), true)
    }
    subtotalRow('(=) Resultado Operacional', dre.resultadoOperacional)
  }

  if (dre.impostosETaxas || dre.despesasFinanceiras) {
    sectionHeader('Impostos e Encargos')
    if (dre.impostosETaxas) {
      groupRow(dre.impostosETaxas.title, dre.impostosETaxas.total, pct(dre.impostosETaxas.total, total), true)
      for (const item of dre.impostosETaxas.items) itemRow(item.label, item.value, pct(item.value, total), true)
    }
    if (dre.despesasFinanceiras) {
      groupRow(dre.despesasFinanceiras.title, dre.despesasFinanceiras.total, pct(dre.despesasFinanceiras.total, total), true)
      for (const item of dre.despesasFinanceiras.items) itemRow(item.label, item.value, pct(item.value, total), true)
    }
  }

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>DRE — ${dre.period}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Helvetica Neue',Arial,sans-serif; color:#111827; background:#fff; padding:40px; }
    .header { border-bottom:3px solid #0F40CB; padding-bottom:20px; margin-bottom:24px; }
    .header h1 { font-size:22px; font-weight:800; color:#0F40CB; }
    .header p { font-size:13px; color:#6b7280; margin-top:4px; }
    table { width:100%; border-collapse:collapse; }
    thead th { padding:8px; text-align:left; font-size:11px; font-weight:700; color:#9ca3af; text-transform:uppercase; letter-spacing:0.06em; border-bottom:2px solid #e5e7eb; }
    thead th:not(:first-child) { text-align:right; }
    .result-row td { padding:14px 8px; font-size:16px; font-weight:800; background:${dre.resultado >= 0 ? '#f0fdf4' : '#fef2f2'}; color:${dre.resultado >= 0 ? '#166534' : '#dc2626'}; }
    .result-row td:not(:first-child) { text-align:right; }
    .footer { margin-top:32px; padding-top:16px; border-top:1px solid #e5e7eb; font-size:11px; color:#9ca3af; display:flex; justify-content:space-between; }
    @media print { body { padding:20px; } @page { margin:1cm; size:A4; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>Demonstrativo de Resultado</h1>
    <p>${dre.period} &nbsp;·&nbsp; Emitido em ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
  </div>
  <table>
    <thead><tr><th>Descrição</th><th>Realizado (R$)</th><th>% Receita</th></tr></thead>
    <tbody>
      ${rows.join('')}
      <tr class="result-row">
        <td>(=) Resultado Líquido do Período</td>
        <td>${fmt(dre.resultado)}</td>
        <td>${dre.margem}%</td>
      </tr>
    </tbody>
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

function GroupRow({ group, deduction, totalReceita }: { group: DreGroup; deduction?: boolean; totalReceita: number }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <tr
        className="cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <td className="py-2.5 pl-4 pr-2">
          <span className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
            {open
              ? <ChevronDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              : <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            }
            {group.title}
          </span>
        </td>
        <td className={`py-2.5 px-3 text-right text-sm font-semibold tabular-nums ${deduction ? 'text-red-500' : 'text-gray-800'}`}>
          {deduction ? `(${fmt(group.total)})` : fmt(group.total)}
        </td>
        <td className="py-2.5 px-3 text-right text-xs text-gray-400 tabular-nums">
          {pct(group.total, totalReceita)}
        </td>
      </tr>
      {open && group.items.map((item, i) => (
        <tr key={i} className="bg-gray-50/50">
          <td className="py-1.5 pl-10 pr-2 border-l-2 border-gray-100 ml-4">
            <span className="text-xs text-gray-500">{item.label}</span>
          </td>
          <td className={`py-1.5 px-3 text-right text-xs tabular-nums ${deduction ? 'text-red-400' : 'text-gray-500'}`}>
            {deduction ? `(${fmt(item.value)})` : fmt(item.value)}
          </td>
          <td className="py-1.5 px-3 text-right text-xs text-gray-300 tabular-nums">
            {pct(item.value, totalReceita)}
          </td>
        </tr>
      ))}
    </>
  )
}

function SectionHeader({ title }: { title: string }) {
  return (
    <tr>
      <td colSpan={3} className="pt-5 pb-1 px-3">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{title}</span>
      </td>
    </tr>
  )
}

function SubtotalRow({ label, value, totalReceita, highlight = false }: {
  label: string; value: number; totalReceita: number; highlight?: boolean
}) {
  const isPos = value >= 0
  return (
    <tr className={highlight
      ? isPos ? 'bg-green-50' : 'bg-red-50'
      : 'bg-gray-50'
    }>
      <td className={`py-2.5 px-3 text-sm font-bold ${highlight ? (isPos ? 'text-[#2D6A4F]' : 'text-red-600') : 'text-gray-700'}`}>
        {label}
      </td>
      <td className={`py-2.5 px-3 text-right text-sm font-bold tabular-nums ${highlight ? (isPos ? 'text-[#2D6A4F]' : 'text-red-600') : 'text-gray-700'}`}>
        {fmt(value)}
      </td>
      <td className={`py-2.5 px-3 text-right text-xs tabular-nums ${highlight ? (isPos ? 'text-[#2D6A4F]' : 'text-red-600') : 'text-gray-400'}`}>
        {totalReceita > 0 ? Math.abs(Math.round((value / totalReceita) * 100)) + '%' : '—'}
      </td>
    </tr>
  )
}

function HistoryTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-3 py-2.5 text-sm">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.fill }} className="tabular-nums text-xs">
          {p.name === 'revenue' ? 'Receita' : 'Despesas'}: {fmt(p.value)}
        </p>
      ))}
    </div>
  )
}

interface DreTableProps {
  dre: DreStructured
  currentPeriod: string
  revenueHistory?: { month: string; revenue: number; expenses: number }[]
}

export function DreTable({ dre, currentPeriod, revenueHistory }: DreTableProps) {
  const hasData = dre.totalReceitas > 0 || dre.totalDespesas > 0
  const total = dre.totalReceitas

  // Trend vs last month from history
  const prevMonthRevenue = revenueHistory && revenueHistory.length >= 2
    ? revenueHistory[revenueHistory.length - 2]!.revenue
    : null
  const trendPct = prevMonthRevenue && prevMonthRevenue > 0
    ? Math.round(((dre.totalReceitas - prevMonthRevenue) / prevMonthRevenue) * 100)
    : null

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Demonstrativo de Resultado</h1>
          <PeriodSelector currentPeriod={currentPeriod} />
        </div>
        <button
          onClick={() => exportPDF(dre)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 transition-colors hover:bg-gray-50 flex-shrink-0"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Exportar PDF</span>
        </button>
      </div>

      {/* Período */}
      <p className="text-sm text-gray-500 -mt-2">{dre.period}</p>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Receitas */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-400">Receitas</p>
            {trendPct !== null && (
              <span className={`flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                trendPct >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
              }`}>
                {trendPct > 0 ? <ArrowUpRight className="w-3 h-3" /> : trendPct < 0 ? <ArrowDownRight className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                {Math.abs(trendPct)}%
              </span>
            )}
          </div>
          <p className="text-xl font-bold text-[#0F40CB] tabular-nums">{fmt(dre.totalReceitas)}</p>
        </div>

        {/* Despesas */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs font-medium text-gray-400 mb-2">Despesas</p>
          <p className="text-xl font-bold text-red-500 tabular-nums">{fmt(dre.totalDespesas)}</p>
        </div>

        {/* Resultado */}
        <div className={`rounded-2xl border shadow-sm p-4 ${dre.resultado >= 0 ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
          <p className="text-xs font-medium text-gray-400 mb-2">Resultado</p>
          <p className={`text-xl font-bold tabular-nums ${dre.resultado >= 0 ? 'text-[#2D6A4F]' : 'text-red-600'}`}>
            {fmt(dre.resultado)}
          </p>
        </div>

        {/* Margem */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs font-medium text-gray-400 mb-2">Margem líquida</p>
          <div className="flex items-end gap-1">
            <p className={`text-xl font-bold tabular-nums ${dre.margem >= 0 ? 'text-gray-800' : 'text-red-500'}`}>
              {dre.margem}%
            </p>
          </div>
          {/* progress bar */}
          <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${dre.margem >= 0 ? 'bg-[#B6F273]' : 'bg-red-300'}`}
              style={{ width: `${Math.min(Math.abs(dre.margem), 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Gráfico histórico 6 meses */}
      {revenueHistory && revenueHistory.some(d => d.revenue > 0 || d.expenses > 0) && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Evolução 6 meses</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={revenueHistory} barGap={2} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip content={<HistoryTooltip />} cursor={{ fill: '#f9fafb' }} />
              <Bar dataKey="revenue" name="revenue" fill="#0F40CB" radius={[4,4,0,0]} />
              <Bar dataKey="expenses" name="expenses" fill="#fca5a5" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-2">
            <span className="flex items-center gap-1.5 text-xs text-gray-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#0F40CB] inline-block" />Receitas
            </span>
            <span className="flex items-center gap-1.5 text-xs text-gray-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-red-300 inline-block" />Despesas
            </span>
          </div>
        </div>
      )}

      {/* Tabela DRE */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {!hasData ? (
          <div className="py-16 text-center">
            <p className="text-sm text-gray-400">Nenhum lançamento neste período</p>
            <p className="text-xs text-gray-300 mt-1">Registre receitas e despesas para ver o DRE</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="py-3 px-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Descrição</th>
                <th className="py-3 px-3 text-right text-[11px] font-bold text-gray-400 uppercase tracking-wider">Realizado (R$)</th>
                <th className="py-3 px-3 text-right text-[11px] font-bold text-gray-400 uppercase tracking-wider w-20">% Rec.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">

              {/* ── RECEITAS ── */}
              <SectionHeader title="Receitas" />
              {dre.receitas.map((g, i) => (
                <GroupRow key={i} group={g} totalReceita={total} />
              ))}
              <SubtotalRow label="(=) Total Receitas" value={dre.totalReceitas} totalReceita={total} />

              {/* ── CUSTO DOS SERVIÇOS ── */}
              {dre.csp && (
                <>
                  <SectionHeader title="Custo dos Serviços Prestados" />
                  <GroupRow group={dre.csp} deduction totalReceita={total} />
                  <SubtotalRow label="(=) Lucro Bruto" value={dre.lucroBruto} totalReceita={total} />
                </>
              )}

              {/* ── DESPESAS OPERACIONAIS ── */}
              {dre.despesasOperacionais.length > 0 && (
                <>
                  <SectionHeader title="Despesas Operacionais" />
                  {dre.despesasOperacionais.map((g, i) => (
                    <GroupRow key={i} group={g} deduction totalReceita={total} />
                  ))}
                  <SubtotalRow label="(=) Resultado Operacional" value={dre.resultadoOperacional} totalReceita={total} />
                </>
              )}

              {/* ── IMPOSTOS E ENCARGOS ── */}
              {(dre.impostosETaxas || dre.despesasFinanceiras) && (
                <>
                  <SectionHeader title="Impostos e Encargos" />
                  {dre.impostosETaxas && (
                    <GroupRow group={dre.impostosETaxas} deduction totalReceita={total} />
                  )}
                  {dre.despesasFinanceiras && (
                    <GroupRow group={dre.despesasFinanceiras} deduction totalReceita={total} />
                  )}
                </>
              )}

              {/* ── RESULTADO FINAL ── */}
              <tr className={dre.resultado >= 0 ? 'bg-green-50' : 'bg-red-50'}>
                <td className={`py-4 px-3 text-sm font-bold ${dre.resultado >= 0 ? 'text-[#2D6A4F]' : 'text-red-600'}`}>
                  (=) Resultado Líquido do Período
                </td>
                <td className={`py-4 px-3 text-right text-base font-bold tabular-nums ${dre.resultado >= 0 ? 'text-[#2D6A4F]' : 'text-red-600'}`}>
                  {fmt(dre.resultado)}
                </td>
                <td className={`py-4 px-3 text-right text-sm font-bold tabular-nums ${dre.resultado >= 0 ? 'text-[#2D6A4F]' : 'text-red-600'}`}>
                  {dre.margem}%
                </td>
              </tr>

            </tbody>
          </table>
        )}
      </div>

    </div>
  )
}
