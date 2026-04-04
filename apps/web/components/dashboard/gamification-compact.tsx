import Link from 'next/link'
import { Zap, ChevronRight } from 'lucide-react'

interface Mission {
  id: string
  title: string
  completed: boolean
}

interface GamificationCompactProps {
  level: string
  xpCurrent: number
  xpNeeded: number
  streak: number
  missions: Mission[]
}

export function GamificationCompact({ level, xpCurrent, xpNeeded, streak, missions }: GamificationCompactProps) {
  const pct = Math.min(100, Math.round((xpCurrent / xpNeeded) * 100))

  return (
    <div
      className="rounded-2xl p-4"
      style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-[#0F40CB]/10 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-[#0F40CB]" />
          </div>
          <div>
            <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{level}</p>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>🔥 {streak} dias seguidos</p>
          </div>
        </div>
        <Link href="/gamificacao" className="flex items-center gap-0.5 text-[11px] font-medium text-[#0F40CB]">
          Ver tudo <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {/* XP bar */}
      <div className="mb-3">
        <div className="flex justify-between mb-1">
          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{xpCurrent} XP</span>
          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{xpNeeded} XP</span>
        </div>
        <div className="w-full h-2 rounded-full" style={{ backgroundColor: 'var(--border)' }}>
          <div className="h-2 rounded-full bg-[#0F40CB] transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Missões do dia */}
      {missions.length > 0 && (
        <div className="space-y-1.5">
          {missions.slice(0, 3).map((m) => (
            <div key={m.id} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                style={{ borderColor: m.completed ? '#B6F273' : 'var(--border)', backgroundColor: m.completed ? '#B6F273' : 'transparent' }}
              >
                {m.completed && <span className="text-white text-[8px]">✓</span>}
              </div>
              <p
                className="text-xs leading-tight"
                style={{ color: m.completed ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: m.completed ? 'line-through' : 'none' }}
              >
                {m.title}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
