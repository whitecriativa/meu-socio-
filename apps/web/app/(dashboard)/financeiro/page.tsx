import { getAuthenticatedUserId } from '@/lib/get-user-id'
import { createClient } from '@supabase/supabase-js'
import { FinanceiroClient } from '@/components/financeiro/financeiro-client'
import type { FinanceiroData } from '@/components/financeiro/types'
import type { ContratoDado, Installment } from '@/components/financeiro/contratos-list'

export const dynamic = 'force-dynamic'

const PIE_COLORS = ['#0F40CB', '#B6F273', '#a78bfa', '#6ee7b7', '#c4b5fd', '#fbbf24', '#f87171']

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

type TxRow = {
  id: string
  type: string
  amount: number | null
  category: string | null
  description: string | null
  payment_method: string | null
  competence_date: string | null
  client_id: string | null
}

async function getData(selectedPeriod?: string) {
  const userId = (await getAuthenticatedUserId()) ?? process.env.NEXT_PUBLIC_DEMO_USER_ID!
  const supabase = adminClient()

  const now = new Date()
  const nowYear = now.getFullYear()
  const nowMonth = now.getMonth() + 1

  // Parse selected period (YYYY-MM) ou usa mês atual
  let year = nowYear
  let month = nowMonth
  if (selectedPeriod && /^\d{4}-\d{2}$/.test(selectedPeriod)) {
    year  = parseInt(selectedPeriod.split('-')[0]!)
    month = parseInt(selectedPeriod.split('-')[1]!)
  }

  const today = now.toISOString().substring(0, 10)

  // Build last 6 months metadata centrado no período selecionado
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
      end: `${mStr}-${String(lastDay).padStart(2, '0')}`,
    })
  }

  const sixMonthsAgo      = monthsMeta[0]!.start
  const currentMonthStart = monthsMeta[5]!.start
  const currentMonthEnd   = monthsMeta[5]!.end
  const prevMonthStart    = monthsMeta[4]!.start
  const prevMonthEnd      = monthsMeta[4]!.end

  // Para meses passados, usa fim do mês como limite; para o mês atual, usa hoje
  const isCurrentMonth = year === nowYear && month === nowMonth
  const upperLimit = isCurrentMonth ? today : currentMonthEnd

  const [{ data }, { data: rawContracts }, { data: rawCosts }] = await Promise.all([
    supabase
      .from('transactions')
      .select('id, type, amount, category, description, payment_method, competence_date, client_id')
      .eq('user_id', userId)
      .gte('competence_date', sixMonthsAgo)
      .lte('competence_date', upperLimit)
      .order('competence_date', { ascending: false }),
    supabase
      .from('contracts')
      .select('id, client_name, description, total_amount, installments_count, start_date, status, installments(id, installment_number, amount, due_date, status, paid_at)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    supabase
      .from('costs_fixed')
      .select('id, name, amount, periodicity, category, due_day')
      .eq('user_id', userId)
      .order('created_at', { ascending: true }),
  ])

  const allTxs = (data as TxRow[] ?? [])

  // Current month
  const currentTxs = allTxs.filter(
    (t) => t.competence_date && t.competence_date >= currentMonthStart && t.competence_date <= currentMonthEnd,
  )
  const revenues = currentTxs.filter((t) => t.type === 'receita')
  const expenses = currentTxs.filter((t) => t.type === 'despesa')

  const totalRevenue  = revenues.reduce((s, t) => s + Number(t.amount ?? 0), 0)
  const totalExpenses = expenses.reduce((s, t) => s + Number(t.amount ?? 0), 0)
  const netResult     = totalRevenue - totalExpenses

  // Categories
  const revByCategory = revenues.reduce<Record<string, number>>((acc, t) => {
    const cat = t.category ?? 'Receitas'
    acc[cat] = (acc[cat] ?? 0) + Number(t.amount ?? 0)
    return acc
  }, {})

  const expByCategory = expenses.reduce<Record<string, number>>((acc, t) => {
    const cat = t.category ?? 'Outros'
    acc[cat] = (acc[cat] ?? 0) + Number(t.amount ?? 0)
    return acc
  }, {})

  // Revenue history (6 months)
  const revenueHistory = monthsMeta.map(({ label, start, end }) => {
    const mTxs = allTxs.filter(
      (t) => t.competence_date && t.competence_date >= start && t.competence_date <= end,
    )
    const rev = mTxs.filter((t) => t.type === 'receita').reduce((s, t) => s + Number(t.amount ?? 0), 0)
    const exp = mTxs.filter((t) => t.type === 'despesa').reduce((s, t) => s + Number(t.amount ?? 0), 0)
    return { month: label, revenue: rev, expenses: exp }
  })

  // Retention: clients who appear in both prev month and current month
  const prevClients = new Set(
    allTxs
      .filter((t) => t.competence_date && t.competence_date >= prevMonthStart && t.competence_date <= prevMonthEnd && t.type === 'receita' && t.client_id != null)
      .map((t) => t.client_id as string),
  )
  const currClients = new Set(
    revenues.filter((t) => t.client_id != null).map((t) => t.client_id as string),
  )
  const retained = [...prevClients].filter((c) => currClients.has(c)).length
  const retention = prevClients.size > 0 ? Math.round((retained / prevClients.size) * 100) : 0

  // Indicators
  const avgTicket      = revenues.length > 0 ? Math.round(totalRevenue / revenues.length) : 0
  const costPerService = revenues.length > 0 ? Math.round(totalExpenses / revenues.length) : 0
  const netMargin      = totalRevenue > 0 ? Math.round(((totalRevenue - totalExpenses) / totalRevenue) * 100) : 0
  const breakEven      = totalExpenses

  // Inadimplência: parcelas atrasadas (vencidas e não pagas) / valor total de parcelas do mês
  const allInstallments = (rawContracts as { installments: { amount: number | null; due_date: string; status: string }[] | null }[] ?? [])
    .flatMap((c) => c.installments ?? [])
  const overdueAmount = allInstallments
    .filter((i) => i.status === 'pendente' && i.due_date < now.toISOString().slice(0, 10))
    .reduce((s, i) => s + Number(i.amount ?? 0), 0)
  const totalInstallmentAmount = allInstallments
    .reduce((s, i) => s + Number(i.amount ?? 0), 0)
  const defaultRate = totalInstallmentAmount > 0
    ? Math.round((overdueAmount / totalInstallmentAmount) * 100)
    : 0

  // Pie
  const expensesPie = Object.entries(expByCategory).map(([name, value], i) => ({
    name,
    value,
    color: PIE_COLORS[i % PIE_COLORS.length] ?? '#0F40CB',
  }))

  // DRE
  const revSubs = Object.entries(revByCategory).map(([label, value]) => ({ label, value }))
  const expSubs = Object.entries(expByCategory).map(([label, value]) => ({ label, value }))

  const dre: FinanceiroData['dre'] = [
    {
      label: '(+) Receitas',
      value: totalRevenue,
      ...(revSubs.length > 0 ? { sub: revSubs } : {}),
    },
  ]

  if (totalExpenses > 0) {
    dre.push({
      label: '(-) Despesas',
      value: totalExpenses,
      isDeduction: true,
      ...(expSubs.length > 0 ? { sub: expSubs } : {}),
    })
  }

  dre.push({
    label: '(=) Resultado líquido',
    value: netResult,
    isResult: true,
  })

  // Mapeia contratos com parcelas tipadas
  type RawInstallment = {
    id: string; installment_number: number; amount: number | null
    due_date: string; status: string; paid_at: string | null
  }
  type RawContract = {
    id: string; client_name: string; description: string
    total_amount: number | null; installments_count: number; start_date: string
    status: string; installments: RawInstallment[] | null
  }

  const contratos: ContratoDado[] = (rawContracts as RawContract[] ?? []).map((c) => ({
    id:                 c.id,
    client_name:        c.client_name,
    description:        c.description,
    total_amount:       Number(c.total_amount ?? 0),
    installments_count: c.installments_count,
    start_date:         c.start_date,
    status:             (c.status as ContratoDado['status']) ?? 'ativo',
    installments:       (c.installments ?? []).map((i): Installment => ({
      id:                 i.id,
      installment_number: i.installment_number,
      amount:             Number(i.amount ?? 0),
      due_date:           i.due_date,
      status:             (i.status as Installment['status']) ?? 'pendente',
      paid_at:            i.paid_at,
    })),
  }))

  const selectedDate = new Date(year, month - 1, 1)
  const monthName  = selectedDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  const monthLabel = monthName.charAt(0).toUpperCase() + monthName.slice(1)
  const currentPeriod = `${year}-${String(month).padStart(2, '0')}`

  const lancamentosDoMes = currentTxs.map((t) => ({
    id:              t.id,
    type:            t.type as 'receita' | 'despesa',
    amount:          Number(t.amount ?? 0),
    category:        t.category ?? 'Outros',
    description:     t.description,
    payment_method:  t.payment_method,
    competence_date: t.competence_date ?? '',
  }))

  const pjData: FinanceiroData = {
    month: monthLabel,
    dre,
    indicators: {
      avg_ticket: avgTicket,
      retention,
      cost_per_service: costPerService,
      net_margin: netMargin,
      break_even: breakEven,
      default_rate: defaultRate,
    },
    revenueHistory,
    expensesByCategory:
      expensesPie.length > 0
        ? expensesPie
        : [{ name: 'Sem despesas', value: 1, color: PIE_COLORS[0] ?? '#0F40CB' }],
    lancamentos: lancamentosDoMes,
    contratos,
  }

  // PF tab — placeholder until personal finance module is built
  const pfData: FinanceiroData = {
    month: monthLabel,
    dre: [
      { label: '(+) Entradas pessoais', value: 0 },
      { label: '(=) Gestão pessoal em breve', value: 0, isResult: true },
    ],
    indicators: {
      avg_ticket: 0,
      retention: 0,
      cost_per_service: 0,
      net_margin: 0,
      break_even: 0,
      default_rate: 0,
    },
    revenueHistory,
    expensesByCategory: [{ name: 'Em breve', value: 1, color: PIE_COLORS[0] ?? '#0F40CB' }],
    lancamentos: [],
    contratos: [],
  }

  type CostRow = { id: string; name: string; amount: number | null; periodicity: string | null; category: string | null; due_day: number | null }
  const custosFixos = (rawCosts as CostRow[] ?? []).map((c) => ({
    id:          c.id,
    name:        c.name,
    amount:      Number(c.amount ?? 0),
    periodicity: c.periodicity ?? 'mensal',
    category:    c.category ?? 'outro',
    due_day:     c.due_day ?? null,
  }))

  // Pagamentos futuros: custos_fixos com due_day, cruzados com despesas do mês
  const expenseNamesThisMonth = new Set(
    currentTxs
      .filter((t) => t.type === 'despesa')
      .flatMap((t) => [t.description, t.category].filter(Boolean).map((s) => s!.toLowerCase().trim()))
  )

  const pagamentosFuturos = custosFixos
    .filter((c) => c.periodicity === 'mensal' || c.periodicity === 'semanal')
    .map((c) => {
      const nameLow = c.name.toLowerCase().trim()
      const paid = [...expenseNamesThisMonth].some(
        (s) => s.includes(nameLow) || nameLow.includes(s)
      )
      const dueDate = c.due_day
        ? `${year}-${String(month).padStart(2, '0')}-${String(c.due_day).padStart(2, '0')}`
        : null
      const today2 = `${year}-${String(month).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`
      const overdue = !paid && dueDate !== null && dueDate < today2 && isCurrentMonth
      return { ...c, paid, dueDate, overdue }
    })
    .sort((a, b) => (a.due_day ?? 99) - (b.due_day ?? 99))

  return { pjData, pfData, custosFixos, currentPeriod, pagamentosFuturos }
}

export default async function FinanceiroPage({
  searchParams,
}: {
  searchParams?: Promise<{ mes?: string }>
}) {
  const params = await (searchParams ?? Promise.resolve({} as { mes?: string }))
  const { pjData, pfData, custosFixos, currentPeriod, pagamentosFuturos } = await getData(params.mes)

  return (
    <div className="px-4 py-5 md:px-8 md:py-8 max-w-5xl">
      <FinanceiroClient pj={pjData} pf={pfData} custosFixos={custosFixos} currentPeriod={currentPeriod} pagamentosFuturos={pagamentosFuturos} />
    </div>
  )
}
