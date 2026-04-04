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

export async function salvarMeta(input: {
  monthly_goal: number
  dream: string
}) {
  const userId   = await requireUserId()
  const supabase = adminClient()

  const { error } = await supabase
    .from('users')
    .update({
      monthly_goal: input.monthly_goal,
      dream:        input.dream || null,
    })
    .eq('id', userId)

  if (error) throw new Error(error.message)
  revalidatePath('/metas')
}
