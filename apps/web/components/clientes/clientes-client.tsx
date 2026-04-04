'use client'

import { useState, useTransition } from 'react'
import { Search, Users, TrendingUp, ChevronRight, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { NovoClienteModal } from './novo-cliente-modal'
import { excluirCliente } from '@/app/(dashboard)/clientes/actions'

export interface ClientItem {
  id: string
  name: string
  last_service: string
  last_visit: string    // formatted 'DD/MM/YYYY' or '—'
  total_spent: number
  visits: number
  status: 'ativo' | 'inativo' | 'vip'
  color: string
}

const STATUS_STYLES = {
  vip:     { badge: 'bg-[#0F40CB]/10 text-[#0F40CB]', label: 'VIP'     },
  ativo:   { badge: 'bg-[#B6F273]/15 text-[#0F40CB]',  label: 'Ativo'   },
  inativo: { badge: 'bg-gray-100 text-gray-400',        label: 'Inativo' },
}

const COLORS = ['#0F40CB', '#B6F273', '#a78bfa', '#34d399', '#818cf8', '#fbbf24', '#f87171']

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

export function ClientesList({ clients: initialClients }: { clients: ClientItem[] }) {
  const [clients, setClients] = useState(initialClients)
  const [query, setQuery] = useState('')
  const [, startTransition] = useTransition()

  function handleDelete(e: React.MouseEvent, id: string) {
    e.preventDefault()
    e.stopPropagation()
    setClients((prev) => prev.filter((c) => c.id !== id))
    startTransition(() => { excluirCliente(id) })
  }

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.last_service.toLowerCase().includes(query.toLowerCase()),
  )

  const ativos   = clients.filter((c) => c.status !== 'inativo').length
  const inativos = clients.filter((c) => c.status === 'inativo').length

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Clientes</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {ativos} ativo{ativos !== 1 ? 's' : ''} · {inativos} inativo{inativos !== 1 ? 's' : ''}
          </p>
        </div>
        <NovoClienteModal />
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nome ou serviço..."
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#0F40CB] focus:ring-2 focus:ring-[#0F40CB]/10 transition"
        />
      </div>

      {/* Lista */}
      <Card>
        <CardContent className="p-0">
          {clients.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Nenhum cliente ainda</p>
              <p className="text-xs text-gray-300 mt-1">
                Clientes são criados automaticamente pelo WhatsApp
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Nenhum cliente encontrado</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filtered.map((client, i) => {
                const s     = STATUS_STYLES[client.status]
                const color = client.color || COLORS[i % COLORS.length] || '#0F40CB'
                return (
                  <Link
                    key={client.id}
                    href={`/clientes/${client.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/50 transition-colors group"
                  >
                    {/* Avatar */}
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                      style={{ backgroundColor: color }}
                    >
                      {client.name.charAt(0).toUpperCase()}
                    </div>

                    {/* Info principal */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-gray-900 truncate">{client.name}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.badge}`}>
                          {s.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{client.last_service}</p>
                    </div>

                    {/* Total gasto */}
                    <div className="hidden sm:flex flex-col items-end gap-0.5 flex-shrink-0">
                      <p className="text-sm font-semibold text-gray-900">{fmt(client.total_spent)}</p>
                      <p className="text-xs text-gray-400">{client.visits} visita{client.visits !== 1 ? 's' : ''}</p>
                    </div>

                    {/* Último atendimento */}
                    <div className="hidden md:flex flex-col items-end gap-0.5 flex-shrink-0 ml-4 w-28">
                      <p className="text-xs text-gray-400">Último atend.</p>
                      <p className="text-xs font-medium text-gray-600">{client.last_visit}</p>
                    </div>

                    <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0 group-hover:hidden" />
                    <button
                      onClick={(e) => handleDelete(e, client.id)}
                      className="hidden group-hover:flex p-1 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400 transition-all flex-shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </Link>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rodapé */}
      <div className="flex items-center gap-1.5 text-xs text-gray-400">
        <TrendingUp className="w-3.5 h-3.5" />
        {filtered.length} cliente{filtered.length !== 1 ? 's' : ''} exibido{filtered.length !== 1 ? 's' : ''}
      </div>
    </div>
  )
}

export { COLORS }
