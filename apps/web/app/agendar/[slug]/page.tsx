'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Calendar, Clock, CheckCircle, AlertCircle, ChevronLeft } from 'lucide-react'

type Service = { name: string; price: number; duration_min: number }

type ProfData = {
  name: string
  profile_type: string | null
  services: Service[]
  booking_days: number[]
  work_hours_start: string
  work_hours_end: string
}

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

function gerarSlots(start: string, end: string, durationMin: number, date: string): string[] {
  const slots: string[] = []
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  const startMin = (sh ?? 8) * 60 + (sm ?? 0)
  const endMin = (eh ?? 19) * 60 + (em ?? 0)

  for (let m = startMin; m + durationMin <= endMin; m += 30) {
    const h = String(Math.floor(m / 60)).padStart(2, '0')
    const min = String(m % 60).padStart(2, '0')
    slots.push(`${date}T${h}:${min}:00`)
  }
  return slots
}

function formatSlot(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function toDateInput(daysFromNow: number) {
  const d = new Date()
  d.setDate(d.getDate() + daysFromNow)
  return d.toISOString().slice(0, 10)
}

function isDayAvailable(dateStr: string, bookingDays: number[]) {
  const d = new Date(dateStr + 'T12:00:00')
  return bookingDays.includes(d.getDay())
}

export default function AgendarPage() {
  const { slug } = useParams<{ slug: string }>()

  const [prof, setProf] = useState<ProfData | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [step, setStep] = useState<'service' | 'datetime' | 'info' | 'confirm' | 'done'>('service')

  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedSlot, setSelectedSlot] = useState<string>('')
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!slug) return
    fetch(`/api/booking/${slug}`)
      .then((r) => {
        if (!r.ok) { setNotFound(true); return null }
        return r.json()
      })
      .then((d) => { if (d) setProf(d) })
      .catch(() => setNotFound(true))
  }, [slug])

  async function handleConfirm() {
    if (!selectedService || !selectedSlot || !clientName.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/booking/${slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service: selectedService.name,
          service_price: selectedService.price,
          service_duration: selectedService.duration_min,
          scheduled_at: selectedSlot,
          client_name: clientName.trim(),
          client_phone: clientPhone.replace(/\D/g, '') || null,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error ?? 'Erro ao agendar')
        setLoading(false)
        return
      }
      setStep('done')
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-sm">
          <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h1 className="text-lg font-semibold text-gray-700">Agenda não encontrada</h1>
          <p className="text-sm text-gray-400 mt-1">Este link de agendamento não existe ou está inativo.</p>
        </div>
      </div>
    )
  }

  if (!prof) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-[#0F40CB] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const slots = selectedDate && selectedService
    ? gerarSlots(prof.work_hours_start, prof.work_hours_end, selectedService.duration_min || 60, selectedDate)
    : []

  const minDate = toDateInput(1)
  const maxDate = toDateInput(60)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#0F40CB] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
            {prof.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900">{prof.name}</h1>
            {prof.profile_type && (
              <p className="text-xs text-gray-500">{prof.profile_type}</p>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Indicador de etapas */}
        {step !== 'done' && (
          <div className="flex items-center gap-1.5 mb-6">
            {(['service', 'datetime', 'info', 'confirm'] as const).map((s, i) => (
              <div
                key={s}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  ['service', 'datetime', 'info', 'confirm'].indexOf(step) >= i
                    ? 'bg-[#0F40CB]'
                    : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        )}

        {/* Etapa 1: Serviço */}
        {step === 'service' && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Escolha o serviço</h2>
            {prof.services.length === 0 ? (
              <p className="text-sm text-gray-400">Nenhum serviço disponível no momento.</p>
            ) : (
              <div className="space-y-3">
                {prof.services.map((svc) => (
                  <button
                    key={svc.name}
                    onClick={() => { setSelectedService(svc); setStep('datetime') }}
                    className="w-full text-left bg-white rounded-2xl border border-gray-200 px-4 py-4 hover:border-[#0F40CB] hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">{svc.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {svc.duration_min} min
                        </p>
                      </div>
                      <p className="text-base font-bold text-[#0F40CB]">{fmt(svc.price)}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Etapa 2: Data e hora */}
        {step === 'datetime' && selectedService && (
          <div>
            <button
              onClick={() => { setStep('service'); setSelectedDate(''); setSelectedSlot('') }}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Voltar
            </button>
            <h2 className="text-lg font-bold text-gray-900 mb-1">Escolha a data</h2>
            <p className="text-sm text-gray-400 mb-4">{selectedService.name} · {selectedService.duration_min} min</p>

            <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-4">
              <label className="block text-xs font-medium text-gray-600 mb-2">Data</label>
              <input
                type="date"
                min={minDate}
                max={maxDate}
                value={selectedDate}
                onChange={(e) => {
                  const d = e.target.value
                  if (d && !isDayAvailable(d, prof.booking_days)) {
                    setError('O profissional não atende neste dia da semana.')
                    setSelectedDate(d)
                    setSelectedSlot('')
                    return
                  }
                  setError('')
                  setSelectedDate(d)
                  setSelectedSlot('')
                }}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#0F40CB] focus:ring-2 focus:ring-[#0F40CB]/10"
              />
              {selectedDate && !isDayAvailable(selectedDate, prof.booking_days) && (
                <p className="text-xs text-red-500 mt-1">
                  Dia não disponível. Dias atendidos: {prof.booking_days.map(d => ['Dom','Seg','Ter','Qua','Qui','Sex','Sab'][d]).join(', ')}
                </p>
              )}
            </div>

            {selectedDate && isDayAvailable(selectedDate, prof.booking_days) && (
              <div className="bg-white rounded-2xl border border-gray-200 p-4">
                <label className="block text-xs font-medium text-gray-600 mb-3">Horário disponível</label>
                {slots.length === 0 ? (
                  <p className="text-sm text-gray-400">Nenhum horário disponível neste dia.</p>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {slots.map((slot) => (
                      <button
                        key={slot}
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-2 rounded-xl text-sm font-medium border transition-all ${
                          selectedSlot === slot
                            ? 'bg-[#0F40CB] text-white border-[#0F40CB]'
                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-[#0F40CB]'
                        }`}
                      >
                        {formatSlot(slot)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {error && (
              <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg mt-3">{error}</p>
            )}

            {selectedSlot && (
              <button
                onClick={() => { setStep('info'); setError('') }}
                className="mt-4 w-full py-3 rounded-2xl bg-[#0F40CB] text-white font-semibold text-sm hover:bg-[#0a32a0] transition-colors"
              >
                Continuar
              </button>
            )}
          </div>
        )}

        {/* Etapa 3: Dados do cliente */}
        {step === 'info' && (
          <div>
            <button
              onClick={() => setStep('datetime')}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Voltar
            </button>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Seus dados</h2>

            <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Seu nome *</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Como você se chama?"
                  required
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#0F40CB] focus:ring-2 focus:ring-[#0F40CB]/10"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  WhatsApp <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <input
                  type="tel"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="11999991234"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#0F40CB] focus:ring-2 focus:ring-[#0F40CB]/10"
                />
              </div>
            </div>

            <button
              onClick={() => { if (clientName.trim()) { setStep('confirm'); setError('') } }}
              disabled={!clientName.trim()}
              className="mt-4 w-full py-3 rounded-2xl bg-[#0F40CB] text-white font-semibold text-sm hover:bg-[#0a32a0] transition-colors disabled:opacity-40"
            >
              Revisar agendamento
            </button>
          </div>
        )}

        {/* Etapa 4: Confirmar */}
        {step === 'confirm' && selectedService && selectedSlot && (
          <div>
            <button
              onClick={() => setStep('info')}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Voltar
            </button>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Confirmar agendamento</h2>

            <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-50 mb-4">
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-gray-500">Serviço</span>
                <span className="text-sm font-semibold text-gray-900">{selectedService.name}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-gray-500">Data e hora</span>
                <span className="text-sm font-semibold text-gray-900">
                  {new Date(selectedSlot).toLocaleString('pt-BR', {
                    weekday: 'short', day: '2-digit', month: '2-digit',
                    hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo',
                  })}
                </span>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-gray-500">Duração</span>
                <span className="text-sm font-semibold text-gray-900">{selectedService.duration_min} min</span>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-gray-500">Valor</span>
                <span className="text-sm font-bold text-[#0F40CB]">{fmt(selectedService.price)}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-gray-500">Nome</span>
                <span className="text-sm font-semibold text-gray-900">{clientName}</span>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg mb-3">{error}</p>
            )}

            <button
              onClick={handleConfirm}
              disabled={loading}
              className="w-full py-3 rounded-2xl bg-[#0F40CB] text-white font-semibold text-sm hover:bg-[#0a32a0] transition-colors disabled:opacity-50"
            >
              {loading ? 'Agendando...' : 'Confirmar agendamento'}
            </button>
          </div>
        )}

        {/* Etapa 5: Confirmado */}
        {step === 'done' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-[#B6F273]/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-[#0F40CB]" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Agendamento confirmado!</h2>
            <p className="text-sm text-gray-500 mb-1">
              {selectedService?.name} com <strong>{prof.name}</strong>
            </p>
            {selectedSlot && (
              <p className="text-sm text-gray-500 mb-6">
                {new Date(selectedSlot).toLocaleString('pt-BR', {
                  weekday: 'long', day: '2-digit', month: 'long',
                  hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo',
                })}
              </p>
            )}
            <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-sm text-amber-700">
              <Calendar className="w-4 h-4 inline mr-1.5" />
              Anote na sua agenda e chegue com alguns minutos de antecedência.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
