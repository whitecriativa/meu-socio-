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

// POST /api/goals/suggest
// Retorna 3 sugestões de metas personalizadas com base no histórico do usuário.
// Usa OpenAI GPT-4o se OPENAI_API_KEY estiver configurada, caso contrário retorna sugestões padrão.
export async function POST() {
  const supabase = adminClient()
  const userId = (await getAuthenticatedUserId()) ?? process.env.NEXT_PUBLIC_DEMO_USER_ID!

  const now        = new Date()
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const today      = now.toISOString().substring(0, 10)

  const [{ data: user }, { data: txs }, { data: clients }, { data: goal }] = await Promise.all([
    supabase.from('users').select('name, profile_type, monthly_goal, dream').eq('id', userId).single(),
    supabase.from('transactions').select('type, amount, category')
      .eq('user_id', userId).gte('competence_date', monthStart).lte('competence_date', today),
    supabase.from('clients').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('goals').select('target_revenue, achieved_revenue').eq('user_id', userId)
      .gte('month', monthStart).single(),
  ])

  type TxRow = { type: string; amount: number | null; category: string | null }
  const txList = (txs as TxRow[] ?? [])
  const revenue  = txList.filter((t) => t.type === 'receita').reduce((s, t) => s + Number(t.amount ?? 0), 0)
  const expenses = txList.filter((t) => t.type === 'despesa').reduce((s, t) => s + Number(t.amount ?? 0), 0)
  const monthlyGoal = Number(user?.monthly_goal ?? 0)
  const goalPct     = monthlyGoal > 0 ? Math.round((revenue / monthlyGoal) * 100) : 0
  const clientCount = (clients as unknown as { id: string }[] | null)?.length ?? 0

  const openaiKey = process.env.OPENAI_API_KEY

  if (openaiKey) {
    try {
      const prompt = `Você é o Sócio, assistente financeiro para autônomos brasileiros.

Dados do usuário:
- Profissão: ${user?.profile_type ?? 'autônomo'}
- Meta mensal: R$ ${monthlyGoal}
- Faturamento este mês: R$ ${revenue.toFixed(2)} (${goalPct}% da meta)
- Despesas este mês: R$ ${expenses.toFixed(2)}
- Total de clientes: ${clientCount}
- Sonho: ${user?.dream ?? 'não definido'}

Gere EXATAMENTE 3 sugestões de metas estratégicas em JSON. Responda apenas o JSON, sem markdown:
[
  {
    "title": "título curto e motivador",
    "type": "financial" | "structural" | "growth",
    "target_value": número (pode ser null para metas qualitativas),
    "reasoning": "por que esta meta faz sentido para este usuário agora"
  }
]

Uma meta deve ser financeira, uma estrutural (organização do negócio) e uma de crescimento.`

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 500,
        }),
      })

      if (res.ok) {
        const json = await res.json()
        const text = json.choices?.[0]?.message?.content ?? '[]'
        const suggestions = JSON.parse(text)
        return NextResponse.json({ suggestions, source: 'ai' })
      }
    } catch {
      // fallback para sugestões padrão
    }
  }

  // Sugestões padrão quando OpenAI não está disponível
  const suggestions = [
    {
      title:        goalPct < 80 ? `Bater ${Math.min(100, goalPct + 20)}% da meta este mês` : 'Aumentar ticket médio em 10%',
      type:         'financial',
      target_value: monthlyGoal > 0 ? Math.round(monthlyGoal * 1.1) : null,
      reasoning:    monthlyGoal > 0
        ? `Você está em ${goalPct}% da meta. Um ajuste pequeno pode fazer grande diferença.`
        : 'Definir uma meta financeira mensal ajuda a manter o foco.',
    },
    {
      title:        'Separar finanças pessoais das do negócio',
      type:         'structural',
      target_value: null,
      reasoning:    'Separar PF/PJ facilita calcular seu pró-labore real e apresentar DRE ao contador.',
    },
    {
      title:        clientCount < 10 ? 'Cadastrar 10 clientes na carteira' : `Reativar ${Math.max(1, Math.round(clientCount * 0.1))} clientes inativos`,
      type:         'growth',
      target_value: clientCount < 10 ? 10 : Math.max(1, Math.round(clientCount * 0.1)),
      reasoning:    clientCount < 10
        ? 'Ter uma carteira de clientes registrada permite identificar quem retorna e quem sumiu.'
        : 'Reativar clientes antigos é mais barato que conquistar novos.',
    },
  ]

  return NextResponse.json({ suggestions, source: 'default' })
}

export async function GET() {
  return POST()
}
