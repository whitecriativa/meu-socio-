import OpenAI, { toFile } from 'openai'
import { createServiceClient } from '@socio/database'
import { estimateCost } from './types.js'

// Whisper cobra por segundo de audio — modelo 'whisper-1'
// RN-04: audio DEVE ser transcrito antes de classificar intencao
const TRANSCRIPTION_MODEL = 'whisper-1'

function getOpenAI(): OpenAI {
  const key = process.env['OPENAI_API_KEY']
  if (!key) throw new Error('Variavel ausente: OPENAI_API_KEY')
  return new OpenAI({ apiKey: key })
}

export interface TranscribeAudioOptions {
  userId: string
  messageId: string
  audioBuffer: Buffer
  durationSeconds?: number
  filename?: string
}

export async function transcribeAudio(
  options: TranscribeAudioOptions,
): Promise<string> {
  const openai = getOpenAI()
  const supabase = createServiceClient()

  const file = await toFile(options.audioBuffer, options.filename ?? 'audio.ogg', {
    type: 'audio/ogg',
  })

  const transcription = await openai.audio.transcriptions.create({
    file,
    model: TRANSCRIPTION_MODEL,
    language: 'pt',   // forcamos portugues para melhor precisao
    response_format: 'text',
  })

  const text = typeof transcription === 'string' ? transcription : transcription.text

  // Log de custo por segundo de audio (RN-14)
  const durationSeconds = options.durationSeconds ?? 0
  const estimatedTokens = Math.ceil(durationSeconds / 60 * 1000) // aprox

  await supabase.from('ai_logs').insert({
    user_id: options.userId,
    model: TRANSCRIPTION_MODEL,
    operation: 'transcription',
    prompt_tokens: estimatedTokens,
    completion_tokens: 0,
    total_tokens: estimatedTokens,
    estimated_cost_usd: estimateCost(TRANSCRIPTION_MODEL, durationSeconds * 1000, 0),
    message_id: options.messageId,
  })

  return text
}
