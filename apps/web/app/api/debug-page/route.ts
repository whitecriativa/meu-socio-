import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthenticatedUserId } from '@/lib/get-user-id'

export const dynamic = 'force-dynamic'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

export async function GET() {
  const results: Record<string, unknown> = {}

  try {
    results.userId = await getAuthenticatedUserId()
  } catch (e) {
    results.userId_error = String(e)
  }

  if (!results.userId) return NextResponse.json(results)

  const supabase = adminClient()
  const userId = results.userId as string

  const tables = ['users', 'transactions', 'appointments', 'clients', 'tasks',
    'user_gamification', 'smart_alerts', 'contracts', 'installments', 'costs_fixed',
    'user_badges', 'points_history']

  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).select('id').eq(
        table === 'users' ? 'id' : 'user_id', userId
      ).limit(1)
      results[table] = error ? `ERROR: ${error.message}` : 'OK'
    } catch (e) {
      results[table] = `THROW: ${String(e)}`
    }
  }

  return NextResponse.json(results)
}
