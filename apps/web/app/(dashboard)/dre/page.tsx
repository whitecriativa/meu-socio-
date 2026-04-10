import { getAuthenticatedUserId } from '@/lib/get-user-id'
import { createClient } from '@supabase/supabase-js'
import { DreTable } from '@/components/dre/dre-table'
import { buildDreStructured, type TxRow } from '@/lib/dre'

export const dynamic = 'force-dynamic'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

async function getData(selectedPeriod?: string) {
  const userId = (await getAuthenticatedUserId()) ?? process.env.NEXT_PUBLIC_DEMO_USER_ID!
  const supabase = adminClient()

  const now = new Date()
  let year = now.getFullYear()
  let month = now.getMonth() + 1

  if (selectedPeriod && /^\d{4}-\d{2}$/.test(selectedPeriod)) {
    year  = parseInt(selectedPeriod.split('-')[0]!)
    month = parseInt(selectedPeriod.split('-')[1]!)
  }

  const mStr = `${year}-${String(month).padStart(2, '0')}`
  const lastDay = new Date(year, month, 0).getDate()
  const monthStart = `${mStr}-01`
  const monthEnd   = `${mStr}-${String(lastDay).padStart(2, '0')}`
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1
  const upperLimit = isCurrentMonth ? now.toISOString().substring(0, 10) : monthEnd

  const { data } = await supabase
    .from('transactions')
    .select('id, type, amount, category, description, payment_method, competence_date, client_id')
    .eq('user_id', userId)
    .gte('competence_date', monthStart)
    .lte('competence_date', upperLimit)
    .order('competence_date', { ascending: false })

  const txs = (data as TxRow[] ?? [])
  const revenues = txs.filter(t => t.type === 'receita')
  const expenses = txs.filter(t => t.type === 'despesa')
  const totalRevenue  = revenues.reduce((s, t) => s + Number(t.amount ?? 0), 0)
  const totalExpenses = expenses.reduce((s, t) => s + Number(t.amount ?? 0), 0)

  const selectedDate = new Date(year, month - 1, 1)
  const monthName    = selectedDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  const period       = monthName.charAt(0).toUpperCase() + monthName.slice(1)
  const currentPeriod = `${year}-${String(month).padStart(2, '0')}`

  const dreStructured = buildDreStructured(revenues, expenses, totalRevenue, totalExpenses, period)

  return { dreStructured, currentPeriod }
}

export default async function DrePage({
  searchParams,
}: {
  searchParams?: Promise<{ mes?: string }>
}) {
  const params = await (searchParams ?? Promise.resolve({} as { mes?: string }))
  const { dreStructured, currentPeriod } = await getData(params.mes)

  return (
    <div className="px-4 py-5 md:px-8 md:py-8 max-w-4xl">
      <DreTable dre={dreStructured} currentPeriod={currentPeriod} />
    </div>
  )
}
