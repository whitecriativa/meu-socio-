'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@supabase/supabase-js'
import { getAuthenticatedUserId } from '@/lib/get-user-id'
import { createCalendarEvent, deleteCalendarEvent } from '@/lib/google-calendar'
import type { GCalToken } from '@/lib/google-calendar'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

async function requireUserId(): Promise<string> {
  const userId = await getAuthenticatedUserId()
  if (!userId) throw new Error('Não autenticado')
  return userId
}

// Busca cliente por nome (fuzzy) ou cria se não existir.
// Nunca duplica: busca em partes do nome para tolerar abreviações.
async function findOrCreateClient(
  supabase: ReturnType<typeof adminClient>,
  userId: string,
  name: string,
  phone?: string,
): Promise<string | null> {
  const trimmed = name.trim()
  if (!trimmed) return null

  // 1. Busca exata (case-insensitive)
  const { data: exact } = await supabase
    .from('clients')
    .select('id')
    .eq('user_id', userId)
    .ilike('name', trimmed)
    .maybeSingle()
  if (exact?.id) return exact.id

  // 2. Busca parcial: qualquer parte do nome bate
  const { data: partial } = await supabase
    .from('clients')
    .select('id, name')
    .eq('user_id', userId)
    .ilike('name', `%${trimmed}%`)
    .limit(1)
    .maybeSingle()
  if (partial?.id) return partial.id

  // 3. Busca pela primeira palavra (ex: "Maria" encontra "Maria Braga")
  const firstName = trimmed.split(' ')[0]!
  if (firstName.length >= 3) {
    const { data: byFirst } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', userId)
      .ilike('name', `${firstName}%`)
      .limit(1)
      .maybeSingle()
    if (byFirst?.id) return byFirst.id
  }

  // 4. Não encontrou — criar novo cliente
  const { data: created } = await supabase
    .from('clients')
    .insert({
      user_id:      userId,
      name:         trimmed,
      phone:        phone || null,
      status:       'active',
      last_contact: new Date().toISOString().slice(0, 10),
    })
    .select('id')
    .single()

  return created?.id ?? null
}

export async function excluirAgendamento(id: string) {
  const userId   = await requireUserId()
  const supabase = adminClient()

  // Buscar eventId do Google Calendar antes de deletar
  try {
    const { data: apt } = await supabase
      .from('appointments')
      .select('google_calendar_event_id')
      .eq('id', id).eq('user_id', userId).single()

    if (apt?.google_calendar_event_id) {
      const { data: user } = await supabase
        .from('users')
        .select('google_calendar_token, google_calendar_id')
        .eq('id', userId).single()

      if (user?.google_calendar_token) {
        const updatedToken = await deleteCalendarEvent(
          user.google_calendar_token as GCalToken,
          user.google_calendar_id ?? 'primary',
          apt.google_calendar_event_id,
        )
        if (updatedToken.access_token !== (user.google_calendar_token as GCalToken).access_token) {
          await supabase.from('users').update({ google_calendar_token: updatedToken }).eq('id', userId)
        }
      }
    }
  } catch {
    // Silencioso
  }

  await supabase.from('appointments').delete().eq('id', id).eq('user_id', userId)
  revalidatePath('/agenda')
}

export async function criarAgendamento(input: {
  client_name: string
  service: string
  date: string
  time: string
  price: number
  status: 'confirmado' | 'pendente'
  notes: string
  location?: string | undefined
  client_phone?: string | undefined
  notify_whatsapp?: boolean | undefined
}) {
  const userId   = await requireUserId()
  const supabase = adminClient()
  const scheduled_at = `${input.date}T${input.time}:00-03:00`

  const dbStatus = input.status === 'pendente' ? 'aguardando_confirmacao' : input.status

  // Localiza ou cria o cliente (vincula histórico)
  const clientId = await findOrCreateClient(supabase, userId, input.client_name, input.client_phone)

  // Monta notes com nome, local e obs concatenados
  const notesValue = [input.client_name, input.location, input.notes].filter(Boolean).join(' — ') || null

  // Tenta inserir com colunas extras (migration 009); faz fallback se não existirem
  let apt: { id: string } | null = null
  const { data: fullApt, error: fullError } = await supabase.from('appointments').insert({
    user_id:      userId,
    client_id:    clientId,
    service:      input.service,
    scheduled_at,
    status:       dbStatus,
    price:        input.price || null,
    notes:        notesValue,
    client_name:  input.client_name || null,
    client_phone: input.client_phone || null,
  }).select('id').single()

  if (!fullError) {
    apt = fullApt
  } else if (fullError.message?.includes('client_name') || fullError.message?.includes('client_phone') || fullError.code === '42703') {
    // Coluna não existe ainda — insere sem ela (migration pendente)
    const { data: basicApt, error: basicError } = await supabase.from('appointments').insert({
      user_id:      userId,
      client_id:    clientId,
      service:      input.service,
      scheduled_at,
      status:       dbStatus,
      price:        input.price || null,
      notes:        notesValue,
    }).select('id').single()
    if (basicError) throw new Error(basicError.message)
    apt = basicApt
  } else {
    throw new Error(fullError.message)
  }

  // Atualiza last_contact do cliente (silencioso)
  if (clientId) {
    try {
      await supabase.from('clients').update({ last_contact: scheduled_at.slice(0, 10) }).eq('id', clientId)
    } catch { /* silencioso */ }
  }

  // Sincronizar com Google Calendar (silencioso se não configurado)
  try {
    const { data: user } = await supabase
      .from('users')
      .select('google_calendar_token, google_calendar_id')
      .eq('id', userId)
      .single()

    if (user?.google_calendar_token) {
      const token = user.google_calendar_token as GCalToken
      const calId = user.google_calendar_id ?? 'primary'
      const { eventId, updatedToken } = await createCalendarEvent(token, calId, {
        summary:       `${input.service}${input.client_name ? ` — ${input.client_name}` : ''}`,
        description:   input.notes || undefined,
        startDateTime: scheduled_at,
        durationMin:   60,
      })
      // Salvar eventId e token atualizado
      if (apt?.id) await supabase.from('appointments').update({ google_calendar_event_id: eventId }).eq('id', apt.id)
      if (updatedToken.access_token !== token.access_token) {
        await supabase.from('users').update({ google_calendar_token: updatedToken }).eq('id', userId)
      }
    }
  } catch {
    // Falha no Google Calendar não impede o agendamento
  }

  // Notificar cliente por WhatsApp (se solicitado)
  if (input.notify_whatsapp && input.client_phone) {
    try {
      const evolUrl      = process.env.EVOLUTION_API_URL
      const evolKey      = process.env.EVOLUTION_API_KEY
      const evolInstance = process.env.EVOLUTION_API_INSTANCE ?? 'meu-socio'

      if (evolUrl && evolKey) {
        const digits  = input.client_phone.replace(/\D/g, '')
        const phone   = digits.startsWith('55') ? digits : `55${digits}`
        const target  = `${phone}@s.whatsapp.net`

        const dt     = new Date(scheduled_at)
        const data   = dt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
        const hora   = dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })
        const valor  = input.price ? `\n💰 *Valor:* R$ ${input.price.toFixed(2).replace('.', ',')}` : ''

        const texto =
          `Olá, ${input.client_name}! 👋\n\n` +
          `Seu agendamento foi confirmado:\n\n` +
          `🔧 *Serviço:* ${input.service}\n` +
          `📅 *Data:* ${data} às ${hora}` +
          valor +
          `\n\nQualquer dúvida é só chamar! 😊`

        await fetch(`${evolUrl}/message/sendText/${evolInstance}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', apikey: evolKey },
          body: JSON.stringify({ number: target, text: texto }),
        })
      }
    } catch {
      // Falha no WhatsApp não impede o agendamento
    }
  }

  revalidatePath('/agenda')
}

export async function atualizarStatusAgendamento(
  id: string,
  status: 'confirmado' | 'concluido' | 'cancelado' | 'pendente',
) {
  const userId   = await requireUserId()
  const supabase = adminClient()

  const dbStatus = status === 'pendente' ? 'aguardando_confirmacao' : status

  const { error } = await supabase
    .from('appointments')
    .update({ status: dbStatus })
    .eq('id', id)
    .eq('user_id', userId)

  if (error) throw new Error(error.message)
  revalidatePath('/agenda')
}
