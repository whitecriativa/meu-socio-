'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@supabase/supabase-js'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

export async function criarAgendamento(input: {
  client_name: string
  service: string
  date: string       // 'YYYY-MM-DD'
  time: string       // 'HH:MM'
  price: number
  status: 'confirmado' | 'pendente'
  notes: string
}) {
  const userId   = process.env.NEXT_PUBLIC_DEMO_USER_ID!
  const supabase = adminClient()
  const datetime = `${input.date}T${input.time}:00`

  const { error } = await supabase.from('appointments').insert({
    user_id:  userId,
    service:  input.service,
    datetime,
    status:   input.status,
    price:    input.price,
    notes:    [input.client_name, input.notes].filter(Boolean).join(' — ') || null,
  })

  if (error) throw new Error(error.message)
  revalidatePath('/agenda')
}

export async function atualizarStatusAgendamento(
  id: string,
  status: 'confirmado' | 'concluido' | 'cancelado' | 'pendente',
) {
  const userId   = process.env.NEXT_PUBLIC_DEMO_USER_ID!
  const supabase = adminClient()

  const { error } = await supabase
    .from('appointments')
    .update({ status })
    .eq('id', id)
    .eq('user_id', userId)

  if (error) throw new Error(error.message)
  revalidatePath('/agenda')
}
