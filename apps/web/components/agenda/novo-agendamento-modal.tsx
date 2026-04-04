'use client'

import { useState, useTransition, useRef } from 'react'
import { Plus, X } from 'lucide-react'
import { criarAgendamento } from '@/app/(dashboard)/agenda/actions'

const TODAY = new Date().toISOString().slice(0, 10)

export function NovoAgendamentoModal() {
  const [open, setOpen]              = useState(false)
  const [error, setError]            = useState('')
  const [isPending, startTransition] = useTransition()
  const formRef                      = useRef<HTMLFormElement>(null)

  function handleClose() {
    setOpen(false)
    setError('')
    formRef.current?.reset()
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const fd = new FormData(e.currentTarget)

    const price = parseFloat((fd.get('price') as string || '0').replace(',', '.'))

    startTransition(async () => {
      try {
        await criarAgendamento({
          client_name: fd.get('client_name') as string,
          service:     fd.get('service') as string,
          date:        fd.get('date') as string,
          time:        fd.get('time') as string,
          price:       isNaN(price) ? 0 : price,
          status:      fd.get('status') as 'confirmado' | 'pendente',
          notes:       fd.get('notes') as string,
        })
        handleClose()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao salvar')
      }
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white hover:opacity-90 active:opacity-80 transition-opacity flex-shrink-0"
        style={{ backgroundColor: '#0F40CB' }}
      >
        <Plus className="w-4 h-4" />
        <span className="hidden sm:inline">Novo agendamento</span>
        <span className="sm:hidden">Novo</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
          onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
        >
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <h2 className="text-base font-bold text-gray-900">Novo agendamento</h2>
              <button onClick={handleClose} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <form ref={formRef} onSubmit={handleSubmit} className="px-5 pb-5 space-y-3">
              {/* Cliente */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nome do cliente</label>
                <input
                  name="client_name"
                  type="text"
                  placeholder="Ex: João Silva"
                  required
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#0F40CB] focus:ring-2 focus:ring-[#0F40CB]/10 transition"
                />
              </div>

              {/* Serviço */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Serviço / descrição</label>
                <input
                  name="service"
                  type="text"
                  placeholder="Ex: Consultoria, Projeto site, Aula..."
                  required
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#0F40CB] focus:ring-2 focus:ring-[#0F40CB]/10 transition"
                />
              </div>

              {/* Data + Hora */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Data</label>
                  <input
                    name="date"
                    type="date"
                    defaultValue={TODAY}
                    required
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#0F40CB] focus:ring-2 focus:ring-[#0F40CB]/10 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Horário</label>
                  <input
                    name="time"
                    type="time"
                    defaultValue="09:00"
                    required
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#0F40CB] focus:ring-2 focus:ring-[#0F40CB]/10 transition"
                  />
                </div>
              </div>

              {/* Valor + Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Valor <span className="text-gray-300">(opcional)</span>
                  </label>
                  <input
                    name="price"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#0F40CB] focus:ring-2 focus:ring-[#0F40CB]/10 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                  <select
                    name="status"
                    defaultValue="confirmado"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#0F40CB] focus:ring-2 focus:ring-[#0F40CB]/10 transition bg-white"
                  >
                    <option value="confirmado">Confirmado</option>
                    <option value="pendente">Pendente</option>
                  </select>
                </div>
              </div>

              {/* Observações */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Observações <span className="text-gray-300">(opcional)</span>
                </label>
                <input
                  name="notes"
                  type="text"
                  placeholder="Ex: Cliente preferencial, endereço..."
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#0F40CB] focus:ring-2 focus:ring-[#0F40CB]/10 transition"
                />
              </div>

              {error && (
                <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
              )}

              <button
                type="submit"
                disabled={isPending}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: '#0F40CB' }}
              >
                {isPending ? 'Salvando...' : 'Salvar agendamento'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
