import { getAuthenticatedUserId } from '@/lib/get-user-id'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

// POST /api/alerts/check
// Verifica condições e cria smart_alerts para o usuário demo.
// Chamável via cron ou manualmente.
export async function POST() {
  const supabase  = adminClient()
  const userId = (await getAuthenticatedUserId()) ?? process.env.NEXT_PUBLIC_DEMO_USER_ID!

  const now        = new Date()
  const today      = now.toISOString().substring(0, 10)
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const threeDaysAgo = new Date(now.getTime() - 3 * 86400000).toISOString().substring(0, 10)

  // IDs de alertas já existentes e não lidos (para não duplicar)
  const { data: existingAlerts } = await supabase
    .from('smart_alerts')
    .select('type')
    .eq('user_id', userId)
    .is('read_at', null)

  const existingTypes = new Set((existingAlerts ?? []).map((a: { type: string }) => a.type))

  const alertsToCreate: {
    user_id: string
    type: string
    title: string
    message: string
    action_url: string | null
    action_label: string | null
  }[] = []

  // 1. Inatividade: nenhuma transação nos últimos 3 dias
  if (!existingTypes.has('inactivity')) {
    const { data: recentTx } = await supabase
      .from('transactions')
      .select('id')
      .eq('user_id', userId)
      .gte('created_at', `${threeDaysAgo}T00:00:00`)
      .limit(1)

    if (!recentTx || recentTx.length === 0) {
      alertsToCreate.push({
        user_id:      userId,
        type:         'inactivity',
        title:        '3 dias sem registros',
        message:      'Você não registrou nenhuma transação nos últimos 3 dias. Que tal atualizar seu caixa?',
        action_url:   '/financeiro',
        action_label: 'Ir ao Financeiro',
      })
    }
  }

  // 2. Custos altos: despesas > 70% das receitas no mês
  if (!existingTypes.has('budget_exceeded')) {
    const { data: monthTxs } = await supabase
      .from('transactions')
      .select('type, amount')
      .eq('user_id', userId)
      .gte('competence_date', monthStart)
      .lte('competence_date', today)

    type TxRow = { type: string; amount: number | null }
    const txs      = (monthTxs as TxRow[] ?? [])
    const revenue  = txs.filter((t) => t.type === 'receita').reduce((s, t) => s + Number(t.amount ?? 0), 0)
    const expenses = txs.filter((t) => t.type === 'despesa').reduce((s, t) => s + Number(t.amount ?? 0), 0)

    if (revenue > 0 && expenses > 0 && expenses / revenue > 0.7) {
      const pct = Math.round((expenses / revenue) * 100)
      alertsToCreate.push({
        user_id:      userId,
        type:         'budget_exceeded',
        title:        `Custos em ${pct}% do faturamento`,
        message:      `Suas despesas este mês estão em ${pct}% das receitas. O ideal é manter abaixo de 70%.`,
        action_url:   '/financeiro',
        action_label: 'Ver Financeiro',
      })
    }
  }

  // 3. Risco de meta: faltam menos de 7 dias e menos de 50% atingido
  if (!existingTypes.has('goal_risk')) {
    const { data: userData } = await supabase
      .from('users')
      .select('monthly_goal')
      .eq('id', userId)
      .single()

    const goal = Number(userData?.monthly_goal ?? 0)
    if (goal > 0) {
      const { data: monthRev } = await supabase
        .from('transactions')
        .select('amount')
        .eq('user_id', userId)
        .eq('type', 'receita')
        .gte('competence_date', monthStart)
        .lte('competence_date', today)

      const achieved  = ((monthRev ?? []) as { amount: number | null }[]).reduce((s, t) => s + Number(t.amount ?? 0), 0)
      const pct       = Math.round((achieved / goal) * 100)
      const daysLeft  = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate()

      if (daysLeft <= 7 && pct < 50) {
        alertsToCreate.push({
          user_id:      userId,
          type:         'goal_risk',
          title:        `Meta em risco — ${pct}% com ${daysLeft} dias restantes`,
          message:      `Você atingiu apenas ${pct}% da meta e o mês está quase acabando. Dá pra recuperar!`,
          action_url:   '/metas',
          action_label: 'Ver Metas',
        })
      }
    }
  }

  // Inserir alertas criados
  let created = 0
  if (alertsToCreate.length > 0) {
    const { error } = await supabase.from('smart_alerts').insert(alertsToCreate)
    if (!error) created = alertsToCreate.length
  }

  return NextResponse.json({ alerts_created: created, checked_at: now.toISOString() })
}

// GET — para testar via browser
export async function GET() {
  return POST()
}
