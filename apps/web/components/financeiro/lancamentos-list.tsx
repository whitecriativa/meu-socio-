'use client'

import { useState, useTransition } from 'react'
import { Trash2, TrendingUp, TrendingDown, ChevronDown, ChevronUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { excluirLancamento } from '@/app/(dashboard)/financeiro/actions'

export interface LancamentoItem {
  id: string
  type: 'receita' | 'despesa'
  amount: number
  category: string
  description: string | null
  payment_method: string | null
  competence_date: string
}

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y!, m! - 1, d!).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

const PAYMENT_LABELS: Record<string, string> = {
  pix: 'Pix',
  dinheiro: 'Dinheiro',
  cartao_credito: 'Cartão crédito',
  cartao_debito: 'Cartão débito',
  transferencia: 'Transferência',
  boleto: 'Boleto',
}

export function LancamentosList({ items }: { items: LancamentoItem[] }) {
  const [expanded, setExpanded] = useState(true)
  const [list, setList] = useState(items)
  const [, startTransition] = useTransition()

  function handleDelete(id: string) {
    setList((prev) => prev.filter((i) => i.id !== id))
    startTransition(() => { excluirLancamento(id) })
  }

  const receitas = list.filter((i) => i.type === 'receita').reduce((s, i) => s + i.amount, 0)
  const despesas = list.filter((i) => i.type === 'despesa').reduce((s, i) => s + i.amount, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-sm font-semibold text-gray-700">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1.5 hover:text-gray-900 transition-colors"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            Lançamentos do mês
            <span className="text-xs font-normal text-gray-400 ml-1">({list.length})</span>
          </button>
          <div className="flex items-center gap-3 text-xs font-medium">
            <span className="text-[#1a9e5c]">+{fmt(receitas)}</span>
            <span className="text-red-500">−{fmt(despesas)}</span>
          </div>
        </CardTitle>
      </CardHeader>

      {expanded && (
        <CardContent className="p-0">
          {list.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-gray-400">Nenhum lançamento este mês</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {[...list]
                .sort((a, b) => b.competence_date.localeCompare(a.competence_date))
                .map((item) => (
                  <div key={item.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/50 group transition-colors">
                    {/* Ícone */}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      item.type === 'receita' ? 'bg-[#52D68A]/15' : 'bg-red-50'
                    }`}>
                      {item.type === 'receita'
                        ? <TrendingUp className="w-4 h-4 text-[#1a9e5c]" />
                        : <TrendingDown className="w-4 h-4 text-red-500" />
                      }
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-800 truncate">
                          {item.description || item.category}
                        </p>
                        <span className="text-xs text-gray-400 flex-shrink-0 hidden sm:inline">
                          {item.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-400">{formatDate(item.competence_date)}</span>
                        {item.payment_method && (
                          <span className="text-xs text-gray-400">
                            · {PAYMENT_LABELS[item.payment_method] ?? item.payment_method}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Valor */}
                    <p className={`text-sm font-bold flex-shrink-0 ${
                      item.type === 'receita' ? 'text-[#1a9e5c]' : 'text-red-500'
                    }`}>
                      {item.type === 'receita' ? '+' : '−'}{fmt(item.amount)}
                    </p>

                    {/* Botão excluir */}
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400 transition-all flex-shrink-0"
                      title="Excluir lançamento"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
