'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@supabase/supabase-js'
import { getAuthenticatedUserId } from '@/lib/get-user-id'

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

export async function excluirAgendamento(id: string) {
  const userId = await requireUserId()
  const supabase = adminClient()
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
}) {
  const userId   = await requireUserId()
  const supabase = adminClient()
  const scheduled_at = `${input.date}T${input.time}:00`

  // Mapeia status do formulário para valores aceitos pelo banco
  const dbStatus = input.status === 'pendente' ? 'aguardando_confirmacao' : input.status

  const { error } = await supabase.from('appointments').insert({
    user_id:  userId,
    service:  input.service,
    scheduled_at,
    status:   dbStatus,
    price:    input.price || null,
    notes:    [input.client_name, input.notes].filter(Boolean).join(' — ') || null,
  })

  if (error) throw new Error(error.message)
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
