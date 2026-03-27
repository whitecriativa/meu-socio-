import { z } from 'zod'
import type { MessageIntent } from '@socio/database'

// ── Intent Classification ─────────────────────────────────────────────────────

export const IntentAction = z.enum([
  'save_transaction',
  'create_appointment',
  'create_task',
  'query_data',
  'send_response',
])

export const FinancialData = z.object({
  type: z.enum(['receita', 'despesa']),
  amount: z.number().positive(),
  category: z.string(),
  description: z.string().nullable(),
  payment_method: z
    .enum(['pix', 'dinheiro', 'cartao_credito', 'cartao_debito', 'transferencia', 'outro'])
    .nullable(),
  client_name: z.string().nullable(),
  competence_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
})

export const AppointmentData = z.object({
  client_name: z.string(),
  service: z.string().nullable(),
  date_text: z.string(),
  time_text: z.string(),
  action: z.enum(['create', 'cancel', 'reschedule']),
})

export const IntentResponseSchema = z.object({
  intent: z.enum([
    'financial',
    'appointment',
    'task',
    'query',
    'motivation',
    'unknown',
  ] as [MessageIntent, ...MessageIntent[]]),
  confidence: z.number().min(0).max(1),
  data: z.record(z.unknown()),
  response: z.string().max(500),
  action: IntentAction,
})

export type IntentResponse = z.infer<typeof IntentResponseSchema>
export type FinancialData = z.infer<typeof FinancialData>
export type AppointmentData = z.infer<typeof AppointmentData>

// ── AI Cost Tracking (RN-14) ──────────────────────────────────────────────────

// Preco por 1000 tokens (USD) — atualizar se a OpenAI mudar os precos
export const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'gpt-4o-mini': { input: 0.000150, output: 0.000600 },
  'gpt-4o':      { input: 0.005000, output: 0.015000 },
  'whisper-1':   { input: 0.000006, output: 0 }, // por segundo de audio
}

export function estimateCost(
  model: string,
  promptTokens: number,
  completionTokens: number,
): number {
  const pricing = MODEL_PRICING[model]
  if (!pricing) return 0
  return (
    (promptTokens / 1000) * pricing.input +
    (completionTokens / 1000) * pricing.output
  )
}
