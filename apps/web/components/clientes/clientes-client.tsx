'use client'

import { useState, useTransition } from 'react'
import { Search, Users, TrendingUp, ChevronRight, Trash2, Star, AlertTriangle, UserCheck } from 'lucide-react'
import Link from 'next/link'
import { NovoClienteModal } from './novo-cliente-modal'
import { excluirCliente } from '@/app/(dashboard)/clientes/actions'

export type ClientStatus = 'ativo' | 'vip' | 'em_risco' | 'inativo'

export interface ClientItem {
  id: string
  name: string
  last_service: string
  last_visit: string
  days_since: number
  total_spent: number
  visits: number
  status: ClientStatus
  color: string
  notes: string | null
}

const STATUS_STYLES: Record<ClientStatus, { badge: string; label: string }> = {
  vip:      { badge: 'bg-[#0F40CB]/10 text-[#0F40CB]',  label: 'VIP'      },
  ativo:    { badge: 'bg-emerald-50 text-emerald-700',   label: 'Ativo'    },
  em_risco: { badge: 'bg-amber-50 text-amber-600',       label: 'Em risco' },
  inativo:  { badge: 'bg-gray-100 text-gray-400',        label: 'Inativo'  },
}

type FilterTab = 'todos' | ClientStatus

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'todos',    label: 'Todos'    },
  { key: 'ativo',    label: 'Ativos'   },
  { key: 'vip',      label: 'VIP'      },
  { key: 'em_risco', label: 'Em risco' },
  { key: 'inativo',  label: 'Inativos' },
]

export const COLORS = ['#0F40CB', '#B6F273', '#a78bfa', '#34d399', '#818cf8', '#fbbf24', '#f87171']

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

export function ClientesList({ clients: initialClients }: { clients: ClientItem[] }) {
  const [clients, setClients] = useState(initialClients)
  const [query, setQuery]     = useState('')
  const [tab, setTab]         = useState<FilterTab>('todos')
  const [, startTransition]   = useTransition()

  function handleDelete(e: React.MouseEvent, id: string) {
    e.preventDefault()
    e.stopPropagation()
    setClients((prev) => prev.filter((c) => c.id !== id))
    startTransition(() => { excluirCliente(id) })
  }

  const filtered = clients
    .filter((c) => tab === 'todos' || c.status === tab)
    .filter((c) =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.last_service.toLowerCase().includes(query.toLowerCase()),
    )

  const totalLtv   = clients.reduce((s, c) => s + c.total_spent, 0)
  const vipCount   = clients.filter((c) => c.status === 'vip').length
  const riskCount  = clients.filter((c) => c.status === 'em_risco').length
  const ativoCount = clients.filter((c) => c.status === 'ativo').length

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">CRM — Clientes</h1>
          <p className="text-sm text-gray-500 mt-0.5">{clients.length} clientes cadastrados</p>
        </div>
        <NovoClienteModal />
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl border border-gray-100 px-4 py-3">
          <p className="text-xs text-gray-400">LTV Total</p>
          <p className="text-lg font-bold text-[#0F40CB] mt-0.5">{fmt(totalLtv)}</p>
          <p className="text-xs text-gray-300 mt-0.5">receita acumulada</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 px-4 py-3">
          <p className="text-xs text-gray-400">Ativos</p>
          <p className="text-lg font-bold text-emerald-600 mt-0.5">{ativoCount}</p>
          <p className="text-xs text-gray-300 mt-0.5">clientes ativos</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 px-4 py-3">
          <div className="flex items-center gap-1">
            <p className="text-xs text-gray-400">VIP</p>
            <Star className="w-3 h-3 text-[#0F40CB]" />
          </div>
          <p className="text-lg font-bold text-[#0F40CB] mt-0.5">{vipCount}</p>
          <p className="text-xs text-gray-300 mt-0.5">R$ 500+ histórico</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 px-4 py-3">
          <div className="flex items-center gap-1">
            <p className="text-xs text-gray-400">Em Risco</p>
            <AlertTriangle className="w-3 h-3 text-amber-500" />
          </div>
          <p className="text-lg font-bold text-amber-500 mt-0.5">{riskCount}</p>
          <p className="text-xs text-gray-300 mt-0.5">15–30 dias sem visita</p>
        </div>
      </div>

      {/* Aviso em risco */}
      {riskCount > 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <p className="text-sm text-amber-700">
            <span className="font-semibold">{riskCount} cliente{riskCount > 1 ? 's' : ''} em risco</span>
            {' '}— sem visita há mais de 15 dias. Clique para ver e reativar.
          </p>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {FILTER_TABS.map((t) => {
          const count = t.key === 'todos'
            ? clients.length
            : clients.filter((c) => c.status === t.key).length
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                tab === t.key
                  ? 'bg-[#0F40CB] text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {t.label}
              {count > 0 && (
                <span className={`ml-1 ${tab === t.key ? 'opacity-70' : 'text-gray-400'}`}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Search */}
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

      {/* List */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
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
                  className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50/60 transition-colors group"
                >
                  {/* Avatar */}
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                    style={{ backgroundColor: color }}
                  >
                    {client.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900 truncate">{client.name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.badge}`}>
                        {s.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 truncate mt-0.5">
                      {client.last_service !== '—' ? client.last_service : 'Nenhum serviço registrado'}
                      {client.days_since > 0 && (
                        <span className={`ml-1.5 font-medium ${
                          client.status === 'em_risco' ? 'text-amber-500' :
                          client.status === 'inativo'  ? 'text-red-400'   : 'text-gray-400'
                        }`}>
                          · {client.days_since}d atrás
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Total */}
                  <div className="hidden sm:flex flex-col items-end gap-0.5 flex-shrink-0">
                    <p className="text-sm font-semibold text-gray-900">{fmt(client.total_spent)}</p>
                    <p className="text-xs text-gray-400">{client.visits} visita{client.visits !== 1 ? 's' : ''}</p>
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
      </div>

      {/* Footer */}
      <div className="flex items-center gap-1.5 text-xs text-gray-400">
        <TrendingUp className="w-3.5 h-3.5" />
        {filtered.length} cliente{filtered.length !== 1 ? 's' : ''} exibido{filtered.length !== 1 ? 's' : ''}
      </div>
    </div>
  )
}
