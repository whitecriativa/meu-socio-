'use client'

import { useState, useTransition } from 'react'
import { CheckCircle, Clock, AlertCircle, ChevronDown, ChevronUp, Plus, X, Trash2 } from 'lucide-react'
import { salvarLancamento, marcarTransacaoPaga, excluirLancamento } from '@/app/(dashboard)/financeiro/actions'

export interface PagamentoFuturo {
  id: string
  name: string
  amount: number
  periodicity: string
  category: string
  due_day: number | null
  paid: boolean
  dueDate: string | null
  overdue: boolean
  avulso: boolean
}

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

function formatDue(due_day: number | null, dueDate: string | null): string {
  if (due_day) return `Vence dia ${due_day}`
  if (dueDate) {
    const [, , d] = dueDate.split('-')
    return `Vence dia ${parseInt(d!)}`
  }
  return 'Sem vencimento'
}

// Formulário de novo pagamento futuro
function NovoAvulsoForm({ onClose, onAdd }: { onClose: () => void; onAdd: (item: PagamentoFuturo) => void }) {
  const [desc, setDesc]   = useState('')
  const [valor, setValor] = useState('')
  const [date, setDate]   = useState('')
  const [error, setError] = useState('')
  const [, startTransition] = useTransition()

  // Data default: amanhã
  const tomorrow = (() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-')
  })()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!desc.trim()) { setError('Informe a descrição.'); return }
    const amount = parseFloat((valor || '0').replace(',', '.'))
    const dueDate = date || tomorrow

    const tempId = `temp-${Date.now()}`
    onAdd({
      id:          tempId,
      name:        desc.trim(),
      amount,
      periodicity: 'avulso',
      category:    'outro',
      due_day:     parseInt(dueDate.split('-')[2]!),
      paid:        false,
      dueDate,
      overdue:     dueDate < new Date().toISOString().slice(0, 10),
      avulso:      true,
    })

    startTransition(async () => {
      await salvarLancamento({
        type:            'despesa',
        amount:          amount || 0,
        category:        'outro',
        description:     desc.trim(),
        payment_method:  'pix',
        competence_date: dueDate,
        pending:         true,
      })
    })

    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="px-5 pb-4 pt-2 border-t border-gray-50 space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2">
          <input
            autoFocus
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Ex: Pagar Leo, Fornecedor ABC..."
            className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 outline-none focus:border-[#0F40CB] focus:ring-2 focus:ring-[#0F40CB]/10"
          />
        </div>
        <input
          type="number"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          placeholder="Valor (R$) — opcional"
          min="0"
          step="0.01"
          className="px-3 py-2 text-sm rounded-xl border border-gray-200 outline-none focus:border-[#0F40CB] focus:ring-2 focus:ring-[#0F40CB]/10"
        />
        <input
          type="date"
          value={date || tomorrow}
          onChange={(e) => setDate(e.target.value)}
          className="px-3 py-2 text-sm rounded-xl border border-gray-200 outline-none focus:border-[#0F40CB] focus:ring-2 focus:ring-[#0F40CB]/10"
        />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" className="px-4 py-2 rounded-xl bg-[#0F40CB] text-white text-sm font-semibold hover:opacity-90 transition-opacity">
          Salvar
        </button>
        <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-sm text-gray-500 hover:bg-gray-100 transition-colors">
          Cancelar
        </button>
      </div>
    </form>
  )
}

export function ProximosPagamentos({ items }: { items: PagamentoFuturo[] }) {
  const [list, setList]       = useState(items)
  const [expanded, setExpanded] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [, startTransition]   = useTransition()

  const pendingItems = list.filter((i) => !i.paid)
  const overdueItems = list.filter((i) => i.overdue)
  const totalPending = pendingItems.reduce((s, i) => s + i.amount, 0)

  function markAsPaid(item: PagamentoFuturo) {
    setList((prev) => prev.map((i) => i.id === item.id ? { ...i, paid: true, overdue: false } : i))
    startTransition(async () => {
      if (item.avulso) {
        await marcarTransacaoPaga(item.id)
      } else {
        // Custo fixo recorrente: registra despesa do mês
        const today = new Date().toLocaleDateString('pt-BR', {
          timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit',
        }).split('/').reverse().join('-')
        await salvarLancamento({
          type:            'despesa',
          amount:          item.amount,
          category:        item.category,
          description:     item.name,
          payment_method:  'pix',
          competence_date: item.dueDate ?? today,
        })
      }
    })
  }

  function removeItem(item: PagamentoFuturo) {
    setList((prev) => prev.filter((i) => i.id !== item.id))
    if (item.avulso) {
      startTransition(() => excluirLancamento(item.id))
    }
  }

  function handleAdd(newItem: PagamentoFuturo) {
    setList((prev) => [...prev, newItem].sort((a, b) => (a.due_day ?? 99) - (b.due_day ?? 99)))
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex-1 text-left"
        >
          <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            Pagamentos do mês
            {overdueItems.length > 0 && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-500">
                {overdueItems.length} atrasado{overdueItems.length > 1 ? 's' : ''}
              </span>
            )}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {list.filter((i) => i.paid).length}/{list.length} pagos
            {totalPending > 0 && ` · ${fmt(totalPending)} a pagar`}
          </p>
        </button>
        <div className="flex items-center gap-1">
          <button
            onClick={() => { setShowForm((v) => !v); setExpanded(true) }}
            className="p-1.5 rounded-lg hover:bg-[#0F40CB]/10 text-[#0F40CB] transition-colors"
            title="Adicionar pagamento"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button onClick={() => setExpanded((v) => !v)} className="p-1.5 text-gray-400">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Formulário novo pagamento */}
      {showForm && (
        <NovoAvulsoForm onClose={() => setShowForm(false)} onAdd={handleAdd} />
      )}

      {/* Lista */}
      {expanded && (
        <>
          {list.length === 0 ? (
            <div className="px-5 pb-4 text-xs text-gray-400">
              Nenhum pagamento. Clique em <strong>+</strong> para adicionar um avulso, ou cadastre Custos Fixos abaixo para aparecerem automaticamente.
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {list.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 px-5 py-3 group transition-colors ${
                    item.paid ? 'opacity-50' : item.overdue ? 'bg-red-50/40' : ''
                  }`}
                >
                  {/* Status icon */}
                  <div className="flex-shrink-0">
                    {item.paid
                      ? <CheckCircle className="w-4 h-4 text-emerald-500" />
                      : item.overdue
                      ? <AlertCircle className="w-4 h-4 text-red-400" />
                      : <Clock className="w-4 h-4 text-amber-400" />
                    }
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${item.paid ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                      {item.name}
                      {item.avulso && <span className="ml-1.5 text-[10px] text-gray-400 font-normal">avulso</span>}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatDue(item.due_day, item.dueDate)}
                      {item.overdue && <span className="ml-1.5 text-red-400 font-medium">· Atrasado</span>}
                    </p>
                  </div>

                  {/* Valor */}
                  <p className={`text-sm font-bold flex-shrink-0 ${item.paid ? 'text-gray-300' : item.overdue ? 'text-red-500' : 'text-gray-700'}`}>
                    {item.amount > 0 ? fmt(item.amount) : '—'}
                  </p>

                  {/* Ações */}
                  {!item.paid && (
                    <button
                      onClick={() => markAsPaid(item)}
                      className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                        item.overdue
                          ? 'bg-red-50 text-red-500 hover:bg-red-100'
                          : 'bg-[#0F40CB]/8 text-[#0F40CB] hover:bg-[#0F40CB]/15'
                      }`}
                    >
                      Pagar
                    </button>
                  )}
                  {item.avulso && (
                    <button
                      onClick={() => removeItem(item)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400 transition-all flex-shrink-0"
                      title="Remover"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
