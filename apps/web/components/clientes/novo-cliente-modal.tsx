'use client'

import { useState, useTransition, useRef } from 'react'
import { UserPlus, X } from 'lucide-react'
import { criarCliente } from '@/app/(dashboard)/clientes/actions'

export function NovoClienteModal() {
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

    startTransition(async () => {
      try {
        await criarCliente({
          name:  fd.get('name') as string,
          phone: fd.get('phone') as string,
          notes: fd.get('notes') as string,
        })
        handleClose()
      } catch {
        setError('Erro ao salvar. Tente novamente.')
      }
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white hover:opacity-90 active:opacity-80 transition-opacity flex-shrink-0"
        style={{ backgroundColor: '#5B3FD4' }}
      >
        <UserPlus className="w-4 h-4" />
        <span className="hidden sm:inline">Novo cliente</span>
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
              <h2 className="text-base font-bold text-gray-900">Novo cliente</h2>
              <button onClick={handleClose} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <form ref={formRef} onSubmit={handleSubmit} className="px-5 pb-5 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nome</label>
                <input
                  name="name"
                  type="text"
                  placeholder="Nome completo"
                  required
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#5B3FD4] focus:ring-2 focus:ring-[#5B3FD4]/10 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Telefone / WhatsApp <span className="text-gray-300">(opcional)</span>
                </label>
                <input
                  name="phone"
                  type="tel"
                  placeholder="Ex: 11999999999"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#5B3FD4] focus:ring-2 focus:ring-[#5B3FD4]/10 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Observações <span className="text-gray-300">(opcional)</span>
                </label>
                <input
                  name="notes"
                  type="text"
                  placeholder="Ex: Indicado por Ana, prefere manhã..."
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#5B3FD4] focus:ring-2 focus:ring-[#5B3FD4]/10 transition"
                />
              </div>

              {error && (
                <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
              )}

              <button
                type="submit"
                disabled={isPending}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: '#5B3FD4' }}
              >
                {isPending ? 'Salvando...' : 'Salvar cliente'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
