import type { User } from '@socio/database'

// Contexto minimo do usuario para enriquecer o prompt
export interface UserContext {
  name: string
  profile_type: User['profile_type']
  monthly_goal: number | null
  dream: string | null
  today_revenue: number
  month_revenue: number
  next_appointment: string | null  // "sexta às 14h com Ana" ou null
}

// Prompt principal enviado ao gpt-4o-mini para identificar intencao (SPEC.md secao 2)
export function buildIntentPrompt(
  message: string,
  context: UserContext,
): string {
  const goal = context.monthly_goal
    ? `R$ ${context.monthly_goal.toFixed(2)}`
    : 'nao definida'

  const nextAppointment = context.next_appointment ?? 'nenhum agendamento proximo'

  return `Voce e o Socio, assistente de negocios de ${context.name}.

Perfil: ${context.profile_type === 'prestadora_servicos' ? 'Prestadora de servicos' : 'Freelancer digital'} | Meta mensal: ${goal} | Sonho: ${context.dream ?? 'nao informado'}
Faturamento hoje: R$ ${context.today_revenue.toFixed(2)} | Mes atual: R$ ${context.month_revenue.toFixed(2)}
Proximo agendamento: ${nextAppointment}

Mensagem recebida: "${message}"

Identifique a intencao e responda APENAS com JSON valido no formato abaixo (sem markdown, sem explicacao):
{
  "intent": "financial|appointment|task|query|motivation|unknown",
  "confidence": 0.0,
  "data": {},
  "response": "resposta para enviar no WhatsApp (maximo 3 linhas, tom de socio proximo, em portugues)",
  "action": "save_transaction|create_appointment|create_task|query_data|send_response"
}

Regras:
- "financial": menciona dinheiro, receita, despesa, pagamento, valor, cliente pagou, gastei
- "appointment": menciona agenda, marcar, horario, cliente, cancelar, remarcar
- "task": menciona tarefa, fazer, lembrar, pendencia, prazo
- "query": pergunta sobre dados (quanto faturei, minha meta, agenda de hoje)
- "motivation": quer motivacao, como estou indo, progresso, meta
- "unknown": nao se encaixa em nenhuma das acima

Para intent "financial", inclua em "data":
{
  "type": "receita|despesa",
  "amount": 0.0,
  "category": "categoria conforme perfil",
  "description": "descricao extraida",
  "payment_method": "pix|dinheiro|cartao_credito|cartao_debito|transferencia|outro|null",
  "client_name": "nome do cliente ou null",
  "competence_date": "YYYY-MM-DD (hoje se nao mencionado)"
}

Para intent "appointment", inclua em "data":
{
  "client_name": "nome do cliente",
  "service": "tipo de servico ou null",
  "date_text": "texto da data como veio (ex: sexta, amanha, 15/03)",
  "time_text": "texto do horario (ex: 14h, 14:00)",
  "action": "create|cancel|reschedule"
}

Se confidence < 0.70, use intent "unknown" e peca clareza educadamente no campo "response". (RN-03)`
}
