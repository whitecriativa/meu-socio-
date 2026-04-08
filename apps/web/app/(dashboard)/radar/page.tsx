import { createClient } from '@supabase/supabase-js'
import { getAuthenticatedUserId } from '@/lib/get-user-id'
import { redirect } from 'next/navigation'
import { RadarClient } from '@/components/radar/radar-client'

export const dynamic = 'force-dynamic'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

export type UnansweredConv = {
  phone: string
  clientName: string | null
  lastMessage: string
  lastAt: string
  minutesAgo: number
  clientType: 'novo_lead' | 'recorrente' | 'vip'
  totalSpent: number
}

async function getUnanswered(userId: string, thresholdMin: number): Promise<UnansweredConv[]> {
  const supabase = adminClient()
  const thresholdMs = thresholdMin * 60 * 1000
  const cutoff = new Date(Date.now() - thresholdMs).toISOString()

  // Buscar inbound messages mais antigas que o threshold
  const { data: msgs } = await supabase
    .from('messages')
    .select('phone, content, created_at')
    .eq('user_id', userId)
    .eq('direction', 'inbound')
    .lt('created_at', cutoff)
    .order('created_at', { ascending: false })
    .limit(200)

  if (!msgs?.length) return []

  // Buscar clientes para cruzar nome e tipo
  const { data: clients } = await supabase
    .from('clients')
    .select('phone, name, total_spent, status')
    .eq('user_id', userId)

  const clientMap = new Map<string, { name: string; total_spent: number; status: string }>()
  for (const c of clients ?? []) {
    clientMap.set(c.phone?.replace(/\D/g, ''), { name: c.name, total_spent: c.total_spent ?? 0, status: c.status ?? 'ativo' })
  }

  // Deduplica por phone e filtra os que têm resposta posterior
  const phoneSeen = new Set<string>()
  const result: UnansweredConv[] = []

  for (const msg of msgs) {
    const cleanPhone = msg.phone.replace(/\D/g, '')
    if (phoneSeen.has(cleanPhone)) continue
    phoneSeen.add(cleanPhone)

    const { count } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('phone', msg.phone)
      .eq('direction', 'outbound')
      .gt('created_at', msg.created_at)

    if (count && count > 0) continue

    const client = clientMap.get(cleanPhone) ?? clientMap.get(msg.phone.replace(/\D/g, '').replace(/^55/, ''))
    const minutesAgo = Math.floor((Date.now() - new Date(msg.created_at).getTime()) / 60_000)

    let clientType: UnansweredConv['clientType'] = 'novo_lead'
    if (client) {
      if (client.total_spent >= 500) clientType = 'vip'
      else clientType = 'recorrente'
    }

    result.push({
      phone:       msg.phone,
      clientName:  client?.name ?? null,
      lastMessage: msg.content,
      lastAt:      msg.created_at,
      minutesAgo,
      clientType,
      totalSpent:  client?.total_spent ?? 0,
    })
  }

  // Ordena por mais antigo primeiro (urgência)
  result.sort((a, b) => b.minutesAgo - a.minutesAgo)
  return result
}

export default async function RadarPage() {
  const userId = await getAuthenticatedUserId()
  if (!userId) redirect('/login')

  const supabase = adminClient()
  const { data: user } = await supabase
    .from('users')
    .select('radar_enabled, radar_alert_minutes')
    .eq('id', userId)
    .single()

  const radarEnabled    = user?.radar_enabled ?? true
  const alertMinutes    = user?.radar_alert_minutes ?? 30
  const conversations   = radarEnabled ? await getUnanswered(userId, alertMinutes) : []

  return (
    <RadarClient
      userId={userId}
      conversations={conversations}
      radarEnabled={radarEnabled}
      alertMinutes={alertMinutes}
    />
  )
}
