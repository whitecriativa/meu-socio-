import { getAuthenticatedUserId } from '@/lib/get-user-id'
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
  scheduled_at: string | null
  status: string | null
  price: number | null
  notes: string | null
  client_name?: string | null
  client_phone?: string | null
  clients: { name: string | null }[] | null
}

const VALID_STATUSES = new Set(['confirmado', 'pendente', 'cancelado', 'concluido', 'aguardando_confirmacao', 'no_show'])

function toStatus(s: string | null): AppointmentStatus {
  if (s === 'aguardando_confirmacao' || s === 'no_show') return 'pendente'
  if (s && VALID_STATUSES.has(s)) return s as AppointmentStatus
  return 'pendente'
}

// Nomes genéricos que não devem ser exibidos como nome de cliente
const GENERIC = new Set(['cliente', 'sem nome', 'amigo', 'usuário', 'user', '', 'null', 'undefined'])

function extractName(row: AptRow): string {
  const candidates = [
    row.client_name?.trim(),
    row.clients?.[0]?.name?.trim(),
    row.notes?.includes(' — ') ? row.notes.split(' — ')[0]!.trim() : null,
    // notes puro só se curto e não genérico
    (row.notes?.trim() && !row.notes.includes(' — ') && row.notes.trim().length < 60)
      ? row.notes.trim()
      : null,
  ]
  for (const c of candidates) {
    if (c && !GENERIC.has(c.toLowerCase())) return c
  }
  return ''
}

async function getAppointments(): Promise<Appointment[]> {
  const userId = (await getAuthenticatedUserId()) ?? process.env.NEXT_PUBLIC_DEMO_USER_ID!
  const supabase = adminClient()

  const now   = new Date()
  const year  = now.getFullYear()
  const month = now.getMonth() + 1

  const prevDate = new Date(year, month - 4, 1)
  const nextDate = new Date(year, month + 2, 1)
  const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`
  const nextMonth = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`

  const range = { gte: `${prevMonth}-01T00:00:00`, lte: `${nextMonth}-31T23:59:59` }

  // Tenta com colunas extras (migration 005); faz fallback se não existirem
  const { data: full, error } = await supabase
    .from('appointments')
    .select('id, service, scheduled_at, status, price, notes, client_name, client_phone, clients(name)')
    .eq('user_id', userId)
    .gte('scheduled_at', range.gte)
    .lte('scheduled_at', range.lte)
    .order('scheduled_at', { ascending: true })

  let rows: AptRow[]
  if (!error) {
    rows = (full ?? []) as AptRow[]
  } else {
    const { data: basic } = await supabase
      .from('appointments')
      .select('id, service, scheduled_at, status, price, notes, clients(name)')
      .eq('user_id', userId)
      .gte('scheduled_at', range.gte)
      .lte('scheduled_at', range.lte)
      .order('scheduled_at', { ascending: true })
    rows = (basic ?? []) as AptRow[]
  }

  return rows.map((row) => {
    const dt   = row.scheduled_at ? new Date(row.scheduled_at) : new Date()
    const date = dt.toISOString().slice(0, 10)
    const time = dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })

    const notesClean = row.notes?.includes(' — ')
      ? row.notes.split(' — ').slice(1).join(' — ')
      : undefined

    return {
      id:           row.id,
      date,
      time,
      client_name:  extractName(row) || row.service || 'Sem nome',
      service:      row.service ?? 'Serviço',
      duration_min: 60,
      price:        Number(row.price ?? 0),
      status:       toStatus(row.status),
      client_phone: row.client_phone ?? undefined,
      notes_raw:    notesClean,
    }
  })
}

export default async function AgendaPage() {
  const appointments = await getAppointments()
  const today = new Date().toISOString().slice(0, 10)

  return (
    <div className="px-4 py-5 md:px-8 md:py-8 max-w-5xl">
      <AgendaClient appointments={appointments} initialDate={today} />
    </div>
  )
}
