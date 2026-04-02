import { createClient } from '@supabase/supabase-js'
import { HeroCard }            from '@/components/dashboard/hero-card'
import { QuickAccess }         from '@/components/dashboard/quick-access'
import { AlertsList }          from '@/components/dashboard/alerts-list'
import { FinancialHealth }     from '@/components/dashboard/financial-health'
import { AppointmentsCard }    from '@/components/dashboard/appointments-card'
import { TasksCard }           from '@/components/dashboard/tasks-card'
import { GamificationCompact } from '@/components/dashboard/gamification-compact'
import { LearnPreview }        from '@/components/dashboard/learn-preview'

export const dynamic = 'force-dynamic'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

type TxRow    = { type: string | null; amount: number | null; competence_date: string | null }
type AptRow   = { id: string; service: string | null; datetime: string | null; status: string | null; clients: { name: string | null }[] | null }
type TaskRow  = { id: string; title: string | null; quadrant: string | null; completed_at: string | null }
type AlertRow = { id: string; type: string; title: string; message: string; created_at: string }
type GamifRow = { total_points: number | null; current_level: string | null; current_streak: number | null }

async function getDashboardData() {
  const userId  = process.env.NEXT_PUBLIC_DEMO_USER_ID!
  const supabase = adminClient()

  const now        = new Date()
  const today      = now.toISOString().substring(0, 10)
  const yesterday  = new Date(now.getTime() - 86400000).toISOString().substring(0, 10)
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

  // Mês passado
  const prevMonth     = now.getMonth() === 0 ? 11 : now.getMonth() - 1
  const prevYear      = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
  const prevMonthStart = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-01`
  const prevMonthEnd   = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

  const [
    { data: user },
    { data: txYesterday },
    { data: txMonth },
    { data: txPrevMonth },
    { data: apts },
    { data: tasks },
    { data: alerts },
    { data: gamif },
  ] = await Promise.all([
    supabase.from('users').select('name, monthly_goal').eq('id', userId).single(),
    supabase.from('transactions').select('amount').eq('user_id', userId).eq('type', 'receita').eq('competence_date', yesterday),
    supabase.from('transactions').select('type, amount').eq('user_id', userId).gte('competence_date', monthStart).lte('competence_date', today),
    supabase.from('transactions').select('amount').eq('user_id', userId).eq('type', 'receita').gte('competence_date', prevMonthStart).lt('competence_date', prevMonthEnd),
    supabase.from('appointments').select('id, service, datetime, status, clients(name)')
      .eq('user_id', userId)
      .gte('datetime', `${today}T00:00:00`)
      .lte('datetime', `${today}T23:59:59`)
      .in('status', ['confirmado', 'pendente'])
      .order('datetime', { ascending: true })
      .limit(6),
    supabase.from('tasks').select('id, title, quadrant, completed_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase.from('smart_alerts')
      .select('id, type, title, message, created_at')
      .eq('user_id', userId)
      .is('read_at', null)
      .order('triggered_at', { ascending: false })
      .limit(3),
    supabase.from('user_gamification')
      .select('total_points, current_level, current_streak')
      .eq('user_id', userId)
      .single(),
  ])

  const monthTxs = (txMonth as TxRow[] ?? [])
  const revenueMonth  = monthTxs.filter((t) => t.type === 'receita').reduce((s, t) => s + Number(t.amount ?? 0), 0)
  const expensesMonth = monthTxs.filter((t) => t.type === 'despesa').reduce((s, t) => s + Number(t.amount ?? 0), 0)

  const revenueYesterday = (txYesterday as { amount: number | null }[] ?? []).reduce((s, t) => s + Number(t.amount ?? 0), 0)
  const revenuePrevMonth = (txPrevMonth as { amount: number | null }[] ?? []).reduce((s, t) => s + Number(t.amount ?? 0), 0)

  const goalTarget  = Number(user?.monthly_goal ?? 0)
  const goalPercent = goalTarget > 0 ? Math.min(100, Math.round((revenueMonth / goalTarget) * 100)) : 0
  const vsLastMonth = revenuePrevMonth > 0
    ? Math.round(((revenueMonth - revenuePrevMonth) / revenuePrevMonth) * 100)
    : 0

  // Appointments
  const aptRows = (apts as AptRow[] ?? [])
  const appointments = aptRows.map((a) => ({
    id:          a.id,
    client_name: a.clients?.[0]?.name ?? 'Cliente',
    service:     a.service ?? '—',
    time:        a.datetime ? new Date(a.datetime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '—',
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

  // Gamification
  const gRow = gamif as GamifRow | null
  const LEVEL_LABELS: Record<string, string> = {
    semente: 'Nível Semente 🌱', broto: 'Nível Broto 🌿', arvore: 'Nível Árvore 🌳',
    estrela: 'Nível Estrela ⭐', cristal: 'Nível Cristal 💎', socio_ouro: 'Sócio Ouro 🏆',
  }
  const XP_NEEDED: Record<string, number> = {
    semente: 500, broto: 1500, arvore: 4000, estrela: 10000, cristal: 25000, socio_ouro: 50000,
  }
  const currentLevel = String(gRow?.current_level ?? 'semente')

  return {
    revenueMonth,
    expensesMonth,
    revenueYesterday,
    goalTarget,
    goalPercent,
    vsLastMonth,
    appointments,
    tasks:      taskList,
    smartAlerts: (alerts as AlertRow[] ?? []),
    gamification: gRow ? {
      levelKey:   currentLevel,
      levelLabel: LEVEL_LABELS[currentLevel] ?? 'Nível Semente 🌱',
      xpCurrent:  Number(gRow.total_points ?? 0),
      xpNeeded:   XP_NEEDED[currentLevel] ?? 500,
      streak:     Number(gRow.current_streak ?? 0),
    } : null,
  }
}

export default async function DashboardPage() {
  const d = await getDashboardData()

  const MOCK_MISSIONS = [
    { id: 'm1', title: 'Registrar 1 venda hoje',   completed: d.revenueMonth > 0 },
    { id: 'm2', title: 'Verificar agenda do dia',   completed: d.appointments.length > 0 },
    { id: 'm3', title: 'Concluir 1 tarefa da lista', completed: d.tasks.some((t) => t.done) },
  ]

  return (
    <div className="px-4 py-5 md:px-8 md:py-8 max-w-2xl mx-auto space-y-4">

      {/* 1. Hero — faturamento do mês */}
      <HeroCard
        revenue={d.revenueMonth}
        revenueYesterday={d.revenueYesterday}
        goalTarget={d.goalTarget}
        goalPercent={d.goalPercent}
        vsLastMonth={d.vsLastMonth}
      />

      {/* 2. Acesso rápido */}
      <QuickAccess />

      {/* 3. Alertas */}
      {d.smartAlerts.length > 0 && <AlertsList alerts={d.smartAlerts} />}

      {/* 4. Saúde financeira */}
      <FinancialHealth revenue={d.revenueMonth} expenses={d.expensesMonth} />

      {/* 5. Agenda + Tarefas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <AppointmentsCard appointments={d.appointments} />
        <TasksCard tasks={d.tasks} />
      </div>

      {/* 6. Gamificação compacta */}
      {d.gamification && (
        <GamificationCompact
          level={d.gamification.levelLabel}
          xpCurrent={d.gamification.xpCurrent}
          xpNeeded={d.gamification.xpNeeded}
          streak={d.gamification.streak}
          missions={MOCK_MISSIONS}
        />
      )}

      {/* 7. Preview do Aprenda */}
      <LearnPreview />
    </div>
  )
}
