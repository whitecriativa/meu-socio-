'use client'

import { useState, useTransition } from 'react'
import { Plus, Trash2, Copy, Check, ExternalLink } from 'lucide-react'
import { salvarBooking } from '@/app/(dashboard)/configuracoes/booking-actions'

export type BookingService = {
  name: string
  price: number
  duration_min: number
}

type Props = {
  userId: string
  initialSlug: string | null
  initialActive: boolean
  initialServices: BookingService[]
}

export function BookingSection({ userId, initialSlug, initialActive, initialServices }: Props) {
  const [slug, setSlug] = useState(initialSlug ?? '')
  const [active, setActive] = useState(initialActive)
  const [services, setServices] = useState<BookingService[]>(initialServices)
  const [newName, setNewName] = useState('')
  const [newPrice, setNewPrice] = useState('')
  const [newDuration, setNewDuration] = useState('60')
  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const bookingUrl = slug ? `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://meusocio.app'}/agendar/${slug}` : ''

  function addService() {
    if (!newName.trim()) return
    setServices((prev) => [
      ...prev,
      { name: newName.trim(), price: parseFloat(newPrice) || 0, duration_min: parseInt(newDuration) || 60 },
    ])
    setNewName('')
    setNewPrice('')
    setNewDuration('60')
  }

  function removeService(i: number) {
    setServices((prev) => prev.filter((_, idx) => idx !== i))
  }

  function handleCopy() {
    navigator.clipboard.writeText(bookingUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleSave() {
    setError('')
    setSaved(false)
    startTransition(async () => {
      try {
        await salvarBooking(userId, { slug, active, services })
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao salvar')
      }
    })
  }

  return (
    <section className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-800">Autoagendamento público</h2>
        <label className="flex items-center gap-2 cursor-pointer">
          <span className="text-xs text-gray-500">{active ? 'Ativo' : 'Inativo'}</span>
          <div
            onClick={() => setActive((v) => !v)}
            className={`relative w-10 h-5 rounded-full transition-colors ${active ? 'bg-[#0F40CB]' : 'bg-gray-200'}`}
          >
            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${active ? 'left-5' : 'left-0.5'}`} />
          </div>
        </label>
      </div>

      <p className="text-xs text-gray-500">
        Compartilhe seu link de agendamento com clientes. Eles escolhem o serviço, data e horário sem precisar te chamar no WhatsApp.
      </p>

      {/* Slug */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-gray-600">Seu link personalizado</label>
        <div className="flex gap-2">
          <div className="flex flex-1 items-center rounded-xl border border-gray-200 overflow-hidden text-sm">
            <span className="px-3 py-2.5 text-gray-400 bg-gray-50 border-r border-gray-200 whitespace-nowrap">meusocio.app/agendar/</span>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-'))}
              placeholder="seu-nome"
              className="flex-1 px-3 py-2.5 outline-none"
            />
          </div>
        </div>
        <p className="text-[10px] text-gray-400">Só letras, números e hífens. Ex: maria-estetica</p>
      </div>

      {/* Link copiável */}
      {slug && active && (
        <div className="flex items-center gap-2 bg-[#0F40CB]/5 rounded-xl px-3 py-2.5">
          <p className="flex-1 text-xs text-[#0F40CB] truncate">{bookingUrl}</p>
          <button onClick={handleCopy} className="flex-shrink-0 text-[#0F40CB] hover:text-[#0a32a0]">
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
          <a href={bookingUrl} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 text-[#0F40CB] hover:text-[#0a32a0]">
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      )}

      {/* Serviços */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-600">Serviços oferecidos</label>

        {services.length > 0 && (
          <div className="space-y-2 mb-3">
            {services.map((svc, i) => (
              <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{svc.name}</p>
                  <p className="text-xs text-gray-400">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(svc.price)} · {svc.duration_min} min
                  </p>
                </div>
                <button
                  onClick={() => removeService(i)}
                  className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Adicionar serviço */}
        <div className="bg-gray-50 rounded-xl p-3 space-y-2">
          <p className="text-xs font-medium text-gray-600">Adicionar serviço</p>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nome do serviço (Ex: Manicure)"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#0F40CB]"
          />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <input
                type="number"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="Preço (R$)"
                min="0"
                step="0.50"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#0F40CB]"
              />
            </div>
            <div>
              <input
                type="number"
                value={newDuration}
                onChange={(e) => setNewDuration(e.target.value)}
                placeholder="Duração (min)"
                min="15"
                step="15"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#0F40CB]"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={addService}
            disabled={!newName.trim()}
            className="flex items-center gap-1.5 text-sm text-[#0F40CB] font-medium hover:opacity-80 transition-opacity disabled:opacity-30"
          >
            <Plus className="w-4 h-4" />
            Adicionar
          </button>
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
      )}
      {saved && (
        <p className="text-xs text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg">Configurações de agendamento salvas!</p>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={isPending}
        className="w-full py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50"
        style={{ backgroundColor: '#0F40CB' }}
      >
        {isPending ? 'Salvando...' : 'Salvar configurações de agendamento'}
      </button>
    </section>
  )
}
