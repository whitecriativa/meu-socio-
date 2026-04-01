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

export interface LancamentoInput {
  type: 'receita' | 'despesa'
  amount: number
  category: string
  description: string
  payment_method: string
  competence_date: string   // 'YYYY-MM-DD'
}

export async function salvarLancamento(input: LancamentoInput) {
  const userId  = process.env.NEXT_PUBLIC_DEMO_USER_ID!
  const supabase = adminClient()

  const { error } = await supabase.from('transactions').insert({
    user_id:          userId,
    type:             input.type,
    amount:           input.amount,
    category:         input.category,
    description:      input.description || null,
    payment_method:   input.payment_method,
    competence_date:  input.competence_date,
    paid_at:          new Date().toISOString(),
  })

  if (error) throw new Error(error.message)
  revalidatePath('/financeiro')
}

export async function excluirLancamento(id: string) {
  const userId   = process.env.NEXT_PUBLIC_DEMO_USER_ID!
  const supabase = adminClient()

  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) throw new Error(error.message)
  revalidatePath('/financeiro')
}
