import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Chamado pelo n8n a cada 15 min via cron
// Verifica mensagens sem resposta e alerta o dono via WhatsApp

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-radar-secret')
  if (secret !== process.env.RADAR_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = adminClient()

  // Buscar usuários com radar ativado e telefone configurado
  const { data: users } = await supabase
    .from('users')
    .select('id, name, phone, radar_enabled, radar_alert_minutes')
    .eq('radar_enabled', true)
    .not('phone', 'is', null)

  if (!users?.length) return NextResponse.json({ alerted: 0 })

  const evolUrl      = process.env.EVOLUTION_API_URL
  const evolKey      = process.env.EVOLUTION_API_KEY
  const evolInstance = process.env.EVOLUTION_API_INSTANCE ?? 'meu-socio'

  let alertedCount = 0

  for (const user of users) {
    const thresholdMs   = (user.radar_alert_minutes ?? 30) * 60 * 1000
    const cutoff        = new Date(Date.now() - thresholdMs).toISOString()

    // Buscar últimas mensagens inbound por telefone onde não há resposta outbound posterior
    const { data: unanswered } = await supabase
      .from('messages')
      .select('phone, content, created_at')
      .eq('user_id', user.id)
      .eq('direction', 'inbound')
      .lt('created_at', cutoff)
      .order('created_at', { ascending: false })
      .limit(100)

    if (!unanswered?.length) continue

    // Deduplica por phone e filtra os que têm resposta posterior
    const phoneSeen = new Set<string>()
    const pending: typeof unanswered = []

    for (const msg of unanswered) {
      if (phoneSeen.has(msg.phone)) continue
      phoneSeen.add(msg.phone)

      // Verificar se existe outbound depois desse inbound
      const { count } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('phone', msg.phone)
        .eq('direction', 'outbound')
        .gt('created_at', msg.created_at)

      if (!count || count === 0) {
        pending.push(msg)
      }
    }

    if (!pending.length) continue

    // Montar alerta
    const total = pending.length
    const exemplos = pending
      .slice(0, 3)
      .map((m) => {
        const mins = Math.floor((Date.now() - new Date(m.created_at).getTime()) / 60_000)
        const phone = m.phone.replace(/\D/g, '').replace(/^55/, '')
        return `• ${phone} (${mins} min atrás): "${m.content.slice(0, 60)}${m.content.length > 60 ? '…' : ''}"`
      })
      .join('\n')

    const texto =
      `📡 *Sócio Radar*\n\n` +
      `Você tem *${total} conversa${total > 1 ? 's' : ''}* sem resposta há mais de ${user.radar_alert_minutes} min:\n\n` +
      exemplos +
      (total > 3 ? `\n…e mais ${total - 3}` : '') +
      `\n\nResponda pelo WhatsApp para não perder o cliente! 💬`

    // Enviar via Evolution API
    if (evolUrl && evolKey && user.phone) {
      const ownerPhone = `${user.phone.replace(/\D/g, '')}@s.whatsapp.net`
      try {
        await fetch(`${evolUrl}/message/sendText/${evolInstance}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': evolKey,
          },
          body: JSON.stringify({ number: ownerPhone, text: texto }),
        })
        alertedCount++
      } catch {
        // Silencioso
      }
    }
  }

  return NextResponse.json({ alerted: alertedCount })
}
