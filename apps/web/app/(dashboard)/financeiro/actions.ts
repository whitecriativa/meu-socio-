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

export interface LancamentoInput {
  type: 'receita' | 'despesa'
  amount: number
  category: string
  description: string
  payment_method: string
  competence_date: string
}

export async function salvarLancamento(input: LancamentoInput) {
  const userId = await requireUserId()
  const supabase = adminClient()

  const { error } = await supabase.from('transactions').insert({
    user_id:         userId,
    type:            input.type,
    amount:          input.amount,
    category:        input.category,
    description:     input.description || null,
    payment_method:  input.payment_method,
    competence_date: input.competence_date,
    paid_at:         new Date().toISOString(),
  })

  if (error) throw new Error(error.message)
  revalidatePath('/financeiro')
}

export async function excluirLancamento(id: string) {
  const userId = await requireUserId()
  const supabase = adminClient()

  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) throw new Error(error.message)
  revalidatePath('/financeiro')
}

export interface CustoFixoInput {
  name: string
  amount: number
  periodicity: 'mensal' | 'semanal' | 'anual'
  category: string
}

export async function adicionarCustoFixo(input: CustoFixoInput) {
  const userId = await requireUserId()
  const supabase = adminClient()

  const { error } = await supabase.from('costs_fixed').insert({
    user_id:     userId,
    name:        input.name,
    amount:      input.amount,
    periodicity: input.periodicity,
    category:    input.category,
  })

  if (error) throw new Error(error.message)
  revalidatePath('/financeiro')
  revalidatePath('/calculadora')
}

export async function excluirCustoFixo(id: string) {
  const userId = await requireUserId()
  const supabase = adminClient()

  const { error } = await supabase
    .from('costs_fixed')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) throw new Error(error.message)
  revalidatePath('/financeiro')
  revalidatePath('/calculadora')
}
