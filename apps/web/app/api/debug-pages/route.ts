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
  const userId = await getAuthenticatedUserId()
  results.userId = userId
  if (!userId) return NextResponse.json(results)

  const supabase = adminClient()
  const now = new Date()
  const today = now.toISOString().substring(0, 10)
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

  // Test financeiro page queries
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('id, type, amount, category, description, payment_method, competence_date, client_id')
      .eq('user_id', userId)
      .gte('competence_date', monthStart)
      .lte('competence_date', today)
      .order('competence_date', { ascending: false })
    results.financeiro_transactions = error ? `ERROR: ${error.message}` : `OK (${data?.length ?? 0} rows)`
  } catch (e) { results.financeiro_transactions = `THROW: ${e}` }

  try {
    const { data, error } = await supabase
      .from('contracts')
      .select('id, client_name, description, total_amount, installments_count, start_date, status, installments(id, installment_number, amount, due_date, status, paid_at)')
      .eq('user_id', userId)
    results.contracts = error ? `ERROR: ${error.message}` : `OK (${data?.length ?? 0} rows)`
  } catch (e) { results.contracts = `THROW: ${e}` }

  try {
    const { data, error } = await supabase
      .from('costs_fixed')
      .select('id, name, amount, periodicity, category')
      .eq('user_id', userId)
    results.costs_fixed = error ? `ERROR: ${error.message}` : `OK (${data?.length ?? 0} rows)`
  } catch (e) { results.costs_fixed = `THROW: ${e}` }

  // Test agenda page
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('id, service, scheduled_at, status, price, notes, clients(name)')
      .eq('user_id', userId)
    results.appointments_with_clients = error ? `ERROR: ${error.message}` : `OK (${data?.length ?? 0} rows)`
  } catch (e) { results.appointments_with_clients = `THROW: ${e}` }

  // Test clientes page
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('id, name, phone, last_contact, total_spent, status')
      .eq('user_id', userId)
    results.clients = error ? `ERROR: ${error.message}` : `OK (${data?.length ?? 0} rows)`
  } catch (e) { results.clients = `THROW: ${e}` }

  // Test layout (user_gamification)
  try {
    const { data, error } = await supabase
      .from('user_gamification')
      .select('current_level')
      .eq('user_id', userId)
      .single()
    results.layout_gamification = error ? `ERROR: ${error.message}` : `OK: level=${data?.current_level}`
  } catch (e) { results.layout_gamification = `THROW: ${e}` }

  // Test users query
  try {
    const { data, error } = await supabase
      .from('users')
      .select('name, profile_type, monthly_goal')
      .eq('id', userId)
      .single()
    results.user_data = error ? `ERROR: ${error.message}` : `OK: name="${data?.name}"`
  } catch (e) { results.user_data = `THROW: ${e}` }

  return NextResponse.json(results, { status: 200 })
}
