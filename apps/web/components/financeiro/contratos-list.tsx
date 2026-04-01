'use client'

import { useState, useTransition } from 'react'
import {
  FileText, ChevronDown, ChevronUp, CheckCircle2,
  Clock, AlertCircle, Plus, X, Calendar,
} from 'lucide-react'
import { criarContrato, pagarParcela, cancelarContrato } from '@/app/(dashboard)/financeiro/contrato-actions'

export interface Installment {
  id: string
  installment_number: number
  amount: number
  due_date: string
  status: 'pendente' | 'pago' | 'atrasado'
  paid_at: string | null
}

export interface ContratoDado {
  id: string
  client_name: string
  description: string
  total_amount: number
  installments_count: number
  start_date: string
  status: 'ativo' | 'concluido' | 'cancelado'
  installments: Installment[]
}

interface Props {
  contratos: ContratoDado[]
}

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

function fmtDate(d: string) {
  const parts = d.split('-').map(Number)
  const y = parts[0]!
  const m = parts[1]!
  const day = parts[2]!
  return new Date(y, m - 1, day).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

const today = new Date().toISOString().substring(0, 10)

function effectiveStatus(inst: Installment): 'pago' | 'atrasado' | 'pendente' {
  if (inst.status === 'pago')                         return 'pago'
  if (inst.due_date < today && inst.status !== 'pago') return 'atrasado'
  return 'pendente'
}

const STATUS_BADGE = {
  pago:     'bg-[#52D68A]/15 text-[#1a9e5c]',
  pendente: 'bg-amber-50 text-amber-600',
  atrasado: 'bg-red-50 text-red-500',
}

const STATUS_ICON = {
  pago:     <CheckCircle2 className="w-3.5 h-3.5 text-[#1a9e5c]" />,
  pendente: <Clock className="w-3.5 h-3.5 text-amber-500" />,
  atrasado: <AlertCircle className="w-3.5 h-3.5 text-red-500" />,
}

const STATUS_LABEL = { pago: 'Paga', pendente: 'Pendente', atrasado: 'Atrasada' }

const AVATAR_COLORS = ['#5B3FD4', '#52D68A', '#a78bfa', '#34d399', '#818cf8']

function ContratoCard({
  contrato,
  index,
  onPay,
  onCancel,
}: {
  contrato: ContratoDado
  index: number
  onPay: (id: string) => void
  onCancel: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)

  const paid   = contrato.installments.filter((i) => i.status === 'pago').length
  const paidAmount = contrato.installments
    .filter((i) => i.status === 'pago')
    .reduce((s, i) => s + i.amount, 0)
  const progress  = contrato.installments_count > 0
    ? (paid / contrato.installments_count) * 100
    : 0

  const nextPending = contrato.installments
    .filter((i) => effectiveStatus(i) !== 'pago')
    .sort((a, b) => a.installment_number - b.installment_number)[0]

  const isConcluido  = contrato.status === 'concluido'
  const isCancelado  = contrato.status === 'cancelado'

  return (
    <div className={`rounded-xl border transition-colors ${
      isConcluido  ? 'border-[#52D68A]/30 bg-[#52D68A]/3' :
      isCancelado  ? 'border-gray-100 bg-gray-50 opacity-60' :
                     'border-gray-100 bg-white hover:border-gray-200'
    }`}>
      {/* Cabeçalho do contrato */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{ backgroundColor: AVATAR_COLORS[index % AVATAR_COLORS.length] }}
          >
            {contrato.client_name.charAt(0).toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <p className="text-sm font-semibold text-gray-900 truncate">{contrato.client_name}</p>
              {isConcluido && (
                <span className="text-[10px] font-semibold text-[#1a9e5c] bg-[#52D68A]/15 px-2 py-0.5 rounded-full flex-shrink-0">
                  Concluído
                </span>
              )}
              {isCancelado && (
                <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full flex-shrink-0">
                  Cancelado
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 truncate">{contrato.description}</p>

            {/* Progress bar */}
            <div className="mt-2.5">
              <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                <span>{paid}/{contrato.installments_count} parcelas • {fmt(paidAmount)} recebidos</span>
                <span className="font-semibold text-gray-600">{fmt(contrato.total_amount)}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-1.5 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, progress)}%`,
                    backgroundColor: isConcluido ? '#52D68A' : '#5B3FD4',
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Botões de ação */}
        <div className="flex items-center gap-2 mt-3">
          {nextPending && !isCancelado && (
            <button
              type="button"
              onClick={() => onPay(nextPending.id)}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-white hover:opacity-90 transition-opacity"
              style={{ backgroundColor: effectiveStatus(nextPending) === 'atrasado' ? '#ef4444' : '#5B3FD4' }}
            >
              <CheckCircle2 className="w-3 h-3" />
              Pagar parcela {nextPending.installment_number}
              {effectiveStatus(nextPending) === 'atrasado' && ' (atrasada)'}
            </button>
          )}

          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 ml-auto transition-colors"
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {expanded ? 'Recolher' : 'Ver parcelas'}
          </button>

          {!isConcluido && !isCancelado && (
            <button
              type="button"
              onClick={() => onCancel(contrato.id)}
              className="text-[10px] text-gray-300 hover:text-red-400 transition-colors"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>

      {/* Lista de parcelas */}
      {expanded && (
        <div className="border-t border-gray-50 px-4 pb-3 pt-2 space-y-1.5">
          {contrato.installments
            .sort((a, b) => a.installment_number - b.installment_number)
            .map((inst) => {
              const ef = effectiveStatus(inst)
              return (
                <div key={inst.id} className="flex items-center gap-3 py-1">
                  <span className="flex-shrink-0">{STATUS_ICON[ef]}</span>
                  <span className="text-xs text-gray-500 w-5 flex-shrink-0 text-center font-medium">
                    {inst.installment_number}
                  </span>
                  <span className="text-xs font-medium text-gray-700 flex-shrink-0">
                    {fmt(inst.amount)}
                  </span>
                  <span className="text-xs text-gray-400 flex items-center gap-1 flex-1">
                    <Calendar className="w-3 h-3" />
                    {fmtDate(inst.due_date)}
                    {inst.paid_at && (
                      <span className="text-[10px] text-gray-300">
                        · paga {fmtDate(inst.paid_at.substring(0, 10))}
                      </span>
                    )}
                  </span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_BADGE[ef]}`}>
                    {STATUS_LABEL[ef]}
                  </span>
                </div>
              )
            })}
        </div>
      )}
    </div>
  )
}

function NovoContratoForm({ onClose }: { onClose: () => void }) {
  const [installmentsCount, setInstallmentsCount] = useState('3')
  const [totalAmount, setTotalAmount]             = useState('')

  const count    = parseInt(installmentsCount) || 1
  const total    = parseFloat(totalAmount.replace(',', '.')) || 0
  const perPart  = total > 0 && count > 0 ? total / count : 0

  return (
    <form
      action={async (fd) => {
        await criarContrato(fd)
        onClose()
      }}
      className="rounded-xl border border-[#5B3FD4]/20 bg-[#5B3FD4]/3 p-4 space-y-3"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">Cliente</label>
          <input
            name="client_name"
            type="text"
            required
            placeholder="Ex: João Silva"
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#5B3FD4] focus:ring-2 focus:ring-[#5B3FD4]/10 transition"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">Descrição do contrato</label>
          <input
            name="description"
            type="text"
            required
            placeholder="Ex: Identidade visual completa"
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#5B3FD4] focus:ring-2 focus:ring-[#5B3FD4]/10 transition"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">Valor total (R$)</label>
          <input
            name="total_amount"
            type="number"
            min="0.01"
            step="0.01"
            required
            value={totalAmount}
            onChange={(e) => setTotalAmount(e.target.value)}
            placeholder="Ex: 5000"
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#5B3FD4] focus:ring-2 focus:ring-[#5B3FD4]/10 transition"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">Parcelas</label>
          <input
            name="installments_count"
            type="number"
            min="1"
            max="60"
            required
            value={installmentsCount}
            onChange={(e) => setInstallmentsCount(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#5B3FD4] focus:ring-2 focus:ring-[#5B3FD4]/10 transition"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">1º vencimento</label>
          <input
            name="first_due_date"
            type="date"
            required
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#5B3FD4] focus:ring-2 focus:ring-[#5B3FD4]/10 transition"
          />
        </div>
      </div>

      {perPart > 0 && (
        <div className="rounded-xl bg-white border border-gray-100 px-3 py-2 text-xs text-gray-500">
          Cada parcela: <span className="font-bold text-[#5B3FD4]">{fmt(perPart)}</span>
          {' '}× {count} = <span className="font-semibold text-gray-700">{fmt(perPart * count)}</span>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-xl text-xs font-medium text-gray-500 hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 rounded-xl text-xs font-semibold text-white hover:opacity-90 transition-opacity"
          style={{ backgroundColor: '#5B3FD4' }}
        >
          Criar contrato + {installmentsCount || '?'} parcelas
        </button>
      </div>
    </form>
  )
}

export function ContratosList({ contratos: initialContratos }: Props) {
  const [contratos, setContratos] = useState<ContratoDado[]>(initialContratos)
  const [showForm, setShowForm]   = useState(false)
  const [, startTransition]       = useTransition()

  const ativos = contratos.filter((c) => c.status === 'ativo')
  const outros = contratos.filter((c) => c.status !== 'ativo')

  function handlePay(installmentId: string) {
    setContratos((prev) =>
      prev.map((c) => ({
        ...c,
        installments: c.installments.map((i) =>
          i.id === installmentId ? { ...i, status: 'pago' as const, paid_at: new Date().toISOString() } : i,
        ),
        status: c.installments.every(
          (i) => i.id === installmentId || i.status === 'pago',
        ) ? 'concluido' as const : c.status,
      })),
    )
    startTransition(() => { pagarParcela(installmentId) })
  }

  function handleCancel(contratoId: string) {
    setContratos((prev) =>
      prev.map((c) => c.id === contratoId ? { ...c, status: 'cancelado' as const } : c),
    )
    startTransition(() => { cancelarContrato(contratoId) })
  }

  if (contratos.length === 0 && !showForm) {
    return (
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-800">Contratos Parcelados</h2>
            <p className="text-xs text-gray-400 mt-0.5">Gerencie contratos com pagamento em parcelas</p>
          </div>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl text-white hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#5B3FD4' }}
          >
            <Plus className="w-3.5 h-3.5" />
            Novo contrato
          </button>
        </div>
        <div className="text-center py-8 text-xs text-gray-400">
          <FileText className="w-8 h-8 text-gray-200 mx-auto mb-2" />
          Nenhum contrato parcelado ainda.
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-800">Contratos Parcelados</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {ativos.length} ativo{ativos.length !== 1 ? 's' : ''}
            {' '}·{' '}
            {fmt(ativos.reduce((s, c) => s + c.total_amount, 0))} em carteira
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl text-white hover:opacity-90 transition-opacity"
          style={{ backgroundColor: '#5B3FD4' }}
        >
          {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showForm ? 'Cancelar' : 'Novo contrato'}
        </button>
      </div>

      {showForm && <NovoContratoForm onClose={() => setShowForm(false)} />}

      {/* Contratos ativos */}
      {ativos.length > 0 && (
        <div className="space-y-3">
          {ativos.map((c, i) => (
            <ContratoCard
              key={c.id}
              contrato={c}
              index={i}
              onPay={handlePay}
              onCancel={handleCancel}
            />
          ))}
        </div>
      )}

      {/* Contratos encerrados */}
      {outros.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-xs text-gray-400 hover:text-gray-600 transition-colors select-none">
            Ver {outros.length} contrato{outros.length !== 1 ? 's' : ''} encerrado{outros.length !== 1 ? 's' : ''}
          </summary>
          <div className="mt-3 space-y-3">
            {outros.map((c, i) => (
              <ContratoCard
                key={c.id}
                contrato={c}
                index={ativos.length + i}
                onPay={handlePay}
                onCancel={handleCancel}
              />
            ))}
          </div>
        </details>
      )}
    </div>
  )
}
