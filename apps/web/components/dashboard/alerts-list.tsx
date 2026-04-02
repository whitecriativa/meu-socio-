import { AlertTriangle, TrendingDown, Clock, Target, Zap, Star } from 'lucide-react'

interface Alert {
  id: string
  type: string
  title: string
  message: string
  created_at: string
}

interface AlertsListProps {
  alerts: Alert[]
}

const ALERT_CONFIG: Record<string, { color: string; bg: string; icon: React.ElementType }> = {
  bills_due:       { color: '#F87171', bg: '#FEF2F2', icon: AlertTriangle },
  budget_exceeded: { color: '#F87171', bg: '#FEF2F2', icon: TrendingDown },
  revenue_drop:    { color: '#F59E0B', bg: '#FFFBEB', icon: TrendingDown },
  inactivity:      { color: '#6B7280', bg: '#F9FAFB', icon: Clock },
  goal_risk:       { color: '#F59E0B', bg: '#FFFBEB', icon: Target },
  streak_risk:     { color: '#8B5CF6', bg: '#F5F3FF', icon: Zap },
  goal_achieved:   { color: '#52D68A', bg: '#F0FDF4', icon: Star },
}

const DEFAULT_CONFIG = { color: '#6B7280', bg: '#F9FAFB', icon: AlertTriangle }

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const h = Math.floor(diff / 3600000)
  if (h < 1) return 'agora'
  if (h < 24) return `${h}h atrás`
  return `${Math.floor(h / 24)}d atrás`
}

export function AlertsList({ alerts }: AlertsListProps) {
  if (alerts.length === 0) return null

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
        Alertas
      </p>
      <div className="space-y-2">
        {alerts.slice(0, 3).map((alert) => {
          const cfg = ALERT_CONFIG[alert.type] ?? DEFAULT_CONFIG
          const Icon = cfg.icon
          return (
            <div
              key={alert.id}
              className="flex items-start gap-3 p-3 rounded-xl border-l-4"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderLeftColor: cfg.color,
                border: `1px solid var(--border)`,
                borderLeft: `4px solid ${cfg.color}`,
              }}
            >
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: cfg.bg }}>
                <Icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>
                  {alert.title}
                </p>
                <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  {alert.message}
                </p>
              </div>
              <span className="text-[10px] flex-shrink-0 mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {timeAgo(alert.created_at)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
