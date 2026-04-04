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

export async function criarContrato(formData: FormData) {
  const userId   = await requireUserId()
  const supabase = adminClient()

  const clientName        = String(formData.get('client_name') ?? '').trim()
  const description       = String(formData.get('description') ?? '').trim()
  const totalAmount       = parseFloat(String(formData.get('total_amount') ?? '0').replace(',', '.'))
  const installmentsCount = parseInt(String(formData.get('installments_count') ?? '1'))
  const firstDueDate      = String(formData.get('first_due_date') ?? '')

  if (!clientName || !description || totalAmount <= 0 || installmentsCount <= 0 || !firstDueDate) return

  const amountPerInstallment = Math.round((totalAmount / installmentsCount) * 100) / 100

  const { data: contract } = await supabase
    .from('contracts')
    .insert({
      user_id:            userId,
      client_name:        clientName,
      description,
      total_amount:       totalAmount,
      installments_count: installmentsCount,
      start_date:         firstDueDate,
    })
    .select('id')
    .single()

  if (!contract) return

  const parts = firstDueDate.split('-').map(Number)
  const baseYear  = parts[0] ?? new Date().getFullYear()
  const baseMonth = parts[1] ?? 1
  const baseDay   = parts[2] ?? 1

  const installments = Array.from({ length: installmentsCount }, (_, i) => {
    const d = new Date(baseYear, baseMonth - 1 + i, baseDay)
    return {
      contract_id:        contract.id,
      user_id:            userId,
      installment_number: i + 1,
      amount:             amountPerInstallment,
      due_date:           d.toISOString().substring(0, 10),
      status:             'pendente',
    }
  })

  await supabase.from('installments').insert(installments)
  revalidatePath('/financeiro')
}

export async function pagarParcela(installmentId: string) {
  const userId   = await requireUserId()
  const supabase = adminClient()

  const { data: inst } = await supabase
    .from('installments')
    .select('id, installment_number, amount, contract_id, contracts(description, client_name, installments_count)')
    .eq('id', installmentId)
    .eq('user_id', userId)
    .single()

  if (!inst) return

  type ContractRef = { description: string; client_name: string; installments_count: number }
  const contract = (inst as unknown as { contracts: ContractRef }).contracts
  const today    = new Date().toISOString().substring(0, 10)

  await supabase
    .from('installments')
    .update({ status: 'pago', paid_at: new Date().toISOString() })
    .eq('id', installmentId)

  await supabase.from('transactions').insert({
    user_id:         userId,
    type:            'receita',
    amount:          inst.amount,
    category:        'Contratos',
    description:     `Parcela ${inst.installment_number}/${contract?.installments_count ?? '?'} — ${contract?.description ?? ''} (${contract?.client_name ?? ''})`,
    competence_date: today,
    payment_method:  'outros',
  })

  const { data: pendentes } = await supabase
    .from('installments')
    .select('id')
    .eq('contract_id', inst.contract_id)
    .neq('status', 'pago')

  if (pendentes && pendentes.length === 0) {
    await supabase
      .from('contracts')
      .update({ status: 'concluido' })
      .eq('id', inst.contract_id)
  }

  revalidatePath('/financeiro')
}

export async function cancelarContrato(contractId: string) {
  const userId   = await requireUserId()
  const supabase = adminClient()

  await supabase
    .from('contracts')
    .update({ status: 'cancelado' })
    .eq('id', contractId)
    .eq('user_id', userId)

  revalidatePath('/financeiro')
}
