import { getAuthenticatedUserId } from '@/lib/get-user-id'
import { createClient } from '@supabase/supabase-js'
import { CalculadoraClient } from '@/components/calculadora/calculadora-client'

export const dynamic = 'force-dynamic'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

function toMonthly(amount: number, periodicity: string): number {
  if (periodicity === 'semanal') return amount * 4.33
  if (periodicity === 'anual')   return amount / 12
  return amount
}

async function getBaseData() {
  const userId = (await getAuthenticatedUserId()) ?? process.env.NEXT_PUBLIC_DEMO_USER_ID!
  const supabase = adminClient()

  const now        = new Date()
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const today      = now.toISOString().substring(0, 10)

  const [{ data: user }, { data: txs }, { data: apts }, { data: costs }] = await Promise.all([
    supabase.from('users').select('name, profile_type').eq('id', userId).maybeSingle(),
    supabase.from('transactions').select('type, amount, category')
      .eq('user_id', userId)
      .gte('competence_date', monthStart)
      .lte('competence_date', today),
    supabase.from('appointments').select('price, status')
      .eq('user_id', userId)
      .gte('scheduled_at', `${monthStart}T00:00:00`)
      .lte('scheduled_at', `${today}T23:59:59`)
      .neq('status', 'cancelado'),
    supabase.from('costs_fixed').select('amount, periodicity')
      .eq('user_id', userId),
  ])

  type TxRow   = { type: string; amount: number | null; category: string | null }
  type AptRow  = { price: number | null; status: string | null }
  type CostRow = { amount: number | null; periodicity: string | null }

  const revenue = (txs as TxRow[] ?? [])
    .filter((t) => t.type === 'receita')
    .reduce((s, t) => s + Number(t.amount ?? 0), 0)

  const servicesCount = (apts as AptRow[] ?? []).length
  const avgTicket     = servicesCount > 0 ? revenue / servicesCount : 0

  // Total de custos fixos cadastrados normalizado para mensal
  const totalCostosFixosCadastrados = (costs as CostRow[] ?? [])
    .reduce((s, c) => s + toMonthly(Number(c.amount ?? 0), c.periodicity ?? 'mensal'), 0)

  // Fallback: se não há custos cadastrados, usa despesas do mês atual
  const expenses = (txs as TxRow[] ?? [])
    .filter((t) => t.type === 'despesa')
    .reduce((s, t) => s + Number(t.amount ?? 0), 0)

  const fixedCosts         = totalCostosFixosCadastrados > 0 ? totalCostosFixosCadastrados : expenses
  const hasCadasteredCosts = totalCostosFixosCadastrados > 0

  return {
    profileType:          (user?.profile_type as string) ?? '',
    fixedCosts:           Math.round(fixedCosts * 100) / 100,
    servicesThisMonth:    servicesCount,
    avgTicket:            Math.round(avgTicket * 100) / 100,
    hasCadasteredCosts,
  }
}

export default async function CalculadoraPage() {
  const data = await getBaseData()

  return (
    <div className="px-4 py-5 md:px-8 md:py-8 max-w-3xl">
      <CalculadoraClient {...data} />
    </div>
  )
}
