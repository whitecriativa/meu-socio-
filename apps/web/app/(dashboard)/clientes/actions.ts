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

export async function excluirCliente(id: string) {
  const userId = await requireUserId()
  const supabase = adminClient()
  await supabase.from('clients').delete().eq('id', id).eq('user_id', userId)
  revalidatePath('/clientes')
}

export async function criarCliente(input: {
  name: string
  phone: string
  notes: string
}) {
  const userId   = await requireUserId()
  const supabase = adminClient()

  const { error } = await supabase.from('clients').insert({
    user_id:      userId,
    name:         input.name,
    phone:        input.phone || null,
    last_contact: new Date().toISOString(),
    total_spent:  0,
    status:       'active',
  })

  if (error) throw new Error(error.message)
  revalidatePath('/clientes')
}

export async function reativarCliente(clientId: string) {
  const userId   = await requireUserId()
  const supabase = adminClient()

  const { error } = await supabase
    .from('clients')
    .update({ status: 'active', last_contact: new Date().toISOString() })
    .eq('id', clientId)
    .eq('user_id', userId)

  if (error) throw new Error(error.message)
  revalidatePath('/clientes')
  revalidatePath(`/clientes/${clientId}`)
}

export async function editarNota(clientId: string, notes: string) {
  const userId   = await requireUserId()
  const supabase = adminClient()
  const { error } = await supabase
    .from('clients')
    .update({ notes })
    .eq('id', clientId)
    .eq('user_id', userId)
  if (error) throw new Error(error.message)
  revalidatePath(`/clientes/${clientId}`)
}

export async function marcarVip(clientId: string) {
  const userId   = await requireUserId()
  const supabase = adminClient()
  const { error } = await supabase
    .from('clients')
    .update({ status: 'vip' })
    .eq('id', clientId)
    .eq('user_id', userId)
  if (error) throw new Error(error.message)
  revalidatePath('/clientes')
  revalidatePath(`/clientes/${clientId}`)
}

export async function editarCliente(clientId: string, input: { name: string; phone: string }) {
  const userId   = await requireUserId()
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
