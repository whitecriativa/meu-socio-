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

async function requireUserId(): Promise<string> {
  const userId = await getAuthenticatedUserId()
  if (!userId) throw new Error('Não autenticado')
  return userId
}

export async function adicionarCusto(formData: FormData) {
  const userId   = await requireUserId()
  const supabase = adminClient()

  const name        = String(formData.get('name') ?? '').trim()
  const amount      = parseFloat(String(formData.get('amount') ?? '0').replace(',', '.'))
  const periodicity = String(formData.get('periodicity') ?? 'mensal')
  const category    = String(formData.get('category') ?? 'outro')
  const dueDayRaw   = parseInt(String(formData.get('due_day') ?? ''))
  const due_day     = !isNaN(dueDayRaw) && dueDayRaw >= 1 && dueDayRaw <= 31 ? dueDayRaw : null

  if (!name || amount <= 0) return

  await supabase.from('costs_fixed').insert({
    user_id: userId,
    name,
    amount,
    periodicity,
    category,
    due_day,
  })

  revalidatePath('/configuracoes')
  revalidatePath('/calculadora')
}

export async function removerCusto(id: string) {
  const userId   = await requireUserId()
  const supabase = adminClient()

  await supabase
    .from('costs_fixed')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  revalidatePath('/configuracoes')
  revalidatePath('/calculadora')
}
