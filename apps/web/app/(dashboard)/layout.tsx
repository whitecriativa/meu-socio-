import { createClient } from '@supabase/supabase-js'
import { getAuthenticatedUserId } from '@/lib/get-user-id'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { SocioAgent } from '@/components/agent/socio-agent'

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
  try {
    const userId = await getAuthenticatedUserId()
    if (!userId) return { userName: 'Usuário', userAvatarUrl: null, businessLevel: 'Nível Semente 🌱', alertCount: 0 }

    const supabase = adminClient()

    const { data: user } = await supabase
      .from('users')
      .select('name, profile_type, avatar_url')
      .eq('id', userId)
      .maybeSingle()

    // Tabelas opcionais — podem não existir em todas as versões do banco
    let currentLevel = 'semente'
    let alertCount = 0

    try {
      const { data: gamif } = await supabase
        .from('user_gamification')
        .select('current_level')
        .eq('user_id', userId)
        .maybeSingle()
      if (gamif?.current_level) currentLevel = gamif.current_level as string
    } catch { /* tabela não existe ainda */ }

    try {
      const { count } = await supabase
        .from('smart_alerts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .is('read_at', null)
      alertCount = count ?? 0
    } catch { /* tabela não existe ainda */ }

    return {
      userName:       (user?.name as string) || 'Usuário',
      userAvatarUrl:  (user?.avatar_url as string) || null,
      businessLevel:  LEVEL_LABELS[currentLevel] ?? 'Nível Semente 🌱',
      alertCount,
    }
  } catch {
    return { userName: 'Usuário', userAvatarUrl: null, businessLevel: 'Nível Semente 🌱', alertCount: 0 }
  }
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { userName, userAvatarUrl, businessLevel, alertCount } = await getLayoutData()

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: 'var(--bg-base)' }}>
      <Sidebar userName={userName} userRole={null} avatarUrl={userAvatarUrl} />

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

      {/* Agente IA flutuante */}
      <SocioAgent />
    </div>
  )
}
