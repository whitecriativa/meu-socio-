import { createClient } from '@supabase/supabase-js'
import { Sidebar } from '@/components/layout/sidebar'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

async function getUser() {
  const userId  = process.env.NEXT_PUBLIC_DEMO_USER_ID!
  const supabase = adminClient()
  const { data } = await supabase
    .from('users')
    .select('name, profile_type')
    .eq('id', userId)
    .single()
  return data
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getUser()

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        userName={user?.name ?? 'Meu negócio'}
        userRole={user?.profile_type ?? null}
      />
      {/* pt-14 = altura do header mobile; pb-20 = altura da bottom nav */}
      <main className="flex-1 overflow-y-auto pt-14 pb-20 md:pt-0 md:pb-0">
        {children}
      </main>
    </div>
  )
}
