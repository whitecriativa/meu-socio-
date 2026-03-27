import OpenAI from 'openai'
import { createServiceClient } from '@socio/database'
import { buildIntentPrompt, type UserContext } from './prompts/intent.js'
import { IntentResponseSchema, estimateCost } from './types.js'
import type { IntentResponse } from './types.js'

const INTENT_MODEL = 'gpt-4o-mini' // rapido e barato para classificacao (SPEC.md)
const UNKNOWN_THRESHOLD = 0.70      // abaixo disso, pede clareza (RN-03)

function getOpenAI(): OpenAI {
  const key = process.env['OPENAI_API_KEY']
  if (!key) throw new Error('Variavel ausente: OPENAI_API_KEY')
  return new OpenAI({ apiKey: key })
}

export interface ClassifyIntentOptions {
  userId: string
  messageId: string
  text: string
  context: UserContext
}

export interface ClassifyIntentResult {
  intent: IntentResponse
  rawResponse: string
}

export async function classifyIntent(
  options: ClassifyIntentOptions,
): Promise<ClassifyIntentResult> {
  const openai = getOpenAI()
  const supabase = createServiceClient()

  const prompt = buildIntentPrompt(options.text, options.context)

  const completion = await openai.chat.completions.create({
    model: INTENT_MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.1,  // baixa temperatura para classificacao consistente
    max_tokens: 500,
    response_format: { type: 'json_object' },
  })

  const rawContent = completion.choices[0]?.message.content ?? '{}'
  const parsed = JSON.parse(rawContent) as unknown

  // Valida e forca o schema com Zod
  const intent = IntentResponseSchema.parse(parsed)

  // Se confidence < threshold, downgrade para unknown (RN-03)
  if (intent.confidence < UNKNOWN_THRESHOLD && intent.intent !== 'unknown') {
    intent.intent = 'unknown'
    intent.action = 'send_response'
    intent.response = `Nao entendi bem. Voce quis ${getSuggestion(intent.intent)}?`
  }

  // Log de custo (F103, RN-14)
  const usage = completion.usage
  if (usage) {
    await supabase.from('ai_logs').insert({
      user_id: options.userId,
      model: INTENT_MODEL,
      operation: 'intent_classification',
      prompt_tokens: usage.prompt_tokens,
      completion_tokens: usage.completion_tokens,
      total_tokens: usage.total_tokens,
      estimated_cost_usd: estimateCost(
        INTENT_MODEL,
        usage.prompt_tokens,
        usage.completion_tokens,
      ),
      message_id: options.messageId,
    })
  }

  return { intent, rawResponse: rawContent }
}

function getSuggestion(intent: string): string {
  const suggestions: Record<string, string> = {
    financial: 'registrar uma receita ou despesa',
    appointment: 'agendar ou cancelar um horario',
    task: 'registrar uma tarefa',
    query: 'consultar algum dado',
  }
  return suggestions[intent] ?? 'dizer algo'
}
