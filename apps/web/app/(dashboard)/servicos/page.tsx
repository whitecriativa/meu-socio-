import { getAuthenticatedUserId } from '@/lib/get-user-id'
import { createClient } from '@supabase/supabase-js'
import { ServicosClient } from '@/components/servicos/servicos-client'

export const dynamic = 'force-dynamic'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

export default async function ServicosPage() {
  const userId   = (await getAuthenticatedUserId()) ?? process.env.NEXT_PUBLIC_DEMO_USER_ID!
  const supabase = adminClient()

  const { data } = await supabase
    .from('services')
    .select('id, name, price, duration_min, description, active')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  return (
    <div className="px-4 py-5 md:px-8 md:py-8 max-w-3xl">
      <ServicosClient initialServices={data ?? []} />
    </div>
  )
}
