import { Star, Flame, Target, Trophy, Heart, Zap } from 'lucide-react'
import { EditarMetaModal } from '@/components/metas/editar-meta-modal'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { createClient } from '@supabase/supabase-js'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

export const dynamic = 'force-dynamic'

const LEVELS = [
  { id: 'semente',    label: 'Semente',    emoji: '🌱', min: 0,    max: 199  },
  { id: 'broto',      label: 'Broto',      emoji: '🌿', min: 200,  max: 599  },
  { id: 'arvore',     label: 'Árvore',     emoji: '🌳', min: 600,  max: 1499 },
  { id: 'estrela',    label: 'Estrela',    emoji: '⭐', min: 1500, max: 3499 },
  { id: 'cristal',    label: 'Cristal',    emoji: '💎', min: 3500, max: 7999 },
  { id: 'socio_ouro', label: 'Sócio Ouro', emoji: '🏆', min: 8000, max: 9999 },
]

const BADGES = [
  { id: 'primeira_venda', emoji: '🎯', label: 'Primeira Venda',  threshold: 1   },
  { id: 'em_chamas',      emoji: '🔥', label: 'Em Chamas',       threshold: 7   },
  { id: 'decolagem',      emoji: '🚀', label: 'Decolagem',       threshold: 30  },
  { id: 'meta_batida',    emoji: '🏆', label: 'Meta Batida',     threshold: 100 },
  { id: 'consistente',    emoji: '💪', label: 'Consistente',     threshold: 14  },
  { id: 'agenda_cheia',   emoji: '📅', label: 'Agenda Cheia',    threshold: 10  },
  { id: 'empresaria',     emoji: '📊', label: 'Empresária',      threshold: 50  },
  { id: 'tricampeao',     emoji: '🥇', label: 'Tricampeã',       threshold: 90  },
]

const POINTS_MAP: Record<string, number> = {
  urgent_important: 10,
  important_not_urgent: 5,
  urgent_not_important: 5,
  neither: 3,
}

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

async function getData() {
  const userId = process.env.NEXT_PUBLIC_DEMO_USER_ID!
  const supabase = adminClient()

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const monthStr = `${year}-${String(month).padStart(2, '0')}`
  const monthStart = `${monthStr}-01`
  const today = now.toISOString().substring(0, 10)
  const daysInMonth = new Date(year, month, 0).getDate()
  const daysPassed = now.getDate()
  const daysLeft = daysInMonth - daysPassed

  const [{ data: user }, { data: txs }, { data: completedTasks }] = await Promise.all([
    supabase.from('users').select('name, monthly_goal, dream').eq('id', userId).single(),
    supabase.from('transactions').select('type, amount').eq('user_id', userId)
      .gte('competence_date', monthStart).lte('competence_date', today),
    supabase.from('tasks').select('quadrant, completed_at').eq('user_id', userId)
      .not('completed_at', 'is', null),
  ])

  type TxRow = { type: string; amount: number | null }
  type TaskRow = { quadrant: string | null; completed_at: string | null }

  const achieved = (txs as TxRow[] ?? [])
    .filter((t) => t.type === 'receita')
    .reduce((s, t) => s + Number(t.amount), 0)
  const target = Number(user?.monthly_goal ?? 0)
  const dailyAvg = daysPassed > 0 ? achieved / daysPassed : 0
  const projection = Math.round(dailyAvg * daysInMonth)

  // Pontos acumulados de tarefas concluídas
  const totalPoints = (completedTasks as TaskRow[] ?? []).reduce(
    (s, t) => s + (POINTS_MAP[t.quadrant ?? 'neither'] ?? 3),
    0,
  )

  // Streak: dias consecutivos com tarefa concluída até hoje
  const completedDates = new Set(
    (completedTasks as TaskRow[] ?? []).map((t) => t.completed_at?.substring(0, 10)).filter(Boolean),
  )
  let streak = 0
  const d = new Date(today)
  while (completedDates.has(d.toISOString().substring(0, 10))) {
    streak++
    d.setDate(d.getDate() - 1)
  }

  // Total de transações receita (para badge "primeira venda")
  const totalReceitas = (txs as TxRow[] ?? []).filter((t) => t.type === 'receita').length

  const monthName = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  const monthLabel = monthName.charAt(0).toUpperCase() + monthName.slice(1)

  return {
    dream: (user?.dream as string) ?? '',
    target,
    achieved,
    daysLeft,
    projection,
    monthLabel,
    totalPoints,
    streak,
    totalReceitas,
  }
}

export default async function MetasPage() {
  const { dream, target, achieved, daysLeft, projection, monthLabel, totalPoints, streak, totalReceitas } =
    await getData()

  const goalPercent   = target > 0 ? Math.min(100, Math.round((achieved / target) * 100)) : 0
  const projectionGap = projection - target

  const currentLevel   = ([...LEVELS].reverse().find((l) => totalPoints >= l.min) ?? LEVELS[0])!
  const nextLevel      = LEVELS[LEVELS.indexOf(currentLevel) + 1] as typeof LEVELS[0] | undefined
  const levelProgress  = Math.round(
    ((totalPoints - currentLevel.min) / ((currentLevel.max - currentLevel.min) + 1)) * 100,
  )

  const badges = BADGES.map((b) => {
    let earned = false
    if (b.id === 'primeira_venda') earned = totalReceitas >= b.threshold
    else if (b.id === 'em_chamas') earned = streak >= b.threshold
    else if (b.id === 'decolagem') earned = totalPoints >= b.threshold
    else if (b.id === 'meta_batida') earned = goalPercent >= 100
    else if (b.id === 'consistente') earned = streak >= b.threshold
    return { ...b, earned }
  })

  return (
    <div className="px-4 py-5 md:px-8 md:py-8 max-w-3xl space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Metas</h1>
          <p className="text-sm text-gray-500 mt-0.5">Seu progresso e conquistas</p>
        </div>
        <EditarMetaModal currentGoal={target} currentDream={dream} />
      </div>

      {/* Card do sonho */}
      <Card className="bg-[#5B3FD4] border-0 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/5 -translate-y-8 translate-x-8" />
        <div className="absolute bottom-0 left-10 w-20 h-20 rounded-full bg-[#52D68A]/20 translate-y-6" />
        <CardContent className="p-5 relative">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-white/60 text-xs mb-1 flex items-center gap-1">
                <Heart className="w-3 h-3" /> Seu sonho
              </p>
              <h2 className="text-lg font-bold text-white">
                {dream || 'Clique em "Editar meta" para definir seu sonho'}
              </h2>
              {!dream && (
                <p className="text-white/60 text-xs mt-1">
                  Mande: &quot;Meu sonho é [descreva aqui]&quot;
                </p>
              )}
            </div>
            <span className="text-3xl">✨</span>
          </div>
          {target > 0 && (
            <div className="mt-3">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-white/70">Conquistado este mês</span>
                <span className="text-white font-semibold">{fmt(achieved)}</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-500"
                  style={{ width: `${goalPercent}%`, backgroundColor: '#52D68A' }}
                />
              </div>
              <p className="text-white/50 text-xs mt-1.5">Meta mensal: {fmt(target)}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Termômetro da meta mensal */}
      {target > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-sm font-semibold text-gray-700">
              <span className="flex items-center gap-1.5">
                <Target className="w-4 h-4 text-[#5B3FD4]" />
                Meta de {monthLabel}
              </span>
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  goalPercent >= 100 ? 'bg-[#52D68A]/15 text-[#1a9e5c]' : 'bg-[#5B3FD4]/10 text-[#5B3FD4]'
                }`}
              >
                {goalPercent}%
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Progress
                value={goalPercent}
                indicatorColor={goalPercent >= 100 ? '#52D68A' : '#5B3FD4'}
                className="h-4 rounded-full"
              />
              <div className="flex justify-between mt-1.5 text-xs text-gray-400">
                <span>{fmt(achieved)} conquistados</span>
                <span>Meta: {fmt(target)}</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-gray-900">{daysLeft}</p>
                <p className="text-xs text-gray-400">dias restantes</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-gray-900">{fmt(Math.max(0, target - achieved))}</p>
                <p className="text-xs text-gray-400">faltam</p>
              </div>
              <div className={`rounded-xl p-3 text-center ${projectionGap >= 0 ? 'bg-[#52D68A]/10' : 'bg-amber-50'}`}>
                <p className={`text-lg font-bold ${projectionGap >= 0 ? 'text-[#1a9e5c]' : 'text-amber-600'}`}>
                  {fmt(projection)}
                </p>
                <p className="text-xs text-gray-400">projeção</p>
              </div>
            </div>
            {projectionGap < 0 && (
              <p className="mt-3 text-xs text-amber-600 bg-amber-50 rounded-xl px-3 py-2">
                ⚠️ No ritmo atual você ficará {fmt(Math.abs(projectionGap))} abaixo da meta. Que tal um empurrãozinho?
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <Target className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-600">Meta mensal não definida</p>
            <p className="text-xs text-gray-400 mt-1">Use o botão &quot;Editar meta&quot; acima ou mande no WhatsApp</p>
          </CardContent>
        </Card>
      )}

      {/* Nível de gamificação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
            <Zap className="w-4 h-4 text-[#5B3FD4]" />
            Seu nível
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">{currentLevel.emoji}</span>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <p className="text-base font-bold text-gray-900">{currentLevel.label}</p>
                <span className="text-xs text-[#5B3FD4] font-semibold">{totalPoints} pts</span>
              </div>
              <Progress value={levelProgress} indicatorColor="#5B3FD4" className="h-2" />
              {nextLevel && (
                <p className="text-xs text-gray-400 mt-1">
                  Faltam{' '}
                  <span className="font-semibold text-gray-600">
                    {nextLevel.min - totalPoints} pts
                  </span>{' '}
                  para {nextLevel.emoji} {nextLevel.label}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-3 mb-4">
            <div className="flex-1 bg-orange-50 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <Flame className="w-4 h-4 text-orange-400" />
                <p className="text-lg font-bold text-gray-900">{streak}</p>
              </div>
              <p className="text-xs text-gray-400">dias seguidos</p>
            </div>
            <div className="flex-1 bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-gray-900">{totalPoints}</p>
              <p className="text-xs text-gray-400">pontos totais</p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            {LEVELS.map((level) => {
              const isPast    = LEVELS.indexOf(currentLevel) > LEVELS.indexOf(level)
              const isCurrent = level.id === currentLevel.id
              return (
                <div key={level.id} className="flex flex-col items-center gap-1">
                  <span
                    className={`text-lg transition-all ${
                      isCurrent ? 'scale-125' : isPast ? 'opacity-100' : 'opacity-30 grayscale'
                    }`}
                  >
                    {level.emoji}
                  </span>
                  {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-[#5B3FD4]" />}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Badges */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
            <Trophy className="w-4 h-4 text-[#5B3FD4]" />
            Conquistas
            <span className="ml-auto text-xs font-normal text-gray-400">
              {badges.filter((b) => b.earned).length}/{badges.length}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
            {badges.map((badge) => (
              <div key={badge.id} className="flex flex-col items-center gap-1">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl transition-all ${
                    badge.earned ? 'bg-[#5B3FD4]/10 shadow-sm' : 'bg-gray-100 grayscale opacity-40'
                  }`}
                >
                  {badge.emoji}
                </div>
                <p className="text-[10px] text-center text-gray-500 leading-tight">{badge.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
