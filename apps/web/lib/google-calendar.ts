// Helper para Google Calendar API (HTTP direto, sem googleapis SDK)

export type GCalToken = {
  access_token: string
  refresh_token: string
  expires_at: number // timestamp ms
}

const CLIENT_ID     = process.env.GOOGLE_CLIENT_ID!
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!
const REDIRECT_URI  = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://meusocio.app'}/api/auth/google-calendar/callback`

export function getAuthUrl(state: string) {
  const params = new URLSearchParams({
    client_id:     CLIENT_ID,
    redirect_uri:  REDIRECT_URI,
    response_type: 'code',
    scope:         'https://www.googleapis.com/auth/calendar.events',
    access_type:   'offline',
    prompt:        'consent',
    state,
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`
}

export async function exchangeCode(code: string): Promise<GCalToken> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id:     CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri:  REDIRECT_URI,
      grant_type:    'authorization_code',
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error_description ?? 'Erro ao autenticar com Google')
  return {
    access_token:  data.access_token,
    refresh_token: data.refresh_token,
    expires_at:    Date.now() + (data.expires_in ?? 3600) * 1000,
  }
}

async function refreshToken(token: GCalToken): Promise<GCalToken> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: token.refresh_token,
      client_id:     CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type:    'refresh_token',
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error_description ?? 'Erro ao renovar token')
  return {
    ...token,
    access_token: data.access_token,
    expires_at:   Date.now() + (data.expires_in ?? 3600) * 1000,
  }
}

async function getValidToken(token: GCalToken): Promise<GCalToken> {
  if (Date.now() < token.expires_at - 60_000) return token
  return refreshToken(token)
}

export async function createCalendarEvent(
  token: GCalToken,
  calendarId: string = 'primary',
  event: {
    summary: string
    description?: string | undefined
    startDateTime: string  // ISO 8601
    durationMin: number
    location?: string | undefined
  },
): Promise<{ eventId: string; updatedToken: GCalToken }> {
  const validToken = await getValidToken(token)

  const start = new Date(event.startDateTime)
  const end   = new Date(start.getTime() + event.durationMin * 60_000)

  const body = {
    summary:     event.summary,
    description: event.description ?? '',
    location:    event.location ?? '',
    start: { dateTime: start.toISOString(), timeZone: 'America/Sao_Paulo' },
    end:   { dateTime: end.toISOString(),   timeZone: 'America/Sao_Paulo' },
  }

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${validToken.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    },
  )

  const data = await res.json()
  if (!res.ok) throw new Error(data.error?.message ?? 'Erro ao criar evento no Google Calendar')

  return { eventId: data.id as string, updatedToken: validToken }
}

export async function deleteCalendarEvent(
  token: GCalToken,
  calendarId: string = 'primary',
  eventId: string,
): Promise<GCalToken> {
  const validToken = await getValidToken(token)

  await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
    {
      method:  'DELETE',
      headers: { Authorization: `Bearer ${validToken.access_token}` },
    },
  )

  return validToken
}
