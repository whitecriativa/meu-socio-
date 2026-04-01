import { createClient } from '@supabase/supabase-js'
import { AgendaClient } from '@/components/agenda/agenda-client'
import type { Appointment, AppointmentStatus } from '@/components/agenda/types'

export const dynamic = 'force-dynamic'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

type AptRow = {
  id: string
  service: string | null
  datetime: string | null
  status: string | null
  price: number | null
  notes: string | null
  clients: { name: string | null }[] | null
}

const VALID_STATUSES = new Set(['confirmado', 'pendente', 'cancelado', 'concluido'])

function toStatus(s: string | null): AppointmentStatus {
  if (s && VALID_STATUSES.has(s)) return s as AppointmentStatus
  return 'pendente'
}

async function getAppointments(): Promise<Appointment[]> {
  const userId = process.env.NEXT_PUBLIC_DEMO_USER_ID!
  const supabase = adminClient()

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const monthStr = `${year}-${String(month).padStart(2, '0')}`

  // Fetch current month ± 1 month so the calendar can navigate a bit
  const prevMonth = month === 1
    ? `${year - 1}-12`
    : `${year}-${String(month - 1).padStart(2, '0')}`
  const nextMonth = month === 12
    ? `${year + 1}-01`
    : `${year}-${String(month + 1).padStart(2, '0')}`

  const { data } = await supabase
    .from('appointments')
    .select('id, service, datetime, status, price, notes, clients(name)')
    .eq('user_id', userId)
    .gte('datetime', `${prevMonth}-01T00:00:00`)
    .lte('datetime', `${nextMonth}-31T23:59:59`)
    .order('datetime', { ascending: true })

  if (!data) return []

  return (data as AptRow[]).map((row) => {
    const dt   = row.datetime ? new Date(row.datetime) : new Date()
    const date = dt.toISOString().slice(0, 10)
    const time = dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

    const clientName = row.clients?.[0]?.name ?? 'Cliente'

    return {
      id:           row.id,
      date,
      time,
      client_name:  clientName,
      service:      row.service ?? 'Serviço',
      duration_min: 60,   // default — appointments table não tem este campo ainda
      price:        Number(row.price ?? 0),
      status:       toStatus(row.status),
    }
  })
}

export default async function AgendaPage() {
  const appointments = await getAppointments()
  const today        = new Date().toISOString().slice(0, 10)

  return (
    <div className="px-4 py-5 md:px-8 md:py-8 max-w-5xl">
      <AgendaClient appointments={appointments} initialDate={today} />
    </div>
  )
}
