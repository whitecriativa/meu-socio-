import { type NextRequest, NextResponse } from 'next/server'

// Webhook da Evolution API — apenas reenvia para o n8n
// O n8n e o cerebro central; este endpoint serve como alternativa ou proxy

const N8N_WEBHOOK_URL = process.env['N8N_WEBHOOK_URL']

export async function POST(request: NextRequest): Promise<NextResponse> {
  const apiKey = request.headers.get('apikey') ?? ''
  const expectedKey = process.env['EVOLUTION_API_KEY'] ?? ''

  // Valida apikey simples para evitar requisicoes nao autorizadas
  if (apiKey !== expectedKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Retorna 200 imediatamente (Evolution API nao espera resposta longa)
  // Processa de forma assincrona via n8n
  if (N8N_WEBHOOK_URL) {
    fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).catch((err: unknown) => {
      console.error('[webhook/evolution] Erro ao encaminhar para n8n:', err)
    })
  }

  return NextResponse.json({ ok: true })
}
