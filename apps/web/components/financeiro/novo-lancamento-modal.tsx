'use client'

import { useState, useTransition, useRef } from 'react'
import { Plus, X, TrendingUp, TrendingDown } from 'lucide-react'
import { salvarLancamento } from '@/app/(dashboard)/financeiro/actions'

// Sugestões genéricas — o usuário pode digitar qualquer coisa
const SUGESTOES_RECEITA = [
  'Serviço prestado', 'Venda de produto', 'Projeto', 'Consultoria',
  'Comissão', 'Adiantamento', 'Outros',
]

const SUGESTOES_DESPESA = [
  'Material / insumo', 'Aluguel', 'Transporte', 'Marketing',
  'Alimentação', 'Assinatura', 'Equipamento', 'Imposto', 'Outros',
]

const PAGAMENTOS = ['Pix', 'Dinheiro', 'Cartão de crédito', 'Cartão de débito', 'Transferência']

const TODAY = new Date().toISOString().slice(0, 10)

export function NovoLancamentoModal() {
  const [open, setOpen]         = useState(false)
  const [type, setType]         = useState<'receita' | 'despesa'>('receita')
  const [error, setError]       = useState('')
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  const sugestoes = type === 'receita' ? SUGESTOES_RECEITA : SUGESTOES_DESPESA

  function handleClose() {
    setOpen(false)
    setError('')
    formRef.current?.reset()
    setType('receita')
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')

    const fd      = new FormData(e.currentTarget)
    const amount  = parseFloat((fd.get('amount') as string).replace(',', '.'))

    if (isNaN(amount) || amount <= 0) {
      setError('Informe um valor válido maior que zero.')
      return
    }

    startTransition(async () => {
      try {
        await salvarLancamento({
          type,
          amount,
          category:        fd.get('category') as string,
          description:     fd.get('description') as string,
          payment_method:  fd.get('payment_method') as string,
          competence_date: fd.get('competence_date') as string,
        })
        handleClose()
      } catch {
        setError('Erro ao salvar. Tente novamente.')
      }
    })
  }

  return (
    <>
      {/* Botão de abertura */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90 active:opacity-80 flex-shrink-0"
        style={{ backgroundColor: '#5B3FD4' }}
      >
        <Plus className="w-4 h-4" />
        <span className="hidden sm:inline">Novo lançamento</span>
        <span className="sm:hidden">Novo</span>
      </button>

      {/* Overlay + Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
          onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
        >
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            {/* Cabeçalho */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <h2 className="text-base font-bold text-gray-900">Novo lançamento</h2>
              <button onClick={handleClose} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <form ref={formRef} onSubmit={handleSubmit} className="px-5 pb-5 space-y-4">
              {/* Toggle Receita / Despesa */}
              <div className="flex gap-2">
                {(['receita', 'despesa'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                      type === t
                        ? t === 'receita'
                          ? 'border-[#52D68A] bg-[#52D68A]/10 text-[#1a9e5c]'
                          : 'border-red-400 bg-red-50 text-red-600'
                        : 'border-gray-100 text-gray-400 hover:border-gray-200'
                    }`}
                  >
                    {t === 'receita'
                      ? <TrendingUp className="w-4 h-4" />
                      : <TrendingDown className="w-4 h-4" />}
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>

              {/* Valor */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Valor (R$)</label>
                <input
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0,00"
                  required
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-[#5B3FD4] focus:ring-2 focus:ring-[#5B3FD4]/10 transition"
                />
              </div>

              {/* Categoria — texto livre com sugestões */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Categoria</label>
                <input
                  name="category"
                  type="text"
                  list="categoria-sugestoes"
                  required
                  placeholder="Ex: Serviço prestado, Aluguel..."
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-[#5B3FD4] focus:ring-2 focus:ring-[#5B3FD4]/10 transition"
                />
                <datalist id="categoria-sugestoes">
                  {sugestoes.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Descrição <span className="text-gray-300">(opcional)</span>
                </label>
                <input
                  name="description"
                  type="text"
                  placeholder="Ex: Cliente João, Projeto site..."
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-[#5B3FD4] focus:ring-2 focus:ring-[#5B3FD4]/10 transition"
                />
              </div>

              {/* Linha: Forma de pagamento + Data */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Pagamento</label>
                  <select
                    name="payment_method"
                    required
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-[#5B3FD4] focus:ring-2 focus:ring-[#5B3FD4]/10 transition bg-white"
                  >
                    <option value="">Selecione...</option>
                    {PAGAMENTOS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Data</label>
                  <input
                    name="competence_date"
                    type="date"
                    defaultValue={TODAY}
                    required
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-[#5B3FD4] focus:ring-2 focus:ring-[#5B3FD4]/10 transition"
                  />
                </div>
              </div>

              {/* Erro */}
              {error && (
                <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
              )}

              {/* Botão salvar */}
              <button
                type="submit"
                disabled={isPending}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: type === 'receita' ? '#52D68A' : '#ef4444' }}
              >
                {isPending
                  ? 'Salvando...'
                  : `Salvar ${type === 'receita' ? 'receita' : 'despesa'}`}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
