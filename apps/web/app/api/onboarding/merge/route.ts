import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Usa service_role para deletar o usuário temporário (criado pelo bot)
// e garantir que sobra apenas o usuário com auth.uid correto
function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

export async function POST(req: NextRequest) {
  try {
    const { authUserId, phone } = await req.json()

    if (!authUserId || !phone) {
      return NextResponse.json({ error: 'authUserId e phone são obrigatórios' }, { status: 400 })
    }

    const supabase = adminClient()

    // Busca usuários com o mesmo phone mas id diferente (temporários criados pelo bot)
    const { data: tempUsers } = await supabase
      .from('users')
      .select('id')
      .eq('phone', phone)
      .neq('id', authUserId)

    if (tempUsers && tempUsers.length > 0) {
      const tempIds = tempUsers.map((u) => u.id)

      // Deleta os usuários temporários
      await supabase.from('users').delete().in('id', tempIds)

      return NextResponse.json({ merged: tempIds.length, deletedIds: tempIds })
    }

    return NextResponse.json({ merged: 0 })
  } catch (err) {
    console.error('[merge] erro:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
