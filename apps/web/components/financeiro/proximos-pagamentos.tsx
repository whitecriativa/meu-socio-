'use client'

import { useState, useTransition } from 'react'
import { CheckCircle, Clock, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { salvarLancamento } from '@/app/(dashboard)/financeiro/actions'

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
}

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

function formatDueDay(due_day: number | null, dueDate: string | null): string {
  if (!due_day) return 'Sem vencimento'
  return `Vence dia ${due_day}`
}

export function ProximosPagamentos({ items }: { items: PagamentoFuturo[] }) {
  const [list, setList] = useState(items)
  const [expanded, setExpanded] = useState(true)
  const [, startTransition] = useTransition()

  const pending = list.filter((i) => !i.paid)
  const paid    = list.filter((i) => i.paid)
  const overdue = list.filter((i) => i.overdue)
  const totalPending = pending.reduce((s, i) => s + i.amount, 0)

  function markAsPaid(item: PagamentoFuturo) {
    setList((prev) => prev.map((i) => i.id === item.id ? { ...i, paid: true, overdue: false } : i))
    startTransition(async () => {
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
    })
  }

  if (list.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4">
        <p className="text-sm font-semibold text-gray-800 mb-1">Pagamentos do mês</p>
        <p className="text-xs text-gray-400">
          Nenhum custo fixo cadastrado ainda. Adicione seus custos fixos abaixo para acompanhar os vencimentos aqui.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div>
          <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            Pagamentos do mês
            {overdue.length > 0 && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-500">
                {overdue.length} atrasado{overdue.length > 1 ? 's' : ''}
              </span>
            )}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {paid.length}/{list.length} pagos · {fmt(totalPending)} a pagar
          </p>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>

      {expanded && (
        <div className="divide-y divide-gray-50">
          {list.map((item) => (
            <div
              key={item.id}
              className={`flex items-center gap-3 px-5 py-3 transition-colors ${
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
                </p>
                <p className="text-xs text-gray-400">
                  {formatDueDay(item.due_day, item.dueDate)}
                  {item.overdue && <span className="ml-1.5 text-red-400 font-medium">· Atrasado</span>}
                </p>
              </div>

              {/* Valor */}
              <p className={`text-sm font-bold flex-shrink-0 ${item.paid ? 'text-gray-300' : item.overdue ? 'text-red-500' : 'text-gray-700'}`}>
                {fmt(item.amount)}
              </p>

              {/* Botão pagar */}
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
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
