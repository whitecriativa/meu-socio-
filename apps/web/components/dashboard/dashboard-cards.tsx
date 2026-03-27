'use client'

import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Users,
  Target,
  Ticket,
} from 'lucide-react'

interface Metrics {
  revenue: number
  expenses: number
  appointments_count: number
  new_clients: number
  avg_ticket: number
  active_clients: number
}

interface Goal {
  target_revenue: number
  achieved_revenue: number
  dream_note: string | null
}

interface Appointment {
  id: string
  service: string
  scheduled_at: string
  status: string
  clients: { name: string } | null
}

interface DashboardCardsProps {
  metrics: Metrics
  goal: Goal | null
  appointments: Appointment[]
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function DashboardCards({ metrics, goal, appointments }: DashboardCardsProps) {
  const balance = metrics.revenue - metrics.expenses
  const goalPercent = goal
    ? Math.min(100, Math.round((goal.achieved_revenue / goal.target_revenue) * 100))
    : null

  return (
    <div className="space-y-6">
      {/* Cards de métricas */}
      <section>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
          Visão geral de hoje
        </p>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MetricCard
            label="Faturamento hoje"
            value={formatCurrency(metrics.revenue)}
            icon={<TrendingUp className="w-4 h-4" />}
            accent="green"
            sub={`${metrics.appointments_count} atendimentos`}
          />
          <MetricCard
            label="Despesas"
            value={formatCurrency(metrics.expenses)}
            icon={<TrendingDown className="w-4 h-4" />}
            accent="orange"
            sub={`Saldo: ${formatCurrency(balance)}`}
          />
          <MetricCard
            label="Ticket médio"
            value={formatCurrency(metrics.avg_ticket)}
            icon={<Ticket className="w-4 h-4" />}
            accent="green"
            sub="por atendimento"
          />
          <MetricCard
            label="Clientes ativos"
            value={String(metrics.active_clients)}
            icon={<Users className="w-4 h-4" />}
            accent="orange"
            sub={`+${metrics.new_clients} novos hoje`}
          />
        </div>
      </section>

      {/* Meta do mês */}
      {goal && goalPercent !== null && (
        <section>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
            Meta do mês
          </p>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <Target className="w-3.5 h-3.5 text-[#2D6A4F]" />
                  <span className="text-xs font-medium text-gray-500">Progresso</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">{goalPercent}%</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {formatCurrency(goal.achieved_revenue)}{' '}
                  <span className="text-gray-400">de {formatCurrency(goal.target_revenue)}</span>
                </p>
              </div>
              {goal.dream_note && (
                <p className="text-xs text-gray-400 text-right max-w-[140px] leading-relaxed">
                  {goal.dream_note}
                </p>
              )}
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5">
              <div
                className="h-2.5 rounded-full transition-all duration-500"
                style={{
                  width: `${goalPercent}%`,
                  backgroundColor: goalPercent >= 100 ? '#2D6A4F' : '#F4845F',
                }}
              />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-xs text-gray-400">R$ 0</span>
              <span className="text-xs text-gray-400">{formatCurrency(goal.target_revenue)}</span>
            </div>
          </div>
        </section>
      )}

      {/* Agendamentos do dia */}
      <section>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
          Agenda de hoje
        </p>
        {appointments.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm text-center">
            <Calendar className="w-8 h-8 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Nenhum agendamento confirmado para hoje</p>
          </div>
        ) : (
          <div className="space-y-2">
            {appointments.map((apt, index) => (
              <div
                key={apt.id}
                className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-gray-100 shadow-sm"
              >
                <span className="text-sm font-bold text-[#2D6A4F] tabular-nums w-11 flex-shrink-0">
                  {formatTime(apt.scheduled_at)}
                </span>
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ backgroundColor: index % 2 === 0 ? '#2D6A4F' : '#F4845F' }}
                >
                  {apt.clients?.name?.charAt(0) ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {apt.clients?.name ?? 'Cliente'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{apt.service}</p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium flex-shrink-0">
                  Confirmado
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function MetricCard({
  label,
  value,
  icon,
  accent,
  sub,
}: {
  label: string
  value: string
  icon: React.ReactNode
  accent: 'green' | 'orange'
  sub?: string
}) {
  const color = accent === 'green' ? '#2D6A4F' : '#F4845F'

  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center mb-3 opacity-90"
        style={{ backgroundColor: `${color}18`, color }}
      >
        {icon}
      </div>
      <p className="text-xs text-gray-500 leading-none mb-1">{label}</p>
      <p className="text-lg font-bold text-gray-900 leading-tight">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}
