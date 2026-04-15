'use client'

import { useState, useTransition } from 'react'
import {
  Phone, Calendar, TrendingUp, Clock, CheckCircle, AlertCircle,
  RefreshCw, Edit2, X, ArrowUpCircle, ArrowDownCircle,
  Star, StickyNote, Save, BarChart2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { reativarCliente, editarCliente, editarNota, marcarVip } from '@/app/(dashboard)/clientes/actions'
import type { ClienteDetalhado } from '@/app/(dashboard)/clientes/[id]/page'

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

function formatDatetime(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
}

function daysSince(iso: string | null): number {
  if (!iso) return 0
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24))
}

type StatusKey = 'vip' | 'ativo' | 'em_risco' | 'inativo'

const STATUS_STYLES: Record<StatusKey, { badge: string; label: string }> = {
  vip:      { badge: 'bg-[#0F40CB]/10 text-[#0F40CB]', label: 'VIP'      },
  ativo:    { badge: 'bg-emerald-50 text-emerald-700',  label: 'Ativo'    },
  em_risco: { badge: 'bg-amber-50 text-amber-600',      label: 'Em risco' },
  inativo:  { badge: 'bg-gray-100 text-gray-400',       label: 'Inativo'  },
}

const APT_STATUS_STYLES: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  confirmado: { icon: <CheckCircle className="w-3.5 h-3.5" />, label: 'Confirmado', color: 'text-[#0F40CB]' },
  concluido:  { icon: <CheckCircle className="w-3.5 h-3.5" />, label: 'Concluído',  color: 'text-[#0F40CB]' },
  pendente:   { icon: <Clock       className="w-3.5 h-3.5" />, label: 'Pendente',   color: 'text-amber-500' },
  cancelado:  { icon: <AlertCircle className="w-3.5 h-3.5" />, label: 'Cancelado',  color: 'text-red-400'   },
}

function EditarModal({ cliente, onClose }: { cliente: ClienteDetalhado; onClose: () => void }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        await editarCliente(cliente.id, {
          name:  fd.get('name') as string,
          phone: fd.get('phone') as string,
        })
        onClose()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao salvar')
      }
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h2 className="text-base font-bold text-gray-900">Editar cliente</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 pb-5 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nome</label>
            <input
              name="name"
              type="text"
              defaultValue={cliente.name}
              required
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#0F40CB] focus:ring-2 focus:ring-[#0F40CB]/10 transition"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Telefone / WhatsApp <span className="text-gray-300">(opcional)</span>
            </label>
            <input
              name="phone"
              type="tel"
              defaultValue={cliente.phone ?? ''}
              placeholder="Ex: 11999999999"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#0F40CB] focus:ring-2 focus:ring-[#0F40CB]/10 transition"
            />
          </div>
          {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ backgroundColor: '#0F40CB' }}
          >
            {isPending ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </form>
      </div>
    </div>
  )
}

function NotasEditor({ clienteId, initialNotes }: { clienteId: string; initialNotes: string | null }) {
  const [notes, setNotes]     = useState(initialNotes ?? '')
  const [editing, setEditing] = useState(false)
  const [saved, setSaved]     = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    startTransition(async () => {
      await editarNota(clienteId, notes)
      setEditing(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold text-gray-700 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <StickyNote className="w-4 h-4 text-[#0F40CB]" />
            Anotações
          </span>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="text-xs text-[#0F40CB] hover:underline font-normal"
            >
              {notes ? 'Editar' : 'Adicionar'}
            </button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {editing ? (
          <div className="space-y-2">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Prefere atendimento às terças, tem alergia a produto X, cliente indicado por Maria..."
              rows={3}
              autoFocus
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 outline-none focus:border-[#0F40CB] focus:ring-2 focus:ring-[#0F40CB]/10 transition resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0F40CB] text-white text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                <Save className="w-3 h-3" />
                {isPending ? 'Salvando...' : 'Salvar'}
              </button>
              <button
                onClick={() => { setEditing(false); setNotes(initialNotes ?? '') }}
                className="px-3 py-1.5 rounded-lg text-xs text-gray-500 hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : notes ? (
          <p className="text-sm text-gray-600 whitespace-pre-wrap">
            {notes}
            {saved && <span className="ml-2 text-xs text-emerald-500">Salvo ✓</span>}
          </p>
        ) : (
          <p className="text-sm text-gray-400 italic">
            Nenhuma anotação. Clique em &quot;Adicionar&quot; para registrar observações sobre este cliente.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export function ClienteDetalhe({ cliente }: { cliente: ClienteDetalhado }) {
  const [editOpen, setEditOpen]       = useState(false)
  const [isPending, startTransition]  = useTransition()
  const [reativado, setReativado]     = useState(false)
  const [isVip, setIsVip]             = useState(cliente.status === 'vip')

  const statusKey = (isVip ? 'vip' : cliente.status) as StatusKey
  const statusStyle = STATUS_STYLES[statusKey] ?? STATUS_STYLES.ativo
  const dias      = daysSince(cliente.last_contact)
  const totalApts = cliente.appointments.length
  const avgTicket = totalApts > 0 ? cliente.total_spent / totalApts : 0

  function handleReativar() {
    startTransition(async () => {
      await reativarCliente(cliente.id)
      setReativado(true)
    })
  }

  function handleMarcarVip() {
    startTransition(async () => {
      await marcarVip(cliente.id)
      setIsVip(true)
    })
  }

  return (
    <>
      {editOpen && <EditarModal cliente={cliente} onClose={() => setEditOpen(false)} />}

      {/* Header */}
      <div className="flex items-start gap-4 mb-5">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-bold flex-shrink-0"
          style={{ backgroundColor: cliente.color }}
        >
          {cliente.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-gray-900">{cliente.name}</h1>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusStyle.badge}`}>
              {statusStyle.label}
            </span>
          </div>
          {cliente.phone && (
            <a
              href={`https://wa.me/55${cliente.phone.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-[#0F40CB] transition-colors mt-0.5"
            >
              <Phone className="w-3.5 h-3.5" />
              {cliente.phone}
            </a>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {!isVip && (
            <button
              onClick={handleMarcarVip}
              disabled={isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#0F40CB] bg-[#0F40CB]/8 hover:bg-[#0F40CB]/15 transition-colors disabled:opacity-60"
            >
              <Star className="w-3 h-3" />
              VIP
            </button>
          )}
          <button
            onClick={() => setEditOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <Edit2 className="w-3 h-3" />
            Editar
          </button>
        </div>
      </div>

      {/* Alertas */}
      {cliente.status === 'em_risco' && !reativado && (
        <div className="mb-4 bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-amber-700">Cliente em risco — {dias} dias sem visita</p>
            <p className="text-xs text-amber-600 mt-0.5">Considere entrar em contato para trazer de volta.</p>
          </div>
          {cliente.phone && (
            <a
              href={`https://wa.me/55${cliente.phone.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 transition-colors flex-shrink-0"
            >
              <Phone className="w-3.5 h-3.5" />
              Chamar
            </a>
          )}
        </div>
      )}
      {cliente.status === 'inativo' && !reativado && (
        <div className="mb-4 bg-red-50 border border-red-100 rounded-xl p-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-red-700">Cliente inativo há {dias} dias</p>
            <p className="text-xs text-red-600 mt-0.5">Que tal entrar em contato para reativá-lo?</p>
          </div>
          <button
            onClick={handleReativar}
            disabled={isPending}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white bg-red-400 hover:bg-red-500 transition-colors flex-shrink-0 disabled:opacity-60"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reativar
          </button>
        </div>
      )}
      {reativado && (
        <div className="mb-4 bg-[#B6F273]/10 border border-[#B6F273]/20 rounded-xl p-3">
          <p className="text-sm font-semibold text-[#0F40CB]">Cliente reativado com sucesso!</p>
        </div>
      )}

      {/* Métricas — 4 cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <Card>
          <CardContent className="p-3 text-center">
            <TrendingUp className="w-4 h-4 text-[#0F40CB] mx-auto mb-1" />
            <p className="text-base font-bold text-gray-900">{fmt(cliente.total_spent)}</p>
            <p className="text-xs text-gray-400">LTV total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <Calendar className="w-4 h-4 text-[#0F40CB] mx-auto mb-1" />
            <p className="text-base font-bold text-gray-900">{totalApts}</p>
            <p className="text-xs text-gray-400">Atendimentos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <BarChart2 className="w-4 h-4 text-[#0F40CB] mx-auto mb-1" />
            <p className="text-base font-bold text-gray-900">
              {cliente.frequency_per_month > 0 ? `${cliente.frequency_per_month}x` : '—'}
            </p>
            <p className="text-xs text-gray-400">por mês</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <Clock className="w-4 h-4 text-[#0F40CB] mx-auto mb-1" />
            <p className="text-base font-bold text-gray-900">{dias > 0 ? `${dias}d` : 'Hoje'}</p>
            <p className="text-xs text-gray-400">Último contato</p>
          </CardContent>
        </Card>
      </div>

      {/* Ticket médio */}
      {avgTicket > 0 && (
        <div className="mb-4 bg-[#0F40CB]/5 rounded-xl px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-gray-600">Ticket médio por atendimento</span>
          <span className="text-sm font-bold text-[#0F40CB]">{fmt(avgTicket)}</span>
        </div>
      )}

      {/* Anotações */}
      <div className="mb-4">
        <NotasEditor clienteId={cliente.id} initialNotes={cliente.notes} />
      </div>

      {/* Histórico de atendimentos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-[#0F40CB]" />
            Histórico de atendimentos
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {cliente.appointments.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-gray-400">Nenhum atendimento registrado</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {cliente.appointments.map((apt) => {
                const aptStyle = APT_STATUS_STYLES[apt.status] ?? APT_STATUS_STYLES['pendente']!
                return (
                  <div key={apt.id} className="flex items-start gap-3 px-4 py-3.5">
                    <div className={`mt-0.5 flex-shrink-0 ${aptStyle.color}`}>
                      {aptStyle.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800">{apt.service}</p>
                      <p className="text-xs text-gray-400">{formatDatetime(apt.scheduled_at)}</p>
                      {apt.notes && (
                        <p className="text-xs text-gray-400 mt-0.5 italic">{apt.notes}</p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      {apt.price > 0 && (
                        <p className="text-sm font-semibold text-gray-700">{fmt(apt.price)}</p>
                      )}
                      <p className={`text-xs font-medium ${aptStyle.color}`}>{aptStyle.label}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Histórico financeiro */}
      {cliente.transactions.length > 0 && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-[#0F40CB]" />
              Histórico financeiro
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-50">
              {cliente.transactions.map((tx) => (
                <div key={tx.id} className="flex items-start gap-3 px-4 py-3.5">
                  <div className={`mt-0.5 flex-shrink-0 ${tx.type === 'receita' ? 'text-[#0F40CB]' : 'text-red-400'}`}>
                    {tx.type === 'receita'
                      ? <ArrowUpCircle className="w-3.5 h-3.5" />
                      : <ArrowDownCircle className="w-3.5 h-3.5" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 capitalize">{tx.category}</p>
                    {tx.description && (
                      <p className="text-xs text-gray-400 truncate">{tx.description}</p>
                    )}
                    <p className="text-xs text-gray-400">
                      {formatDate(tx.competence_date)}
                      {tx.payment_method && ` · ${tx.payment_method.replace('_', ' ')}`}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-sm font-semibold ${tx.type === 'receita' ? 'text-[#0F40CB]' : 'text-red-500'}`}>
                      {tx.type === 'receita' ? '+' : '-'}{fmt(tx.amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <p className="mt-4 text-xs text-gray-400 text-right">
        Último contato: {formatDate(cliente.last_contact)}
      </p>
    </>
  )
}
