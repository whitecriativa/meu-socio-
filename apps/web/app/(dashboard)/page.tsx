import { createClient } from '@supabase/supabase-js'
import { getAuthenticatedUserId } from '@/lib/get-user-id'
import { HeroCard }         from '@/components/dashboard/hero-card'
import { QuickAccess }      from '@/components/dashboard/quick-access'
import { AlertsList }       from '@/components/dashboard/alerts-list'
import { FinancialHealth }  from '@/components/dashboard/financial-health'
import { AppointmentsCard } from '@/components/dashboard/appointments-card'
import { TasksCard }        from '@/components/dashboard/tasks-card'
import { LearnPreview }     from '@/components/dashboard/learn-preview'
import { BusinessInsights } from '@/components/dashboard/business-insights'

export const dynamic = 'force-dynamic'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

type TxRow  = { type: string | null; amount: number | null; competence_date: string | null; client_id: string | null }
type AptRow = { id: string; service: string | null; scheduled_at: string | null; status: string | null; notes: string | null; client_name?: string | null; clients: { name: string | null }[] | null }
type TaskRow = { id: string; title: string | null; quadrant: string | null; completed_at: string | null }

const GENERIC_NAMES = new Set(['cliente', 'sem nome', 'amigo', 'usuário', 'user', '', 'null', 'undefined'])
function extractAptName(row: AptRow): string {
  const candidates = [
    row.client_name?.trim(),
    row.clients?.[0]?.name?.trim(),
    row.notes?.includes(' — ') ? row.notes.split(' — ')[0]!.trim() : null,
    (row.notes?.trim() && !row.notes.includes(' — ') && row.notes.trim().length < 60) ? row.notes.trim() : null,
  ]
  for (const c of candidates) {
    if (c && !GENERIC_NAMES.has(c.toLowerCase())) return c
  }
  return ''
}

async function getDashboardData() {
  const userId = (await getAuthenticatedUserId()) ?? process.env.NEXT_PUBLIC_DEMO_USER_ID!
  const supabase = adminClient()

  const now        = new Date()
  const today      = now.toISOString().substring(0, 10)
  const yesterday  = new Date(now.getTime() - 86400000).toISOString().substring(0, 10)
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

  const prevMonth      = now.getMonth() === 0 ? 11 : now.getMonth() - 1
  const prevYear       = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
  const prevMonthStart = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-01`
  const prevMonthEnd   = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

  const [
    { data: user },
    { data: txYesterday },
    { data: txMonth },
    { data: txPrevMonth },
    { data: apts },
    { data: tasks },
  ] = await Promise.all([
    supabase.from('users').select('name, monthly_goal').eq('id', userId).maybeSingle(),
    supabase.from('transactions').select('amount').eq('user_id', userId).eq('type', 'receita').eq('competence_date', yesterday),
    supabase.from('transactions').select('type, amount, client_id').eq('user_id', userId).gte('competence_date', monthStart).lte('competence_date', today),
    supabase.from('transactions').select('amount').eq('user_id', userId).eq('type', 'receita').gte('competence_date', prevMonthStart).lt('competence_date', prevMonthEnd),
    supabase.from('appointments').select('id, service, scheduled_at, status, notes, client_name, clients(name)')
      .eq('user_id', userId)
      .gte('scheduled_at', `${today}T00:00:00`)
      .lte('scheduled_at', `${new Date(now.getTime() + 7 * 86400000).toISOString().substring(0, 10)}T23:59:59`)
      .in('status', ['confirmado', 'aguardando_confirmacao'])
      .order('scheduled_at', { ascending: true })
      .limit(6),
    supabase.from('tasks').select('id, title, quadrant, completed_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const monthTxs      = (txMonth as TxRow[] ?? [])
  const receitas      = monthTxs.filter((t) => t.type === 'receita')
  const revenueMonth  = receitas.reduce((s, t) => s + Number(t.amount ?? 0), 0)
  const expensesMonth = monthTxs.filter((t) => t.type === 'despesa').reduce((s, t) => s + Number(t.amount ?? 0), 0)

  const revenueYesterday = (txYesterday as { amount: number | null }[] ?? []).reduce((s, t) => s + Number(t.amount ?? 0), 0)
  const revenuePrevMonth = (txPrevMonth as { amount: number | null }[] ?? []).reduce((s, t) => s + Number(t.amount ?? 0), 0)

  const goalTarget  = Number(user?.monthly_goal ?? 0)
  const goalPercent = goalTarget > 0 ? Math.min(100, Math.round((revenueMonth / goalTarget) * 100)) : 0
  const vsLastMonth = revenuePrevMonth > 0
    ? Math.round(((revenueMonth - revenuePrevMonth) / revenuePrevMonth) * 100)
    : 0

  // Indicadores do negócio
  const totalVendas    = receitas.length
  const ticketMedio    = totalVendas > 0 ? Math.round(revenueMonth / totalVendas) : 0
  const clientesUnicos = new Set(receitas.map((t) => t.client_id).filter(Boolean)).size
  const daysInMonth    = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const daysPassed     = now.getDate()
  const projecao       = daysPassed > 0 ? Math.round((revenueMonth / daysPassed) * daysInMonth) : 0

  // Appointments
  const aptRows = (apts as AptRow[] ?? [])
  const appointments = aptRows.map((a) => ({
    id:          a.id,
    client_name: extractAptName(a) || a.service || 'Agendamento',
    service:     a.service ?? '—',
    time:        a.scheduled_at ? new Date(a.scheduled_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '—',
    status:      (a.status === 'confirmado' ? 'confirmado' : 'aguardando') as 'confirmado' | 'aguardando',
  }))

  // Tasks
  const VALID_QUADRANTS = ['urgent_important', 'important_not_urgent', 'urgent_not_important'] as const
  type ValidQuadrant = typeof VALID_QUADRANTS[number]
  const taskRows = (tasks as TaskRow[] ?? [])
  const taskList = taskRows.map((t) => ({
    id:       t.id,
    title:    t.title ?? '—',
    quadrant: (VALID_QUADRANTS.includes(t.quadrant as ValidQuadrant) ? t.quadrant : 'important_not_urgent') as ValidQuadrant,
    done:     Boolean(t.completed_at),
  }))

  return {
    revenueMonth,
    expensesMonth,
    revenueYesterday,
    goalTarget,
    goalPercent,
    vsLastMonth,
    appointments,
    tasks: taskList,
    smartAlerts: [],
    insights: { totalVendas, ticketMedio, clientesUnicos, projecao },
  }
}

export default async function DashboardPage() {
  const d = await getDashboardData()

  return (
    <div className="px-4 py-5 md:px-8 md:py-8 max-w-2xl space-y-4">

      {/* 1. Hero — faturamento do mês */}
      <HeroCard
        revenue={d.revenueMonth}
        revenueYesterday={d.revenueYesterday}
        goalTarget={d.goalTarget}
        goalPercent={d.goalPercent}
        vsLastMonth={d.vsLastMonth}
      />

      {/* 2. Botão WhatsApp */}
      <a
        href={`https://wa.me/${process.env.NEXT_PUBLIC_BOT_PHONE ?? ''}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 w-full rounded-2xl px-5 py-4 text-white font-semibold text-sm shadow-sm transition-opacity hover:opacity-90"
        style={{ background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)' }}
      >
        <svg viewBox="0 0 32 32" className="w-7 h-7 flex-shrink-0" fill="currentColor" aria-hidden="true"><path d="M16 2C8.28 2 2 8.28 2 16c0 2.44.65 4.74 1.79 6.73L2 30l7.45-1.76A13.93 13.93 0 0 0 16 30c7.72 0 14-6.28 14-14S23.72 2 16 2zm0 25.5a11.44 11.44 0 0 1-5.82-1.59l-.42-.25-4.42 1.04 1.07-4.3-.28-.44A11.47 11.47 0 0 1 4.5 16C4.5 9.6 9.6 4.5 16 4.5S27.5 9.6 27.5 16 22.4 27.5 16 27.5zm6.29-8.57c-.34-.17-2.03-1-2.35-1.11-.32-.12-.55-.17-.78.17-.23.34-.9 1.11-1.1 1.34-.2.23-.4.26-.75.09-.34-.17-1.45-.54-2.76-1.71-1.02-.91-1.7-2.04-1.9-2.38-.2-.34-.02-.52.15-.69.15-.15.34-.4.51-.6.17-.2.23-.34.34-.57.12-.23.06-.43-.03-.6-.09-.17-.78-1.88-1.07-2.58-.28-.68-.57-.59-.78-.6H10.9c-.2 0-.52.08-.79.37-.28.3-1.05 1.02-1.05 2.5s1.07 2.9 1.22 3.1c.17.2 2.1 3.21 5.09 4.5.71.31 1.27.5 1.7.64.72.23 1.37.2 1.89.12.58-.09 1.78-.73 2.03-1.43.25-.7.25-1.3.17-1.43-.08-.12-.3-.2-.64-.37z"/></svg>
        <div className="text-left">
          <p className="font-bold text-base leading-none">Falar com o Sócio</p>
          <p className="text-white/80 text-xs mt-0.5">Registre vendas, despesas e agendamentos por WhatsApp</p>
        </div>
        <span className="ml-auto text-white/60 text-xs">→</span>
      </a>

      {/* 3. Acesso rápido */}
      <QuickAccess />

      {/* 4. Alertas */}
      {d.smartAlerts.length > 0 && <AlertsList alerts={d.smartAlerts} />}

      {/* 5. Saúde financeira */}
      <FinancialHealth revenue={d.revenueMonth} expenses={d.expensesMonth} />

      {/* 6. Indicadores do negócio */}
      <BusinessInsights
        totalVendas={d.insights.totalVendas}
        ticketMedio={d.insights.ticketMedio}
        clientesUnicos={d.insights.clientesUnicos}
        projecao={d.insights.projecao}
        goalTarget={d.goalTarget}
      />

      {/* 7. Agenda + Tarefas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <AppointmentsCard appointments={d.appointments} />
        <TasksCard tasks={d.tasks} />
      </div>

      {/* 8. Preview do Aprenda */}
      <LearnPreview />
    </div>
  )
}
