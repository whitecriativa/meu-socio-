'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { getAuthenticatedUserId } from '@/lib/get-user-id'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

async function requireUserId() {
  const userId = await getAuthenticatedUserId()
  if (!userId) throw new Error('Não autenticado')
  return userId
}

export async function criarServico(formData: FormData) {
  const userId   = await requireUserId()
  const supabase = adminClient()

  const name         = String(formData.get('name') ?? '').trim()
  const price        = parseFloat(String(formData.get('price') ?? '0').replace(',', '.'))
  const duration_min = parseInt(String(formData.get('duration_min') ?? '60'))
  const description  = String(formData.get('description') ?? '').trim()

  if (!name) return

  await supabase.from('services').insert({
    user_id: userId,
    name,
    price:        price > 0 ? price : null,
    duration_min: duration_min > 0 ? duration_min : null,
    description:  description || null,
  })

  revalidatePath('/servicos')
}

export async function excluirServico(id: string) {
  const userId   = await requireUserId()
  const supabase = adminClient()
  await supabase.from('services').delete().eq('id', id).eq('user_id', userId)
  revalidatePath('/servicos')
}

export async function toggleServico(id: string, active: boolean) {
  const userId   = await requireUserId()
  const supabase = adminClient()
  await supabase.from('services').update({ active }).eq('id', id).eq('user_id', userId)
  revalidatePath('/servicos')
}
