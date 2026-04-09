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
  client_name?: string | undefined
  pending?: boolean // true = pagamento futuro (paid_at = null)
}

async function findClientId(
  supabase: ReturnType<typeof adminClient>,
  userId: string,
  name: string,
): Promise<string | null> {
  if (!name?.trim()) return null
  const trimmed = name.trim()

  // Busca exata → parcial → primeira palavra
  for (const pattern of [trimmed, `%${trimmed}%`, `${trimmed.split(' ')[0]}%`]) {
    if (pattern.replace(/%/g, '').length < 2) continue
    const { data } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', userId)
      .ilike('name', pattern)
      .limit(1)
      .maybeSingle()
    if (data?.id) return data.id
  }
  return null
}

export async function salvarLancamento(input: LancamentoInput) {
  const userId = await requireUserId()
  const supabase = adminClient()

  // Tenta vincular ao cliente se nome foi fornecido
  const clientId = input.client_name ? await findClientId(supabase, userId, input.client_name) : null

  const { error } = await supabase.from('transactions').insert({
    user_id:         userId,
    client_id:       clientId,
    type:            input.type,
    amount:          input.amount,
    category:        input.category,
    description:     input.description || null,
    payment_method:  input.payment_method,
    competence_date: input.competence_date,
    paid_at:         input.pending ? null : new Date().toISOString(),
  })

  if (error) throw new Error(error.message)
  revalidatePath('/financeiro')
}

export async function editarDataLancamento(id: string, competence_date: string) {
  const userId = await requireUserId()
  const supabase = adminClient()
  const { error } = await supabase
    .from('transactions')
    .update({ competence_date })
    .eq('id', id)
    .eq('user_id', userId)
  if (error) throw new Error(error.message)
  revalidatePath('/financeiro')
}

export async function marcarTransacaoPaga(id: string) {
  const userId = await requireUserId()
  const supabase = adminClient()
  const { error } = await supabase
    .from('transactions')
    .update({ paid_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId)
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
