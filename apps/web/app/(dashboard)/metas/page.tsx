import { getAuthenticatedUserId } from '@/lib/get-user-id'
import { Target, TrendingUp, TrendingDown, Lightbulb } from 'lucide-react'
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

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

async function getData() {
  const userId = (await getAuthenticatedUserId()) ?? process.env.NEXT_PUBLIC_DEMO_USER_ID!
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

  const [{ data: user }, { data: txs }, { data: prevTxs }] = await Promise.all([
    supabase.from('users').select('name, monthly_goal').eq('id', userId).maybeSingle(),
    supabase.from('transactions').select('type, amount').eq('user_id', userId)
      .gte('competence_date', monthStart).lte('competence_date', today),
    // Mês anterior para comparação
    supabase.from('transactions').select('type, amount').eq('user_id', userId)
      .gte('competence_date', `${year}-${String(month - 1 || 12).padStart(2, '0')}-01`)
      .lte('competence_date', `${year}-${String(month - 1 || 12).padStart(2, '0')}-${new Date(year, month - 1, 0).getDate()}`),
  ])

  type TxRow = { type: string; amount: number | null }

  const txList = (txs as TxRow[] ?? [])
  const prevList = (prevTxs as TxRow[] ?? [])

  const achieved = txList.filter((t) => t.type === 'receita').reduce((s, t) => s + Number(t.amount), 0)
  const expenses = txList.filter((t) => t.type === 'despesa').reduce((s, t) => s + Number(t.amount), 0)
  const prevAchieved = prevList.filter((t) => t.type === 'receita').reduce((s, t) => s + Number(t.amount), 0)

  const target = Number(user?.monthly_goal ?? 0)
  const dailyAvg = daysPassed > 0 ? achieved / daysPassed : 0
  const projection = Math.round(dailyAvg * daysInMonth)
  const vsLastMonth = prevAchieved > 0 ? ((achieved - prevAchieved) / prevAchieved) * 100 : null

  const monthName = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  const monthLabel = monthName.charAt(0).toUpperCase() + monthName.slice(1)

  return {
    name: user?.name ?? 'você',
    target,
    achieved,
    expenses,
    daysLeft,
    daysPassed,
    daysInMonth,
    projection,
    vsLastMonth,
    monthLabel,
  }
}

function buildTips(achieved: number, target: number, projection: number, expenses: number, daysLeft: number): string[] {
  const tips: string[] = []
  const goalPercent = target > 0 ? (achieved / target) * 100 : 0
  const margin = achieved > 0 ? ((achieved - expenses) / achieved) * 100 : 0

  if (target === 0) {
    tips.push('Defina uma meta mensal para acompanhar seu progresso e ter um objetivo claro.')
    return tips
  }

  if (goalPercent >= 100) {
    tips.push('Parabéns! Você bateu a meta deste mês. Considere aumentar o objetivo para o próximo mês.')
    if (projection > target * 1.2) tips.push(`No ritmo atual, você pode faturar ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(projection)} no mês — ${Math.round((projection / target - 1) * 100)}% acima da meta!`)
  } else if (goalPercent >= 75) {
    tips.push(`Você está em ${Math.round(goalPercent)}% da meta. Faltam ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(target - achieved)} — pode chegar lá!`)
  } else if (goalPercent >= 50) {
    const dailyNeeded = daysLeft > 0 ? (target - achieved) / daysLeft : 0
    tips.push(`Para bater a meta, você precisa gerar em média ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(dailyNeeded)} por dia nos próximos ${daysLeft} dias.`)
  } else if (goalPercent < 30 && daysLeft < 15) {
    tips.push('O mês está na metade e você está abaixo de 30% da meta. Foque em fechar negócios pendentes e reativar clientes antigos.')
  }

  if (margin > 0 && margin < 20) {
    tips.push('Sua margem está baixa. Revise seus custos fixos ou considere ajustar seu preço para melhorar o lucro.')
  }

  if (projection < target * 0.7) {
    tips.push('A projeção está abaixo da meta. Tente antecipar receitas: ofereça pacotes, peça antecipações ou crie uma promoção por tempo limitado.')
  }

  if (tips.length === 0) {
    tips.push('Continue assim! Você está no caminho certo para bater a meta do mês.')
  }

  return tips.slice(0, 3)
}

export default async function MetasPage() {
  const { name, target, achieved, expenses, daysLeft, daysPassed, daysInMonth, projection, vsLastMonth, monthLabel } =
    await getData()

  const goalPercent   = target > 0 ? Math.min(100, Math.round((achieved / target) * 100)) : 0
  const projectionGap = projection - target
  const tips = buildTips(achieved, target, projection, expenses, daysLeft)

  return (
    <div className="px-4 py-5 md:px-8 md:py-8 max-w-2xl space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Metas</h1>
          <p className="text-sm text-gray-500 mt-0.5">Acompanhe seu progresso de {monthLabel}</p>
        </div>
        <EditarMetaModal currentGoal={target} currentDream="" />
      </div>

      {/* Termômetro da meta mensal */}
      {target > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-sm font-semibold text-gray-700">
              <span className="flex items-center gap-1.5">
                <Target className="w-4 h-4 text-[#0F40CB]" />
                Meta de {monthLabel}
              </span>
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  goalPercent >= 100 ? 'bg-[#B6F273]/20 text-[#0F40CB]' : 'bg-[#0F40CB]/10 text-[#0F40CB]'
                }`}
              >
                {goalPercent}%
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Progress
                value={goalPercent}
                indicatorColor={goalPercent >= 100 ? '#B6F273' : '#0F40CB'}
                className="h-5 rounded-full"
              />
              <div className="flex justify-between mt-2 text-xs text-gray-400">
                <span className="font-medium text-gray-700">{fmt(achieved)}</span>
                <span>meta: {fmt(target)}</span>
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
              <div className={`rounded-xl p-3 text-center ${projectionGap >= 0 ? 'bg-[#B6F273]/10' : 'bg-amber-50'}`}>
                <p className={`text-lg font-bold ${projectionGap >= 0 ? 'text-[#0F40CB]' : 'text-amber-600'}`}>
                  {fmt(projection)}
                </p>
                <p className="text-xs text-gray-400">projeção</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <Target className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-600">Meta mensal não definida</p>
            <p className="text-xs text-gray-400 mt-1">Use o botão &quot;Editar meta&quot; acima ou mande mensagem no WhatsApp</p>
          </CardContent>
        </Card>
      )}

      {/* Comparativo com mês anterior */}
      {vsLastMonth !== null && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl ${
          vsLastMonth >= 0 ? 'bg-[#B6F273]/10' : 'bg-red-50'
        }`}>
          {vsLastMonth >= 0
            ? <TrendingUp className="w-5 h-5 text-[#0F40CB] flex-shrink-0" />
            : <TrendingDown className="w-5 h-5 text-red-500 flex-shrink-0" />
          }
          <p className={`text-sm font-medium ${vsLastMonth >= 0 ? 'text-[#0F40CB]' : 'text-red-600'}`}>
            {vsLastMonth >= 0 ? '+' : ''}{Math.round(vsLastMonth)}% em relação ao mês passado
          </p>
        </div>
      )}

      {/* Dicas de IA */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
            <Lightbulb className="w-4 h-4 text-[#0F40CB]" />
            O que seu Sócio recomenda
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {tips.map((tip, i) => (
            <div key={i} className="flex gap-3 px-3 py-2.5 bg-gray-50 rounded-xl">
              <span className="text-sm mt-0.5">💡</span>
              <p className="text-sm text-gray-700">{tip}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
