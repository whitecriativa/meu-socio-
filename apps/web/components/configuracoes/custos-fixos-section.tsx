'use client'

import { useState, useTransition } from 'react'
import {
  Home, Zap, Droplets, Wifi, Phone, Monitor,
  Users, BookOpen, Package, Trash2, Plus, X,
} from 'lucide-react'
import { adicionarCusto, removerCusto } from '@/app/(dashboard)/configuracoes/custos-actions'

export interface CustoFixo {
  id: string
  name: string
  amount: number
  periodicity: 'mensal' | 'semanal' | 'anual'
  category: string
}

interface Props {
  initialCosts: CustoFixo[]
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  aluguel:     <Home       className="w-3.5 h-3.5" />,
  luz:         <Zap        className="w-3.5 h-3.5" />,
  agua:        <Droplets   className="w-3.5 h-3.5" />,
  internet:    <Wifi       className="w-3.5 h-3.5" />,
  telefone:    <Phone      className="w-3.5 h-3.5" />,
  software:    <Monitor    className="w-3.5 h-3.5" />,
  funcionario: <Users      className="w-3.5 h-3.5" />,
  contador:    <BookOpen   className="w-3.5 h-3.5" />,
  outro:       <Package    className="w-3.5 h-3.5" />,
}

const CATEGORY_LABELS: Record<string, string> = {
  aluguel:     'Aluguel',
  luz:         'Luz / Energia',
  agua:        'Água',
  internet:    'Internet',
  telefone:    'Telefone',
  software:    'Softwares / assinaturas',
  funcionario: 'Funcionários',
  contador:    'Contador',
  outro:       'Outro',
}

const PERIOD_LABELS: Record<string, string> = {
  mensal:  '/mês',
  semanal: '/sem',
  anual:   '/ano',
}

function toMonthly(amount: number, periodicity: string): number {
  if (periodicity === 'semanal') return amount * 4.33
  if (periodicity === 'anual')   return amount / 12
  return amount
}

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

export function CustosFixosSection({ initialCosts }: Props) {
  const [costs, setCosts]       = useState<CustoFixo[]>(initialCosts)
  const [showForm, setShowForm] = useState(false)
  const [, startTransition]     = useTransition()

  const totalMensal = costs.reduce(
    (sum, c) => sum + toMonthly(c.amount, c.periodicity),
    0,
  )

  function handleRemove(id: string) {
    setCosts((prev) => prev.filter((c) => c.id !== id))
    startTransition(() => { removerCusto(id) })
  }

  return (
    <section className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-800">Meus Custos Fixos</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Usados automaticamente na Calculadora de Precificação
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#5B3FD4' }}
        >
          {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showForm ? 'Cancelar' : 'Adicionar'}
        </button>
      </div>

      {/* Formulário de adição */}
      {showForm && (
        <form
          action={async (fd) => {
            const name     = String(fd.get('name') ?? '').trim()
            const amount   = parseFloat(String(fd.get('amount') ?? '0').replace(',', '.'))
            const period   = String(fd.get('periodicity') ?? 'mensal') as CustoFixo['periodicity']
            const category = String(fd.get('category') ?? 'outro')
            if (!name || amount <= 0) return
            const tempId = `temp-${Date.now()}`
            setCosts((prev) => [...prev, { id: tempId, name, amount, periodicity: period, category }])
            setShowForm(false)
            startTransition(() => { adicionarCusto(fd) })
          }}
          className="rounded-xl border border-[#5B3FD4]/20 bg-[#5B3FD4]/3 p-4 space-y-3"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Nome do custo</label>
              <input
                name="name"
                type="text"
                required
                placeholder="Ex: Aluguel do ateliê"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#5B3FD4] focus:ring-2 focus:ring-[#5B3FD4]/10 transition"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Categoria</label>
              <select
                name="category"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#5B3FD4] focus:ring-2 focus:ring-[#5B3FD4]/10 transition bg-white"
              >
                {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Valor (R$)</label>
              <input
                name="amount"
                type="number"
                min="0.01"
                step="0.01"
                required
                placeholder="Ex: 800"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#5B3FD4] focus:ring-2 focus:ring-[#5B3FD4]/10 transition"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Periodicidade</label>
              <select
                name="periodicity"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#5B3FD4] focus:ring-2 focus:ring-[#5B3FD4]/10 transition bg-white"
              >
                <option value="mensal">Mensal</option>
                <option value="semanal">Semanal</option>
                <option value="anual">Anual</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#5B3FD4' }}
            >
              Salvar custo
            </button>
          </div>
        </form>
      )}

      {/* Lista de custos */}
      {costs.length === 0 ? (
        <div className="text-center py-6 text-xs text-gray-400">
          <Package className="w-8 h-8 text-gray-200 mx-auto mb-2" />
          Nenhum custo fixo cadastrado ainda.
          <br />Adicione para que a calculadora funcione com seus dados reais.
        </div>
      ) : (
        <div className="space-y-2">
          {costs.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-gray-50 hover:border-gray-100 group transition-colors"
            >
              <div className="w-7 h-7 rounded-lg bg-[#5B3FD4]/8 flex items-center justify-center text-[#5B3FD4] flex-shrink-0">
                {CATEGORY_ICONS[c.category] ?? CATEGORY_ICONS['outro']}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{c.name}</p>
                <p className="text-xs text-gray-400">{CATEGORY_LABELS[c.category] ?? c.category}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-semibold text-gray-800">{fmt(c.amount)}</p>
                <p className="text-[10px] text-gray-400">{PERIOD_LABELS[c.periodicity] ?? '/mês'}</p>
              </div>
              {toMonthly(c.amount, c.periodicity) !== c.amount && (
                <div className="text-right flex-shrink-0 text-[10px] text-[#5B3FD4] font-medium w-16">
                  {fmt(toMonthly(c.amount, c.periodicity))}/mês
                </div>
              )}
              <button
                type="button"
                onClick={() => handleRemove(c.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 flex-shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Total */}
      {costs.length > 0 && (
        <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-100">
          <span className="text-xs font-semibold text-gray-600">Total mensal de custos fixos</span>
          <span className="text-sm font-bold text-gray-900">{fmt(totalMensal)}</span>
        </div>
      )}
    </section>
  )
}
