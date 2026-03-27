// Tipos para Evolution API v2
// Referencia: https://doc.evolution-api.com/

// ── Webhook ───────────────────────────────────────────────────────────────────

export type EvolutionEvent =
  | 'messages.upsert'
  | 'messages.update'
  | 'connection.update'
  | 'qr.updated'
  | 'send.message'

export interface EvolutionWebhookPayload {
  event: EvolutionEvent
  instance: string
  data: EvolutionMessageData | EvolutionConnectionData
  destination: string
  date_time: string
  sender: string
  server_url: string
  apikey: string
}

export interface EvolutionMessageData {
  key: {
    remoteJid: string     // ex: "5511999999999@s.whatsapp.net"
    fromMe: boolean
    id: string
    participant?: string   // em grupos
  }
  pushName: string         // nome do contato no WhatsApp
  message: EvolutionMessage
  messageType: EvolutionMessageType
  messageTimestamp: number
  instanceId: string
  source: string
}

export type EvolutionMessageType =
  | 'conversation'
  | 'extendedTextMessage'
  | 'audioMessage'
  | 'imageMessage'
  | 'videoMessage'
  | 'documentMessage'
  | 'stickerMessage'
  | 'reactionMessage'

export interface EvolutionMessage {
  conversation?: string
  extendedTextMessage?: { text: string }
  audioMessage?: {
    url: string
    mimetype: string
    fileSha256: string
    fileLength: string
    seconds: number
    ptt: boolean            // push-to-talk (audio gravado no WhatsApp)
    mediaKey: string
    fileEncSha256: string
    directPath: string
    mediaKeyTimestamp: string
  }
  imageMessage?: {
    url: string
    mimetype: string
    caption?: string
    fileSha256: string
    fileLength: string
    height: number
    width: number
    mediaKey: string
  }
}

export interface EvolutionConnectionData {
  instance: string
  state: 'open' | 'close' | 'connecting'
}

// ── Send Message ──────────────────────────────────────────────────────────────

export interface SendTextParams {
  instanceName: string
  to: string              // numero com DDI, sem + (ex: "5511999999999")
  text: string
}

export interface SendTextResponse {
  key: {
    remoteJid: string
    fromMe: boolean
    id: string
  }
  message: { conversation: string }
  messageTimestamp: number
  status: string
}

export interface DownloadMediaResponse {
  base64: string
  mimetype: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

// Extrai o numero de telefone limpo do remoteJid
// "5511999999999@s.whatsapp.net" → "5511999999999"
export function extractPhone(remoteJid: string): string {
  return remoteJid.replace(/@.*$/, '')
}

// Verifica se e uma mensagem de texto (conversation ou extendedText)
export function isTextMessage(data: EvolutionMessageData): boolean {
  return (
    data.messageType === 'conversation' ||
    data.messageType === 'extendedTextMessage'
  )
}

// Verifica se e uma mensagem de audio
export function isAudioMessage(data: EvolutionMessageData): boolean {
  return data.messageType === 'audioMessage'
}

// Extrai o texto da mensagem (seja conversation ou extendedText)
export function extractText(data: EvolutionMessageData): string | null {
  return (
    data.message.conversation ??
    data.message.extendedTextMessage?.text ??
    null
  )
}
