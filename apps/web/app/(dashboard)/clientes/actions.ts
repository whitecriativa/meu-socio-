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

export async function criarCliente(input: {
  name: string
  phone: string
  notes: string
}) {
  const userId   = process.env.NEXT_PUBLIC_DEMO_USER_ID!
  const supabase = adminClient()

  const { error } = await supabase.from('clients').insert({
    user_id:      userId,
    name:         input.name,
    phone:        input.phone || null,
    last_contact: new Date().toISOString(),
    total_spent:  0,
    status:       'ativo',
  })

  if (error) throw new Error(error.message)
  revalidatePath('/clientes')
}

export async function reativarCliente(clientId: string) {
  const userId   = process.env.NEXT_PUBLIC_DEMO_USER_ID!
  const supabase = adminClient()

  const { error } = await supabase
    .from('clients')
    .update({ status: 'ativo', last_contact: new Date().toISOString() })
    .eq('id', clientId)
    .eq('user_id', userId)

  if (error) throw new Error(error.message)
  revalidatePath('/clientes')
  revalidatePath(`/clientes/${clientId}`)
}

export async function editarCliente(clientId: string, input: { name: string; phone: string }) {
  const userId   = process.env.NEXT_PUBLIC_DEMO_USER_ID!
  const supabase = adminClient()

  const { error } = await supabase
    .from('clients')
    .update({
      name:  input.name,
      phone: input.phone || null,
    })
    .eq('id', clientId)
    .eq('user_id', userId)

  if (error) throw new Error(error.message)
  revalidatePath('/clientes')
  revalidatePath(`/clientes/${clientId}`)
}
