import { getAuthenticatedUserId } from '@/lib/get-user-id'
import { createClient } from '@supabase/supabase-js'
import { ClientesList, COLORS } from '@/components/clientes/clientes-client'
import type { ClientItem } from '@/components/clientes/clientes-client'

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
}

type AptRow = {
  client_id: string | null
  service: string | null
  scheduled_at: string | null
}

// Inativos = sem contato há mais de 30 dias
const INACTIVE_DAYS = 30
// VIP = gastou mais de 500 no total
const VIP_THRESHOLD = 500

function toStatus(
  dbStatus: string | null,
  lastContact: string | null,
  totalSpent: number,
): ClientItem['status'] {
  // Se o banco já tem um status explícito, respeita
  if (dbStatus === 'vip') return 'vip'
  if (dbStatus === 'inativo') return 'inativo'

  // Calculado: VIP por gasto
  if (totalSpent >= VIP_THRESHOLD) return 'vip'

  // Calculado: inativo por tempo
  if (lastContact) {
    const daysSince = (Date.now() - new Date(lastContact).getTime()) / (1000 * 60 * 60 * 24)
    if (daysSince > INACTIVE_DAYS) return 'inativo'
  }

  return 'ativo'
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
      .select('id, name, phone, last_contact, total_spent, status')
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

  // Agrupa appointments por client_id
  const aptsByClient = apts.reduce<Record<string, AptRow[]>>((acc, a) => {
    if (!a.client_id) return acc
    const list = acc[a.client_id] ?? []
    acc[a.client_id] = list
    list.push(a)
    return acc
  }, {})

  return clients.map((c, i) => {
    const clientApts = aptsByClient[c.id] ?? []
    const lastApt    = clientApts[0]   // ordered desc — most recent first
    const totalSpent = Number(c.total_spent ?? 0)

    return {
      id:           c.id,
      name:         c.name ?? 'Sem nome',
      last_service: lastApt?.service ?? '—',
      last_visit:   formatDate(lastApt?.scheduled_at ?? c.last_contact),
      total_spent:  totalSpent,
      visits:       clientApts.length,
      status:       toStatus(c.status, c.last_contact, totalSpent),
      color:        COLORS[i % COLORS.length] ?? '#0F40CB',
    }
  })
}

export default async function ClientesPage() {
  const clients = await getClients()

  return (
    <div className="px-4 py-5 md:px-8 md:py-8 max-w-5xl">
      <ClientesList clients={clients} />
    </div>
  )
}
