'use client'

import { useState, useTransition } from 'react'
import { Plus, Trash2, X, Clock, DollarSign, Tag, ToggleLeft, ToggleRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { criarServico, excluirServico, toggleServico } from '@/app/(dashboard)/servicos/actions'

export type Servico = {
  id: string
  name: string
  price: number | null
  duration_min: number | null
  description: string | null
  active: boolean
}

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

export function ServicosClient({ initialServices }: { initialServices: Servico[] }) {
  const [services, setServices] = useState(initialServices)
  const [showForm, setShowForm] = useState(false)
  const [, startTransition]     = useTransition()

  function handleDelete(id: string) {
    setServices((prev) => prev.filter((s) => s.id !== id))
    startTransition(() => excluirServico(id))
  }

  function handleToggle(id: string, active: boolean) {
    setServices((prev) => prev.map((s) => s.id === id ? { ...s, active } : s))
    startTransition(() => toggleServico(id, active))
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Catálogo de Serviços</h1>
          <p className="text-sm text-gray-500 mt-0.5">Seus serviços com preço e duração definidos</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#0F40CB' }}
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancelar' : 'Novo serviço'}
        </button>
      </div>

      {/* Formulário */}
      {showForm && (
        <Card>
          <CardContent className="pt-5">
            <form
              action={async (fd) => {
                const name = String(fd.get('name') ?? '').trim()
                if (!name) return
                const price = parseFloat(String(fd.get('price') ?? '0').replace(',', '.'))
                const dur   = parseInt(String(fd.get('duration_min') ?? '60'))
                const desc  = String(fd.get('description') ?? '').trim()
                const tempId = `tmp-${Date.now()}`
                setServices((prev) => [...prev, {
                  id: tempId, name,
                  price: price > 0 ? price : null,
                  duration_min: dur > 0 ? dur : null,
                  description: desc || null,
                  active: true,
                }])
                setShowForm(false)
                startTransition(() => criarServico(fd))
              }}
              className="space-y-3"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-1 space-y-1">
                  <label className="text-xs font-medium text-gray-600">Nome do serviço *</label>
                  <input
                    name="name" type="text" required
                    placeholder="Ex: Corte feminino, Consultoria, Design..."
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#0F40CB] transition"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600">Preço (R$)</label>
                  <input
                    name="price" type="number" min="0" step="0.01"
                    placeholder="Ex: 150"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#0F40CB] transition"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600">Duração (min)</label>
                  <input
                    name="duration_min" type="number" min="1" defaultValue="60"
                    placeholder="Ex: 60"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#0F40CB] transition"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">Descrição <span className="text-gray-400">(opcional)</span></label>
                <input
                  name="description" type="text"
                  placeholder="Detalhes do que está incluído..."
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#0F40CB] transition"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition"
                  style={{ backgroundColor: '#0F40CB' }}
                >
                  Salvar serviço
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Lista */}
      {services.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center">
            <Tag className="w-10 h-10 text-gray-200 mb-3" />
            <p className="text-sm text-gray-400">Nenhum serviço cadastrado</p>
            <p className="text-xs text-gray-300 mt-1">Adicione seus serviços para agilizar agendamentos</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {services.map((s) => (
            <Card key={s.id} className={s.active ? '' : 'opacity-50'}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{s.name}</p>
                    {s.description && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{s.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      {s.price != null && (
                        <span className="flex items-center gap-1 text-xs font-semibold text-[#0F40CB]">
                          <DollarSign className="w-3 h-3" />
                          {fmt(s.price)}
                        </span>
                      )}
                      {s.duration_min != null && (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Clock className="w-3 h-3" />
                          {s.duration_min}min
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleToggle(s.id, !s.active)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 transition text-gray-400"
                      title={s.active ? 'Desativar' : 'Ativar'}
                    >
                      {s.active
                        ? <ToggleRight className="w-4 h-4 text-[#0F40CB]" />
                        : <ToggleLeft className="w-4 h-4" />
                      }
                    </button>
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
