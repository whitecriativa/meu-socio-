import { createClient } from '@supabase/supabase-js'
import { Flame, Zap, Trophy, Star, Lock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

export const dynamic = 'force-dynamic'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

const LEVELS = [
  { id: 'semente',    label: 'Semente',    emoji: '🌱', min: 0,    max: 199,  xpToNext: 200  },
  { id: 'broto',      label: 'Broto',      emoji: '🌿', min: 200,  max: 599,  xpToNext: 400  },
  { id: 'arvore',     label: 'Árvore',     emoji: '🌳', min: 600,  max: 1499, xpToNext: 900  },
  { id: 'estrela',    label: 'Estrela',    emoji: '⭐', min: 1500, max: 3499, xpToNext: 2000 },
  { id: 'cristal',    label: 'Cristal',    emoji: '💎', min: 3500, max: 7999, xpToNext: 4500 },
  { id: 'socio_ouro', label: 'Sócio Ouro', emoji: '🏆', min: 8000, max: 9999, xpToNext: 0   },
]

const ALL_BADGES = [
  { id: 'primeira_venda', emoji: '🎯', label: 'Primeira Venda',  desc: 'Registrou a primeira receita' },
  { id: 'em_chamas',      emoji: '🔥', label: 'Em Chamas',       desc: '7 dias seguidos de registro' },
  { id: 'consistente',    emoji: '💪', label: 'Consistente',     desc: '30 dias seguidos' },
  { id: 'meta_batida',    emoji: '🏆', label: 'Meta Batida',     desc: 'Bateu a meta mensal' },
  { id: 'tricampeao',     emoji: '🥇', label: 'Tricampeã',       desc: 'Meta 3 meses seguidos' },
  { id: 'agenda_cheia',   emoji: '📅', label: 'Agenda Cheia',    desc: '10 agendamentos na semana' },
  { id: 'reconquista',    emoji: '🤝', label: 'Reconquista',     desc: 'Reativou 10 clientes' },
  { id: 'empresaria',     emoji: '📊', label: 'Empresária',      desc: 'Enviou DRE ao contador 3x' },
  { id: 'sonhadora',      emoji: '✨', label: 'Sonhadora',       desc: 'Definiu e atualizou o sonho' },
  { id: 'decolagem',      emoji: '🚀', label: 'Decolagem',       desc: 'Completou onboarding + 1ª semana' },
]

const MISSIONS = [
  { id: 'registrar_venda',   emoji: '💰', label: 'Registrar uma receita',     xp: 10, type: 'daily'   },
  { id: 'registrar_despesa', emoji: '📝', label: 'Registrar uma despesa',     xp: 5,  type: 'daily'   },
  { id: 'criar_tarefa',      emoji: '✅', label: 'Criar uma tarefa do dia',   xp: 5,  type: 'daily'   },
  { id: 'verificar_agenda',  emoji: '📅', label: 'Verificar agenda do dia',   xp: 3,  type: 'daily'   },
  { id: 'meta_80pct',        emoji: '🎯', label: 'Atingir 80% da meta',       xp: 30, type: 'weekly'  },
  { id: 'streak_5dias',      emoji: '🔥', label: 'Manter streak 5 dias',      xp: 25, type: 'weekly'  },
  { id: 'novo_cliente',      emoji: '🤝', label: 'Cadastrar um novo cliente', xp: 15, type: 'weekly'  },
  { id: 'meta_mensal',       emoji: '🏆', label: 'Bater a meta do mês',       xp: 50, type: 'monthly' },
]

async function getData() {
  const userId  = process.env.NEXT_PUBLIC_DEMO_USER_ID!
  const supabase = adminClient()

  const now      = new Date()
  const today    = now.toISOString().substring(0, 10)
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const weekAgo  = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10)

  const [
    { data: userBadges },
    { data: txs },
    { data: tasks },
    { data: user },
    { data: pointsHistory },
  ] = await Promise.all([
    supabase.from('user_badges').select('badge_id, earned_at').eq('user_id', userId),
    supabase.from('transactions').select('type, competence_date').eq('user_id', userId).gte('competence_date', weekAgo),
    supabase.from('tasks').select('completed_at').eq('user_id', userId).not('completed_at', 'is', null),
    supabase.from('users').select('name, monthly_goal').eq('id', userId).single(),
    supabase.from('points_history').select('action_type, points, description, created_at').eq('user_id', userId)
      .order('created_at', { ascending: false }).limit(10),
  ])

  type TxRow = { type: string; competence_date: string | null }
  type TaskRow = { completed_at: string | null }
  type BadgeRow = { badge_id: string; earned_at: string }
  type PointRow = { action_type: string; points: number; description: string | null; created_at: string }

  // Calcular pontos de transações (substitui pontos_history se tabela vazia)
  const allTxs = await supabase.from('transactions').select('type, amount').eq('user_id', userId)
  type TxAmtRow = { type: string; amount: number | null }
  const totalFromTx = ((allTxs.data ?? []) as TxAmtRow[]).reduce(
    (s, t) => s + (t.type === 'receita' ? 10 : 5), 0,
  )
  const completedTasks2 = (tasks as TaskRow[] ?? [])
  const pointsFromTasks = completedTasks2.length * 5
  const totalPoints = ((pointsHistory as PointRow[] ?? []).length > 0
    ? (pointsHistory as PointRow[]).reduce((s, p) => s + p.points, 0)
    : totalFromTx + pointsFromTasks)

  // Streak
  const completedDates = new Set(
    completedTasks2.map((t) => t.completed_at?.substring(0, 10)).filter(Boolean),
  )
  let streak = 0
  const d = new Date(today)
  while (completedDates.has(d.toISOString().substring(0, 10))) {
    streak++
    d.setDate(d.getDate() - 1)
  }

  // Badges earned
  const earnedBadgeIds = new Set((userBadges as BadgeRow[] ?? []).map((b) => b.badge_id))
  const txToday = (txs as TxRow[] ?? []).filter((t) => t.competence_date === today)
  const hasReceitaToday = txToday.some((t) => t.type === 'receita')
  const hasDespesaToday = txToday.some((t) => t.type === 'despesa')

  // Missões de hoje (simplificado — baseado em dados reais do dia)
  const missionsStatus = MISSIONS.map((m) => {
    let completed = false
    if (m.id === 'registrar_venda')   completed = hasReceitaToday
    if (m.id === 'registrar_despesa') completed = hasDespesaToday
    if (m.id === 'criar_tarefa')      completed = completedDates.has(today)
    if (m.id === 'verificar_agenda')  completed = false // sem dados de visualização
    if (m.id === 'streak_5dias')      completed = streak >= 5
    if (m.id === 'meta_80pct') {
      const txMonth = (txs as TxRow[] ?? []).filter((t) => (t.competence_date ?? '') >= monthStart)
      const revenue = txMonth.filter((t) => t.type === 'receita').length * 100 // approx
      const goal = Number(user?.monthly_goal ?? 0)
      completed = goal > 0 && revenue >= goal * 0.8
    }
    return { ...m, completed }
  })

  const xpToday = missionsStatus.filter((m) => m.completed && m.type === 'daily').reduce((s, m) => s + m.xp, 0)

  return {
    totalPoints,
    streak,
    earnedBadgeIds,
    missionsStatus,
    xpToday,
    pointsHistory: (pointsHistory as PointRow[] ?? []),
    userName: (user?.name as string) ?? '',
  }
}

export default async function GamificacaoPage() {
  const { totalPoints, streak, earnedBadgeIds, missionsStatus, xpToday, pointsHistory, userName } =
    await getData()

  const currentLevel = ([...LEVELS].reverse().find((l) => totalPoints >= l.min) ?? LEVELS[0])!
  const nextLevel    = LEVELS[LEVELS.indexOf(currentLevel) + 1] as (typeof LEVELS[0]) | undefined
  const levelProgress = nextLevel
    ? Math.round(((totalPoints - currentLevel.min) / (nextLevel.min - currentLevel.min)) * 100)
    : 100

  const dailyMissions   = missionsStatus.filter((m) => m.type === 'daily')
  const weeklyMissions  = missionsStatus.filter((m) => m.type === 'weekly')
  const monthlyMissions = missionsStatus.filter((m) => m.type === 'monthly')

  const ACTION_LABELS: Record<string, string> = {
    atendimento_registrado: 'Receita registrada',
    despesa_registrada:     'Despesa registrada',
    agendamento_criado:     'Agendamento criado',
    checkin_diario:         'Check-in diário',
    meta_semanal:           'Meta semanal',
    meta_mensal:            'Meta mensal',
    streak_7dias:           'Streak 7 dias 🔥',
    streak_30dias:          'Streak 30 dias 💪',
  }

  return (
    <div className="px-4 py-5 md:px-8 md:py-8 max-w-2xl space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Gamificação</h1>
        <p className="text-sm text-gray-500 mt-0.5">Suas conquistas, missões e evolução</p>
      </div>

      {/* Card de nível — destaque */}
      <div
        className="rounded-2xl p-5 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #5B3FD4 0%, #7C5CE0 100%)' }}
      >
        <div className="absolute top-0 right-0 w-36 h-36 rounded-full bg-white/5 -translate-y-10 translate-x-10" />
        <div className="absolute bottom-0 left-10 w-24 h-24 rounded-full bg-[#52D68A]/15 translate-y-8" />
        <div className="relative">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-5xl">{currentLevel.emoji}</span>
            <div className="flex-1">
              <p className="text-white/60 text-xs mb-0.5">Nível atual</p>
              <h2 className="text-2xl font-bold">{currentLevel.label}</h2>
              <p className="text-white/70 text-sm">{userName || 'Empreendedor'}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{totalPoints}</p>
              <p className="text-white/60 text-xs">pontos XP</p>
            </div>
          </div>

          <div className="mb-1.5">
            <div className="flex justify-between text-xs text-white/60 mb-1">
              <span>{currentLevel.label}</span>
              <span>{nextLevel ? nextLevel.label : '✨ Nível máximo'}</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-3">
              <div
                className="h-3 rounded-full transition-all duration-700"
                style={{ width: `${levelProgress}%`, backgroundColor: '#52D68A' }}
              />
            </div>
          </div>
          {nextLevel && (
            <p className="text-white/60 text-xs">
              Faltam <strong className="text-white">{nextLevel.min - totalPoints} XP</strong> para {nextLevel.emoji} {nextLevel.label}
            </p>
          )}

          {/* Streak */}
          <div className="mt-4 flex items-center gap-2 bg-white/10 rounded-xl px-4 py-2.5 w-fit">
            <Flame className="w-5 h-5 text-orange-300" />
            <div>
              <p className="text-lg font-bold leading-none">{streak} dias</p>
              <p className="text-white/60 text-xs">streak atual</p>
            </div>
            {streak >= 7 && <span className="ml-2 text-lg">🔥</span>}
          </div>
        </div>
      </div>

      {/* Jornada de níveis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
            <Zap className="w-4 h-4 text-[#5B3FD4]" /> Jornada de níveis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            {LEVELS.map((level, i) => {
              const idx         = LEVELS.indexOf(currentLevel)
              const isPast      = i < idx
              const isCurrent   = level.id === currentLevel.id
              const isFuture    = i > idx
              return (
                <div key={level.id} className="flex flex-col items-center gap-1 flex-1">
                  <span className={`text-2xl transition-all ${isCurrent ? 'scale-125' : isFuture ? 'opacity-25 grayscale' : ''}`}>
                    {level.emoji}
                  </span>
                  <p className={`text-[10px] font-medium text-center leading-tight ${isCurrent ? 'text-[#5B3FD4]' : isPast ? 'text-gray-500' : 'text-gray-300'}`}>
                    {level.label}
                  </p>
                  {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-[#5B3FD4]" />}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Missões diárias */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-sm font-semibold text-gray-700">
            <span className="flex items-center gap-1.5">
              <Star className="w-4 h-4 text-[#5B3FD4]" /> Missões de hoje
            </span>
            <span className="text-xs font-normal text-gray-400">
              +{xpToday} XP ganhos hoje
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {dailyMissions.map((m) => (
            <div key={m.id} className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${m.completed ? 'bg-[#52D68A]/10' : 'bg-gray-50'}`}>
              <span className="text-xl">{m.emoji}</span>
              <div className="flex-1">
                <p className={`text-sm font-medium ${m.completed ? 'text-[#1a9e5c] line-through' : 'text-gray-800'}`}>
                  {m.label}
                </p>
              </div>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${m.completed ? 'bg-[#52D68A]/20 text-[#1a9e5c]' : 'bg-gray-100 text-gray-400'}`}>
                +{m.xp} XP
              </span>
              {m.completed && <span className="text-[#1a9e5c] text-sm">✓</span>}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Missões semanais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
            <Star className="w-4 h-4 text-amber-500" /> Missões da semana
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {weeklyMissions.map((m) => (
            <div key={m.id} className={`flex items-center gap-3 p-3 rounded-xl ${m.completed ? 'bg-amber-50' : 'bg-gray-50'}`}>
              <span className="text-xl">{m.emoji}</span>
              <div className="flex-1">
                <p className={`text-sm font-medium ${m.completed ? 'text-amber-700 line-through' : 'text-gray-800'}`}>
                  {m.label}
                </p>
              </div>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${m.completed ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-400'}`}>
                +{m.xp} XP
              </span>
            </div>
          ))}
          {monthlyMissions.map((m) => (
            <div key={m.id} className={`flex items-center gap-3 p-3 rounded-xl ${m.completed ? 'bg-[#5B3FD4]/5' : 'bg-gray-50'}`}>
              <span className="text-xl">{m.emoji}</span>
              <div className="flex-1">
                <p className={`text-sm font-medium ${m.completed ? 'text-[#5B3FD4]' : 'text-gray-800'}`}>
                  {m.label}
                </p>
                <p className="text-[10px] text-gray-400">Missão mensal</p>
              </div>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${m.completed ? 'bg-[#5B3FD4]/10 text-[#5B3FD4]' : 'bg-gray-100 text-gray-400'}`}>
                +{m.xp} XP
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Badges */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-sm font-semibold text-gray-700">
            <span className="flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-[#5B3FD4]" /> Conquistas
            </span>
            <span className="text-xs font-normal text-gray-400">
              {earnedBadgeIds.size}/{ALL_BADGES.length} desbloqueadas
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-3">
            {ALL_BADGES.map((badge) => {
              const earned = earnedBadgeIds.has(badge.id)
              return (
                <div key={badge.id} className="flex flex-col items-center gap-1.5 group" title={badge.desc}>
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl relative transition-all ${earned ? 'bg-[#5B3FD4]/10 shadow-sm' : 'bg-gray-100'}`}>
                    <span className={earned ? '' : 'grayscale opacity-30'}>{badge.emoji}</span>
                    {!earned && (
                      <div className="absolute inset-0 rounded-2xl flex items-center justify-center bg-gray-100/60">
                        <Lock className="w-3 h-3 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <p className={`text-[10px] text-center leading-tight ${earned ? 'text-gray-700 font-medium' : 'text-gray-300'}`}>
                    {badge.label}
                  </p>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Histórico de pontos */}
      {pointsHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-gray-700">Histórico de XP</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pointsHistory.map((p, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {ACTION_LABELS[p.action_type] ?? p.action_type}
                  </p>
                  {p.description && (
                    <p className="text-xs text-gray-400">{p.description}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-[#5B3FD4]">+{p.points} XP</p>
                  <p className="text-[10px] text-gray-400">
                    {new Date(p.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
