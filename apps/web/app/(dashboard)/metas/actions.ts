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

export async function salvarMeta(input: {
  monthly_goal: number
  dream: string
}) {
  const userId   = process.env.NEXT_PUBLIC_DEMO_USER_ID!
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
