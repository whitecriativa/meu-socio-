'use client'

import { useState, useTransition, useRef } from 'react'
import { Plus, X } from 'lucide-react'
import { criarTarefa } from '@/app/(dashboard)/tarefas/actions'

const QUADRANTS = [
  { value: 'urgent_important',      label: 'Urgente e importante',      desc: 'Fazer agora' },
  { value: 'important_not_urgent',  label: 'Importante, não urgente',   desc: 'Planejar' },
  { value: 'urgent_not_important',  label: 'Urgente, não importante',   desc: 'Delegar se possível' },
  { value: 'neither',               label: 'Nem urgente nem importante', desc: 'Eliminar ou depois' },
] as const

type Quadrant = typeof QUADRANTS[number]['value']

function quadrantFromPriority(p: string): Quadrant {
  if (p === 'high')   return 'urgent_important'
  if (p === 'low')    return 'neither'
  return 'important_not_urgent'
}

const TODAY = new Date().toISOString().slice(0, 10)

export function NovaTarefaModal() {
  const [open, setOpen]              = useState(false)
  const [error, setError]            = useState('')
  const [quadrant, setQuadrant]      = useState<Quadrant>('important_not_urgent')
  const [isPending, startTransition] = useTransition()
  const formRef                      = useRef<HTMLFormElement>(null)

  function handleClose() {
    setOpen(false)
    setError('')
    setQuadrant('important_not_urgent')
    formRef.current?.reset()
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const fd = new FormData(e.currentTarget)

    startTransition(async () => {
      try {
        await criarTarefa({
          title:    fd.get('title') as string,
          priority: quadrant === 'urgent_important' ? 'high' : quadrant === 'neither' ? 'low' : 'medium',
          quadrant,
          due_date: (fd.get('due_date') as string) || null,
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
        <span className="hidden sm:inline">Nova tarefa</span>
        <span className="sm:hidden">Nova</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
          onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
        >
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <h2 className="text-base font-bold text-gray-900">Nova tarefa</h2>
              <button onClick={handleClose} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <form ref={formRef} onSubmit={handleSubmit} className="px-5 pb-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tarefa</label>
                <input
                  name="title"
                  type="text"
                  placeholder="O que precisa ser feito?"
                  required
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#0F40CB] focus:ring-2 focus:ring-[#0F40CB]/10 transition"
                />
              </div>

              {/* Matriz de Eisenhower */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Prioridade</label>
                <div className="grid grid-cols-2 gap-2">
                  {QUADRANTS.map((q) => (
                    <button
                      key={q.value}
                      type="button"
                      onClick={() => setQuadrant(q.value)}
                      className={`text-left px-3 py-2 rounded-xl border-2 transition-all ${
                        quadrant === q.value
                          ? 'border-[#0F40CB] bg-[#0F40CB]/5'
                          : 'border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      <p className={`text-xs font-semibold ${quadrant === q.value ? 'text-[#0F40CB]' : 'text-gray-700'}`}>
                        {q.label}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{q.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Prazo <span className="text-gray-300">(opcional)</span>
                </label>
                <input
                  name="due_date"
                  type="date"
                  min={TODAY}
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
                {isPending ? 'Salvando...' : 'Salvar tarefa'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
