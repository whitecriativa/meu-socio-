'use client'

import { useState, useTransition } from 'react'
import { Pencil, X } from 'lucide-react'
import { salvarMeta } from '@/app/(dashboard)/metas/actions'

interface EditarMetaModalProps {
  currentGoal: number
  currentDream: string
}

export function EditarMetaModal({ currentGoal, currentDream }: EditarMetaModalProps) {
  const [open, setOpen]              = useState(false)
  const [goal, setGoal]              = useState(String(currentGoal || ''))
  const [dream, setDream]            = useState(currentDream || '')
  const [error, setError]            = useState('')
  const [isPending, startTransition] = useTransition()

  function handleClose() {
    setOpen(false)
    setError('')
    setGoal(String(currentGoal || ''))
    setDream(currentDream || '')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const amount = parseFloat(goal.replace(',', '.'))
    if (isNaN(amount) || amount <= 0) {
      setError('Informe uma meta válida maior que zero.')
      return
    }

    startTransition(async () => {
      try {
        await salvarMeta({ monthly_goal: amount, dream })
        setOpen(false)
      } catch {
        setError('Erro ao salvar. Tente novamente.')
      }
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#5B3FD4] bg-[#5B3FD4]/8 hover:bg-[#5B3FD4]/15 transition-colors"
      >
        <Pencil className="w-3 h-3" />
        Editar meta
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
          onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
        >
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <h2 className="text-base font-bold text-gray-900">Sua meta e sonho</h2>
              <button onClick={handleClose} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-5 pb-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Meta mensal (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={goal}
                  onChange={(e) => setGoal(e.currentTarget.value)}
                  placeholder="Ex: 5000"
                  required
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#5B3FD4] focus:ring-2 focus:ring-[#5B3FD4]/10 transition"
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  Quanto você quer faturar por mês?
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Seu sonho <span className="text-gray-300">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={dream}
                  onChange={(e) => setDream(e.currentTarget.value)}
                  placeholder="Ex: Viagem para Europa, trocar de carro..."
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#5B3FD4] focus:ring-2 focus:ring-[#5B3FD4]/10 transition"
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  O Sócio vai usar isso nas mensagens motivacionais.
                </p>
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
                {isPending ? 'Salvando...' : 'Salvar meta'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
