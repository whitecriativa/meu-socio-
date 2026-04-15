import { getAuthenticatedUserId } from '@/lib/get-user-id'
import { createClient } from '@supabase/supabase-js'
import { ClientesList, COLORS } from '@/components/clientes/clientes-client'
import type { ClientItem, ClientStatus } from '@/components/clientes/clientes-client'

export const dynamic = 'force-dynamic'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

type ClientRow = {
  id: string
  name: string | null
  phone: string | null
  last_contact: string | null
  total_spent: number | null
  status: string | null
  notes: string | null
}

type AptRow = {
  client_id: string | null
  service: string | null
  scheduled_at: string | null
}

const INACTIVE_DAYS = 30
const RISK_DAYS     = 15
const VIP_THRESHOLD = 500

function toStatus(
  dbStatus: string | null,
  lastContact: string | null,
  totalSpent: number,
): ClientStatus {
  if (dbStatus === 'vip') return 'vip'
  if (totalSpent >= VIP_THRESHOLD) return 'vip'
  if (lastContact) {
    const days = (Date.now() - new Date(lastContact).getTime()) / (1000 * 60 * 60 * 24)
    if (days > INACTIVE_DAYS) return 'inativo'
    if (days > RISK_DAYS)     return 'em_risco'
  }
  if (dbStatus === 'inativo') return 'inativo'
  return 'ativo'
}

function daysSince(iso: string | null): number {
  if (!iso) return 0
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24))
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR')
}

async function getClients(): Promise<ClientItem[]> {
  const userId = (await getAuthenticatedUserId()) ?? process.env.NEXT_PUBLIC_DEMO_USER_ID!
  const supabase = adminClient()

  const [{ data: clientRows }, { data: aptRows }] = await Promise.all([
    supabase
      .from('clients')
      .select('id, name, phone, last_contact, total_spent, status, notes')
      .eq('user_id', userId)
      .order('last_contact', { ascending: false, nullsFirst: false }),
    supabase
      .from('appointments')
      .select('client_id, service, scheduled_at')
      .eq('user_id', userId)
      .order('scheduled_at', { ascending: false }),
  ])

  const clients = (clientRows as ClientRow[] ?? [])
  const apts    = (aptRows    as AptRow[]    ?? [])

  const aptsByClient = apts.reduce<Record<string, AptRow[]>>((acc, a) => {
    if (!a.client_id) return acc
    const list = acc[a.client_id] ?? []
    acc[a.client_id] = list
    list.push(a)
    return acc
  }, {})

  return clients.map((c, i) => {
    const clientApts = aptsByClient[c.id] ?? []
    const lastApt    = clientApts[0]
    const totalSpent = Number(c.total_spent ?? 0)
    const lastIso    = lastApt?.scheduled_at ?? c.last_contact

    return {
      id:           c.id,
      name:         c.name ?? 'Sem nome',
      last_service: lastApt?.service ?? '—',
      last_visit:   formatDate(lastIso),
      days_since:   daysSince(lastIso),
      total_spent:  totalSpent,
      visits:       clientApts.length,
      status:       toStatus(c.status, lastIso, totalSpent),
      color:        COLORS[i % COLORS.length] ?? '#0F40CB',
      notes:        c.notes ?? null,
    }
  })
}

export default async function CrmPage() {
  const clients = await getClients()

  return (
    <div className="px-4 py-5 md:px-8 md:py-8 max-w-5xl">
      <ClientesList clients={clients} />
    </div>
  )
}
