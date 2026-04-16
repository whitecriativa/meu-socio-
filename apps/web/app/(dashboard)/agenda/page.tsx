import { getAuthenticatedUserId } from '@/lib/get-user-id'
import { createClient } from '@supabase/supabase-js'
import { AgendaClient } from '@/components/agenda/agenda-client'
import type { Appointment, AppointmentStatus, FinancialCommitment } from '@/components/agenda/types'

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
    const date = dt.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-')
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

async function getFinancialCommitments(): Promise<FinancialCommitment[]> {
  const userId = (await getAuthenticatedUserId()) ?? process.env.NEXT_PUBLIC_DEMO_USER_ID!
  const supabase = adminClient()
  const result: FinancialCommitment[] = []

  // 1. Pagamentos avulsos pendentes (transactions com paid_at IS NULL)
  const { data: pending } = await supabase
    .from('transactions')
    .select('id, description, amount, competence_date')
    .eq('user_id', userId)
    .eq('type', 'despesa')
    .is('paid_at', null)
    .not('competence_date', 'is', null)
    .order('competence_date', { ascending: true })

  for (const t of pending ?? []) {
    result.push({
      id: `tx-${t.id}`,
      date: (t.competence_date as string).slice(0, 10),
      description: t.description ?? 'Pagamento pendente',
      amount: Number(t.amount ?? 0),
      type: 'avulso',
      transactionId: t.id,
    })
  }

  // 2. Custos recorrentes (costs_fixed com due_day) — gera datas para os próximos 3 meses
  try {
    const { data: recurring } = await supabase
      .from('costs_fixed')
      .select('id, name, amount, due_day')
      .eq('user_id', userId)
      .not('due_day', 'is', null)

    if (recurring && recurring.length > 0) {
      const now = new Date()
      for (let m = 0; m < 3; m++) {
        const year  = now.getMonth() + m > 11 ? now.getFullYear() + 1 : now.getFullYear()
        const month = ((now.getMonth() + m) % 12) + 1
        for (const c of recurring) {
          const day = Math.min(Number(c.due_day), new Date(year, month, 0).getDate())
          const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          result.push({
            id: `cf-${c.id}-${date}`,
            date,
            description: c.name ?? 'Custo recorrente',
            amount: Number(c.amount ?? 0),
            type: 'recorrente',
          })
        }
      }
    }
  } catch {
    // costs_fixed ou due_day não existem ainda — silencioso
  }

  return result
}

export default async function AgendaPage() {
  const [appointments, financialCommitments] = await Promise.all([
    getAppointments(),
    getFinancialCommitments(),
  ])
  const today = new Date().toISOString().slice(0, 10)

  return (
    <div className="px-4 py-5 md:px-8 md:py-8 max-w-5xl">
      <AgendaClient
        appointments={appointments}
        financialCommitments={financialCommitments}
        initialDate={today}
      />
    </div>
  )
}
