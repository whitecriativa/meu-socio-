import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = adminClient()

  const { data: user } = await supabase
    .from('users')
    .select('id, name, profile_type, booking_services, booking_days, work_hours_start, work_hours_end, booking_active')
    .eq('booking_slug', slug)
    .eq('booking_active', true)
    .maybeSingle()

  if (!user) {
    return NextResponse.json({ error: 'Profissional não encontrado' }, { status: 404 })
  }

  return NextResponse.json({
    name: user.name,
    profile_type: user.profile_type,
    services: user.booking_services ?? [],
    booking_days: user.booking_days ?? [1, 2, 3, 4, 5],
    work_hours_start: user.work_hours_start ?? '08:00',
    work_hours_end: user.work_hours_end ?? '19:00',
  })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = adminClient()

  const body = await req.json()
  const { service, service_price, service_duration, scheduled_at, client_name, client_phone } = body

  if (!service || !scheduled_at || !client_name) {
    return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 })
  }

  // Buscar profissional
  const { data: user } = await supabase
    .from('users')
    .select('id, name, phone, booking_active, work_hours_start, work_hours_end, booking_days')
    .eq('booking_slug', slug)
    .eq('booking_active', true)
    .maybeSingle()

  if (!user) {
    return NextResponse.json({ error: 'Profissional não encontrado ou agenda inativa' }, { status: 404 })
  }

  // Verificar se horário já está ocupado
  const aptStart = new Date(scheduled_at)
  const durationMin = service_duration ?? 60
  const aptEnd = new Date(aptStart.getTime() + durationMin * 60 * 1000)

  const { data: conflito } = await supabase
    .from('appointments')
    .select('id')
    .eq('user_id', user.id)
    .neq('status', 'cancelado')
    .lt('scheduled_at', aptEnd.toISOString())
    .gt('scheduled_at', new Date(aptStart.getTime() - durationMin * 60 * 1000).toISOString())
    .maybeSingle()

  if (conflito) {
    return NextResponse.json({ error: 'Horário não disponível. Escolha outro.' }, { status: 409 })
  }

  // Criar agendamento
  const { data: apt, error } = await supabase
    .from('appointments')
    .insert({
      user_id: user.id,
      service,
      price: service_price ?? 0,
      scheduled_at,
      status: 'pendente',
      client_name,
      client_phone: client_phone ?? null,
      booked_via: 'autoagendamento',
      notes: `Autoagendamento online — ${client_name}${client_phone ? ` (${client_phone})` : ''}`,
    })
    .select('id')
    .single()

  if (error) {
    console.error('[booking] erro ao criar agendamento:', error)
    return NextResponse.json({ error: 'Erro ao criar agendamento' }, { status: 500 })
  }

  // Notificar profissional via WhatsApp (Evolution API)
  const evolUrl = process.env.EVOLUTION_API_URL
  const evolKey = process.env.EVOLUTION_API_KEY
  const evolInstance = process.env.EVOLUTION_API_INSTANCE ?? 'meu-socio'

  if (evolUrl && evolKey && user.phone) {
    const horario = new Date(scheduled_at).toLocaleString('pt-BR', {
      weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo',
    })
    const texto = `📅 *Novo agendamento online!*\n\n👤 ${client_name}${client_phone ? `\n📱 ${client_phone}` : ''}\n✂️ ${service}\n🕐 ${horario}\n💰 R$ ${Number(service_price ?? 0).toFixed(2)}\n\nConfirme no painel: https://meusocio.app/agenda`

    await fetch(`${evolUrl}/message/sendText/${evolInstance}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: evolKey },
      body: JSON.stringify({ number: `${user.phone}@s.whatsapp.net`, text: texto }),
    }).catch(() => null) // silencioso se falhar
  }

  return NextResponse.json({ ok: true, appointment_id: apt.id })
}
