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
  const nowYear  = now.getFullYear()
  const nowMonth = now.getMonth() + 1

  let year  = nowYear
  let month = nowMonth
  if (selectedPeriod && /^\d{4}-\d{2}$/.test(selectedPeriod)) {
    year  = parseInt(selectedPeriod.split('-')[0]!)
    month = parseInt(selectedPeriod.split('-')[1]!)
  }

  // 6-month window ending at selected period
  const monthsMeta: { label: string; start: string; end: string }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(year, month - 1 - i, 1)
    const y = d.getFullYear()
    const m = d.getMonth() + 1
    const mStr = `${y}-${String(m).padStart(2, '0')}`
    const lastDay = new Date(y, m, 0).getDate()
    const label = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
    monthsMeta.push({
      label: label.charAt(0).toUpperCase() + label.slice(1),
      start: `${mStr}-01`,
      end:   `${mStr}-${String(lastDay).padStart(2, '0')}`,
    })
  }

  const sixMonthsAgo      = monthsMeta[0]!.start
  const currentMonthStart = monthsMeta[5]!.start
  const currentMonthEnd   = monthsMeta[5]!.end
  const isCurrentMonth = year === nowYear && month === nowMonth
  const upperLimit = isCurrentMonth ? now.toISOString().substring(0, 10) : currentMonthEnd

  const { data } = await supabase
    .from('transactions')
    .select('id, type, amount, category, description, payment_method, competence_date, client_id')
    .eq('user_id', userId)
    .gte('competence_date', sixMonthsAgo)
    .lte('competence_date', upperLimit)
    .order('competence_date', { ascending: false })

  const allTxs = (data as TxRow[] ?? [])

  const currentTxs = allTxs.filter(
    t => t.competence_date && t.competence_date >= currentMonthStart && t.competence_date <= currentMonthEnd,
  )
  const revenues = currentTxs.filter(t => t.type === 'receita')
  const expenses = currentTxs.filter(t => t.type === 'despesa')
  const totalRevenue  = revenues.reduce((s, t) => s + Number(t.amount ?? 0), 0)
  const totalExpenses = expenses.reduce((s, t) => s + Number(t.amount ?? 0), 0)

  const selectedDate = new Date(year, month - 1, 1)
  const monthName    = selectedDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  const period       = monthName.charAt(0).toUpperCase() + monthName.slice(1)
  const currentPeriod = `${year}-${String(month).padStart(2, '0')}`

  const dreStructured = buildDreStructured(revenues, expenses, totalRevenue, totalExpenses, period)

  // Historical 6-month data for chart
  const revenueHistory = monthsMeta.map(({ label, start, end }) => {
    const mTxs = allTxs.filter(
      t => t.competence_date && t.competence_date >= start && t.competence_date <= end,
    )
    const rev = mTxs.filter(t => t.type === 'receita').reduce((s, t) => s + Number(t.amount ?? 0), 0)
    const exp = mTxs.filter(t => t.type === 'despesa').reduce((s, t) => s + Number(t.amount ?? 0), 0)
    return { month: label, revenue: rev, expenses: exp }
  })

  return { dreStructured, currentPeriod, revenueHistory }
}

export default async function DrePage({
  searchParams,
}: {
  searchParams?: Promise<{ mes?: string }>
}) {
  const params = await (searchParams ?? Promise.resolve({} as { mes?: string }))
  const { dreStructured, currentPeriod, revenueHistory } = await getData(params.mes)

  return (
    <div className="px-4 py-5 md:px-8 md:py-8 max-w-4xl">
      <DreTable dre={dreStructured} currentPeriod={currentPeriod} revenueHistory={revenueHistory} />
    </div>
  )
}
