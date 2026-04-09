'use server'

import { createClient } from '@supabase/supabase-js'
import { getAuthenticatedUserId } from '@/lib/get-user-id'

type Message = { role: 'user' | 'assistant'; content: string }

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

async function getUserContext(userId: string): Promise<string> {
  const supabase = adminClient()

  const [userRes, txRes, aptRes, taskRes] = await Promise.all([
    supabase.from('users').select('name, profile_type, monthly_goal, dream').eq('id', userId).single(),
    supabase.from('transactions').select('type, amount, category, description, competence_date')
      .eq('user_id', userId)
      .gte('competence_date', new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10))
      .order('competence_date', { ascending: false })
      .limit(20),
    supabase.from('appointments').select('service, scheduled_at, status, price, client_name')
      .eq('user_id', userId)
      .gte('scheduled_at', new Date().toISOString().slice(0, 10))
      .order('scheduled_at', { ascending: true })
      .limit(10),
    supabase.from('tasks').select('title, priority, completed_at')
      .eq('user_id', userId)
      .is('completed_at', null)
      .limit(5),
  ])

  const user = userRes.data
  const txs  = txRes.data ?? []
  const apts = aptRes.data ?? []
  const tasks = taskRes.data ?? []

  const receita = txs.filter((t) => t.type === 'receita').reduce((s, t) => s + Number(t.amount), 0)
  const despesa = txs.filter((t) => t.type === 'despesa').reduce((s, t) => s + Number(t.amount), 0)

  const agendaStr = apts.length === 0
    ? 'Nenhum agendamento futuro.'
    : apts.map((a) => {
        const dt = new Date(a.scheduled_at ?? '')
        const h  = dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })
        const d  = dt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'America/Sao_Paulo' })
        return `${d} ${h}: ${a.service}${a.client_name ? ` (${a.client_name})` : ''} — R$ ${a.price ?? 0}`
      }).join('\n')

  const tasksStr = tasks.length === 0
    ? 'Nenhuma tarefa pendente.'
    : tasks.map((t) => `- ${t.title} [${t.priority}]`).join('\n')

  return `
Usuário: ${user?.name ?? 'Desconhecido'}
Perfil: ${user?.profile_type ?? 'prestador de serviços'}
Meta mensal: R$ ${user?.monthly_goal ?? 0}
Sonho: ${user?.dream ?? 'não definido'}

Financeiro (últimos 30 dias):
- Receita: R$ ${receita.toFixed(2)}
- Despesa: R$ ${despesa.toFixed(2)}
- Líquido: R$ ${(receita - despesa).toFixed(2)}

Próximos agendamentos:
${agendaStr}

Tarefas pendentes:
${tasksStr}
`.trim()
}

export async function askAgent(messages: Message[]): Promise<string> {
  const userId = await getAuthenticatedUserId()
  if (!userId) return 'Você precisa estar logado para usar o Sócio IA.'

  const context = await getUserContext(userId)

  const systemPrompt = `Você é o Sócio IA, assistente de negócios do app Meu Sócio.
Você é direto, empático e fala como um sócio de confiança — não como um robô corporativo.
Use linguagem informal mas profissional. Responda em português.
Máximo 3 parágrafos por resposta. Use emojis com moderação.
Você tem acesso ao contexto atual do negócio do usuário:

${context}

Ajude com dúvidas sobre o app, análise dos dados, dicas de negócio, finanças, agenda e qualquer outro assunto.`

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.7,
      max_tokens: 400,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
    }),
  })

  if (!response.ok) throw new Error('Erro na API OpenAI')

  const data = await response.json()
  return data.choices?.[0]?.message?.content ?? 'Não consegui gerar uma resposta.'
}
