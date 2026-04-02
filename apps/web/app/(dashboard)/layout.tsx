import { createClient } from '@supabase/supabase-js'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

const LEVEL_LABELS: Record<string, string> = {
  semente:    'Nível Semente 🌱',
  broto:      'Nível Broto 🌿',
  arvore:     'Nível Árvore 🌳',
  estrela:    'Nível Estrela ⭐',
  cristal:    'Nível Cristal 💎',
  socio_ouro: 'Sócio Ouro 🏆',
}

async function getLayoutData() {
  const userId  = process.env.NEXT_PUBLIC_DEMO_USER_ID!
  const supabase = adminClient()

  const [{ data: user }, { data: gamif }, { count: alertCount }] = await Promise.all([
    supabase.from('users').select('name, profile_type').eq('id', userId).single(),
    supabase.from('user_gamification').select('current_level').eq('user_id', userId).single(),
    supabase.from('smart_alerts').select('id', { count: 'exact', head: true })
      .eq('user_id', userId).is('read_at', null),
  ])

  return {
    userName:      (user?.name as string) ?? 'Usuário',
    businessLevel: LEVEL_LABELS[(gamif?.current_level as string) ?? 'semente'] ?? 'Nível Semente 🌱',
    alertCount:    alertCount ?? 0,
  }
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { userName, businessLevel, alertCount } = await getLayoutData()

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: 'var(--bg-base)' }}>
      <Sidebar userName={userName} userRole={null} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header fixo — ocupa toda a largura acima do main */}
        <Header
          userName={userName}
          businessLevel={businessLevel}
          alertCount={alertCount}
        />

        {/* Conteúdo — padding-top para não ficar sob o header fixo */}
        <main className="flex-1 overflow-y-auto pt-14 pb-20 md:pb-0">
          {children}
        </main>
      </div>
    </div>
  )
}
