'use client'

import { useState, useTransition } from 'react'
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { adicionarCustoFixo, excluirCustoFixo } from '@/app/(dashboard)/financeiro/actions'

export interface CustoFixo {
  id: string
  name: string
  amount: number
  periodicity: string
  category: string
  due_day?: number | null
}

const CATEGORIAS = [
  { value: 'aluguel',     label: 'Aluguel' },
  { value: 'luz',         label: 'Energia elétrica' },
  { value: 'agua',        label: 'Água' },
  { value: 'internet',    label: 'Internet' },
  { value: 'telefone',    label: 'Telefone' },
  { value: 'software',    label: 'Software / Assinatura' },
  { value: 'funcionario', label: 'Funcionário' },
  { value: 'contador',    label: 'Contador' },
  { value: 'outro',       label: 'Outro' },
]

const PERIODICIDADES = [
  { value: 'mensal',  label: 'Mensal' },
  { value: 'semanal', label: 'Semanal' },
  { value: 'anual',   label: 'Anual' },
]

function toMonthly(amount: number, periodicity: string): number {
  if (periodicity === 'semanal') return amount * 4.33
  if (periodicity === 'anual')   return amount / 12
  return amount
}

function fmt(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function CustosFixos({ initial }: { initial: CustoFixo[] }) {
  const [open, setOpen]       = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError]     = useState('')
  const [form, setForm]       = useState({
    name: '', amount: '', periodicity: 'mensal', category: 'outro',
  })

  const totalMensal = initial.reduce(
    (s, c) => s + toMonthly(c.amount, c.periodicity), 0,
  )

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }))
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const amount = parseFloat(form.amount.replace(',', '.'))
    if (!form.name || isNaN(amount) || amount <= 0) {
      setError('Preencha nome e valor corretamente.')
      return
    }
    startTransition(async () => {
      try {
        await adicionarCustoFixo({
          name:        form.name,
          amount,
          periodicity: form.periodicity as 'mensal' | 'semanal' | 'anual',
          category:    form.category,
        })
        setForm({ name: '', amount: '', periodicity: 'mensal', category: 'outro' })
        setShowForm(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao salvar')
      }
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await excluirCustoFixo(id)
    })
  }

  return (
    <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
      >
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">Custos Fixos</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {initial.length === 0
              ? 'Nenhum custo cadastrado'
              : `${initial.length} item${initial.length > 1 ? 's' : ''} · Total mensal ${fmt(totalMensal)}`}
          </p>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-3">
          {/* Lista */}
          {initial.length > 0 && (
            <div className="space-y-2">
              {initial.map((c) => (
                <div key={c.id} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-white/5 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-white">{c.name}</p>
                    <p className="text-xs text-gray-400">
                      {fmt(c.amount)} / {PERIODICIDADES.find(p => p.value === c.periodicity)?.label ?? c.periodicity}
                      {c.periodicity !== 'mensal' && (
                        <span className="ml-1 text-gray-300">= {fmt(toMonthly(c.amount, c.periodicity))}/mês</span>
                      )}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(c.id)}
                    disabled={pending}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-40"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Botão adicionar */}
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 text-sm text-[#0F40CB] font-medium hover:underline"
            >
              <Plus className="w-4 h-4" /> Adicionar custo fixo
            </button>
          )}

          {/* Formulário */}
          {showForm && (
            <form onSubmit={handleAdd} className="space-y-3 pt-2 border-t border-gray-100 dark:border-white/10">
              <div className="grid grid-cols-2 gap-2">
                <div className="col-span-2">
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Nome (ex: Aluguel do espaço)"
                    required
                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F40CB]/30"
                  />
                </div>
                <input
                  name="amount"
                  value={form.amount}
                  onChange={handleChange}
                  placeholder="Valor (R$)"
                  required
                  className="px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F40CB]/30"
                />
                <select
                  name="periodicity"
                  value={form.periodicity}
                  onChange={handleChange}
                  className="px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F40CB]/30"
                >
                  {PERIODICIDADES.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
                <div className="col-span-2">
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F40CB]/30"
                  >
                    {CATEGORIAS.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {error && <p className="text-xs text-red-500">{error}</p>}

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={pending}
                  className="px-4 py-2 rounded-xl bg-[#0F40CB] text-white text-sm font-semibold hover:bg-[#0a32a0] transition-colors disabled:opacity-50"
                >
                  {pending ? 'Salvando...' : 'Salvar'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setError('') }}
                  className="px-4 py-2 rounded-xl text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
