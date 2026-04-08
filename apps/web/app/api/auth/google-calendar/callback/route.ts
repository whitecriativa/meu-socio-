import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { exchangeCode } from '@/lib/google-calendar'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://meusocio.app'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const code   = searchParams.get('code')
  const userId = searchParams.get('state') // state = userId passado no getAuthUrl

  if (!code || !userId) {
    return NextResponse.redirect(`${APP_URL}/configuracoes?gcal=error`)
  }

  try {
    const token = await exchangeCode(code)
    const supabase = adminClient()

    await supabase
      .from('users')
      .update({ google_calendar_token: token })
      .eq('id', userId)

    return NextResponse.redirect(`${APP_URL}/configuracoes?gcal=1`)
  } catch (err) {
    console.error('[gcal callback]', err)
    return NextResponse.redirect(`${APP_URL}/configuracoes?gcal=error`)
  }
}
