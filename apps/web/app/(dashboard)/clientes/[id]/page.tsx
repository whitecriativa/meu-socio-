import { getAuthenticatedUserId } from '@/lib/get-user-id'
import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ClienteDetalhe } from '@/components/clientes/cliente-detalhe'

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
}

export interface ClienteDetalhado {
  id: string
  name: string
  phone: string | null
  status: string
  total_spent: number
  last_contact: string | null
  color: string
  appointments: {
    id: string
    service: string
    scheduled_at: string | null
    status: string
    price: number
    notes: string | null
  }[]
}

const COLORS = ['#0F40CB', '#B6F273', '#a78bfa', '#34d399', '#818cf8', '#fbbf24', '#f87171']

async function getCliente(id: string): Promise<ClienteDetalhado | null> {
  const userId = (await getAuthenticatedUserId()) ?? process.env.NEXT_PUBLIC_DEMO_USER_ID!
  const supabase = adminClient()

  const [{ data: client }, { data: apts }] = await Promise.all([
    supabase
      .from('clients')
      .select('id, name, phone, status, total_spent, last_contact')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle(),
    supabase
      .from('appointments')
      .select('id, service, scheduled_at, status, price, notes')
      .eq('client_id', id)
      .eq('user_id', userId)
      .order('scheduled_at', { ascending: false }),
  ])

  if (!client) return null

  const totalSpent = Number(client.total_spent ?? 0)

  // Calcula status automaticamente se não definido
  let resolvedStatus: string = client.status ?? 'ativo'
  if (resolvedStatus !== 'vip' && resolvedStatus !== 'inativo') {
    if (totalSpent >= 500) {
      resolvedStatus = 'vip'
    } else if (client.last_contact) {
      const days = (Date.now() - new Date(client.last_contact).getTime()) / (1000 * 60 * 60 * 24)
      if (days > 30) resolvedStatus = 'inativo'
    }
  }

  // Cor baseada no hash do id
  const colorIndex = id.charCodeAt(0) % COLORS.length
  const color = COLORS[colorIndex] ?? '#0F40CB'

  return {
    id: client.id,
    name: client.name ?? 'Sem nome',
    phone: client.phone,
    status: resolvedStatus,
    total_spent: totalSpent,
    last_contact: client.last_contact,
    color,
    appointments: (apts as AptRow[] ?? []).map((a) => ({
      id: a.id,
      service: a.service ?? '—',
      scheduled_at: a.scheduled_at,
      status: a.status ?? 'pendente',
      price: Number(a.price ?? 0),
      notes: a.notes,
    })),
  }
}

export default async function ClienteDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cliente = await getCliente(id)

  if (!cliente) notFound()

  return (
    <div className="px-4 py-5 md:px-8 md:py-8 max-w-3xl">
      <Link
        href="/clientes"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-5 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para clientes
      </Link>
      <ClienteDetalhe cliente={cliente} />
    </div>
  )
}
