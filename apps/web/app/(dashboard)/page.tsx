import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { Bell, Zap, Flame } from 'lucide-react'
import { BomDiaCard } from '@/components/dashboard/bom-dia-card'
import { MetricCards } from '@/components/dashboard/metric-cards'
import { AppointmentsCard } from '@/components/dashboard/appointments-card'
import { TasksCard } from '@/components/dashboard/tasks-card'

export const dynamic = 'force-dynamic'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

type TxRow     = { type: string | null; amount: number | null; competence_date: string | null }
type AptRow    = { id: string; service: string | null; datetime: string | null; status: string | null; clients: { name: string | null }[] | null }
type TaskRow   = { id: string; title: string | null; quadrant: string | null; completed_at: string | null }
type AlertRow  = { id: string; type: string; title: string; message: string; action_url: string | null; action_label: string | null }
type GamifRow  = { total_points: number | null; current_level: string | null; current_streak: number | null }

async function getDashboardData() {
  const userId  = process.env.NEXT_PUBLIC_DEMO_USER_ID!
  const supabase = adminClient()

  const now       = new Date()
  const today     = now.toISOString().substring(0, 10)
  const yesterday = new Date(now.getTime() - 86400000).toISOString().substring(0, 10)
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

  const [
    { data: user },
    { data: txToday },
    { data: txYesterday },
    { data: txMonth },
    { count: activeClients },
    { data: apts },
    { data: tasks },
    { data: alerts },
    { data: gamif },
  ] = await Promise.all([
    supabase.from('users').select('name, monthly_goal, dream').eq('id', userId).single(),
    supabase.from('transactions').select('type, amount').eq('user_id', userId).eq('competence_date', today),
    supabase.from('transactions').select('amount').eq('user_id', userId).eq('type', 'receita').eq('competence_date', yesterday),
    supabase.from('transactions').select('type, amount').eq('user_id', userId).gte('competence_date', monthStart).lte('competence_date', today),
    supabase.from('clients').select('id', { count: 'exact', head: true }).eq('user_id', userId).in('status', ['ativo', 'vip']),
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
      .select('id, type, title, message, action_url, action_label')
      .eq('user_id', userId)
      .is('read_at', null)
      .order('triggered_at', { ascending: false })
      .limit(3),
    supabase.from('user_gamification')
      .select('total_points, current_level, current_streak')
      .eq('user_id', userId)
      .single(),
  ])

  const todayTxs    = (txToday    as TxRow[] ?? [])
  const yesterdayTx = (txYesterday as { amount: number | null }[] ?? [])
  const monthTxs    = (txMonth    as TxRow[] ?? [])

  const revenueToday    = todayTxs.filter((t) => t.type === 'receita').reduce((s, t) => s + Number(t.amount ?? 0), 0)
  const expensesToday   = todayTxs.filter((t) => t.type === 'despesa').reduce((s, t) => s + Number(t.amount ?? 0), 0)
  const revenueYesterday = yesterdayTx.reduce((s, t) => s + Number(t.amount ?? 0), 0)
  const revenueMonth    = monthTxs.filter((t) => t.type === 'receita').reduce((s, t) => s + Number(t.amount ?? 0), 0)

  const goalTarget   = Number(user?.monthly_goal ?? 0)
  const goalPercent  = goalTarget > 0 ? Math.min(100, Math.round((revenueMonth / goalTarget) * 100)) : 0
  const dreamNote    = (user?.dream as string) || 'Defina seu sonho em Metas'

  const aptRows = (apts as AptRow[] ?? [])
  const appointments = aptRows.map((a) => ({
    id:          a.id,
    client_name: a.clients?.[0]?.name ?? 'Cliente',
    service:     a.service ?? '—',
    time:        a.datetime ? new Date(a.datetime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '—',
    status:      (a.status === 'confirmado' ? 'confirmado' : 'aguardando') as 'confirmado' | 'aguardando',
  }))

  const VALID_QUADRANTS = ['urgent_important', 'important_not_urgent', 'urgent_not_important'] as const
  type ValidQuadrant = typeof VALID_QUADRANTS[number]
  const taskRows = (tasks as TaskRow[] ?? [])
  const taskList = taskRows.map((t) => ({
    id:       t.id,
    title:    t.title ?? '—',
    quadrant: (VALID_QUADRANTS.includes(t.quadrant as ValidQuadrant) ? t.quadrant : 'important_not_urgent') as ValidQuadrant,
    done:     Boolean(t.completed_at),
  }))

  const avgTicket = appointments.length > 0 ? revenueToday / appointments.length : 0

  const bomDiaMessage = goalTarget > 0
    ? `Ontem você faturou ${fmt(revenueYesterday)}. Este mês já estás em ${goalPercent}% da meta. ${goalPercent >= 100 ? 'Meta batida! 🎉' : 'Bora continuar! 💪'}`
    : `Ontem você faturou ${fmt(revenueYesterday)}. Defina uma meta mensal em Metas para acompanhar seu progresso.`

  const smartAlerts = (alerts as AlertRow[] ?? [])
  const gamification = gamif as GamifRow | null

  const LEVEL_EMOJIS: Record<string, string> = {
    semente: '🌱', broto: '🌿', arvore: '🌳',
    estrela: '⭐', cristal: '💎', socio_ouro: '🏆',
  }

  return {
    userName:        (user?.name as string) ?? 'Usuário',
    bomDiaMessage,
    revenueYesterday,
    goalPercent,
    revenueToday,
    expensesToday,
    avgTicket,
    activeClients:   activeClients ?? 0,
    revenueMonth,
    goalTarget:      goalTarget || 1,
    dreamNote,
    appointments,
    tasks: taskList,
    smartAlerts,
    gamification: gamification ? {
      points:  Number(gamification.total_points ?? 0),
      level:   String(gamification.current_level ?? 'semente'),
      streak:  Number(gamification.current_streak ?? 0),
      emoji:   LEVEL_EMOJIS[String(gamification.current_level ?? 'semente')] ?? '🌱',
    } : null,
  }
}

export default async function DashboardPage() {
  const d = await getDashboardData()

  return (
    <div className="px-4 py-5 md:px-8 md:py-8 max-w-5xl space-y-5">
      <BomDiaCard
        name={d.userName}
        message={d.bomDiaMessage}
        revenue_yesterday={d.revenueYesterday}
        goal_percent={d.goalPercent}
      />

      {/* Alertas inteligentes */}
      {d.smartAlerts.length > 0 && (
        <div className="space-y-2">
          {d.smartAlerts.map((alert) => (
            <div key={alert.id} className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
              <Bell className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-amber-800">{alert.title}</p>
                <p className="text-xs text-amber-600 mt-0.5">{alert.message}</p>
              </div>
              {alert.action_url && (
                <Link href={alert.action_url} className="text-xs font-semibold text-amber-700 whitespace-nowrap underline">
                  {alert.action_label ?? 'Ver'}
                </Link>
              )}
            </div>
          ))}
        </div>
      )}

      <MetricCards
        revenue={d.revenueToday}
        expenses={d.expensesToday}
        avg_ticket={d.avgTicket}
        active_clients={d.activeClients}
        new_clients={0}
        goal_achieved={d.revenueMonth}
        goal_target={d.goalTarget}
        dream_note={d.dreamNote}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AppointmentsCard appointments={d.appointments} />
        <TasksCard tasks={d.tasks} />
      </div>

      {/* Card gamificação */}
      {d.gamification && (
        <Link href="/gamificacao" className="block">
          <div className="flex items-center gap-4 bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 hover:shadow-md transition-shadow">
            <span className="text-3xl">{d.gamification.emoji}</span>
            <div className="flex-1">
              <p className="text-xs text-gray-400 mb-0.5">Seu nível atual</p>
              <p className="text-sm font-bold text-gray-900 capitalize">{d.gamification.level.replace('_', ' ')}</p>
              <p className="text-xs text-gray-500">{d.gamification.points} XP acumulados</p>
            </div>
            {d.gamification.streak > 0 && (
              <div className="flex items-center gap-1 bg-orange-50 rounded-xl px-3 py-2">
                <Flame className="w-4 h-4 text-orange-400" />
                <span className="text-sm font-bold text-orange-600">{d.gamification.streak}</span>
              </div>
            )}
            <Zap className="w-4 h-4 text-gray-300" />
          </div>
        </Link>
      )}
    </div>
  )
}
