import 'server-only'

import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { createServerSupabaseClient } from './supabase-server'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

// Decodifica o payload de um JWT (sem verificar assinatura)
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    // base64url → base64 → Buffer
    const base64 = parts[1]!.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64 + '='.repeat((4 - base64.length % 4) % 4)
    return JSON.parse(Buffer.from(padded, 'base64').toString('utf8'))
  } catch {
    return null
  }
}

function decodeJwtSub(token: string): string | null {
  return (decodeJwtPayload(token)?.sub as string) ?? null
}

// Tenta extrair o user_id dos cookies do Supabase
function extractUserIdFromCookies(allCookies: { name: string; value: string }[]): string | null {
  // Coleta todos os cookies de auth (simples e chunks)
  const authCookies = allCookies.filter(
    (c) => c.name.startsWith('sb-') && c.name.includes('-auth-token'),
  )
  if (authCookies.length === 0) return null

  // Ordena chunks e concatena
  const sorted = authCookies
    .filter((c) => c.name.match(/-auth-token(\.\d+)?$/))
    .sort((a, b) => a.name.localeCompare(b.name))
  const combined = sorted.map((c) => c.value).join('')

  // Tenta como JSON direto
  for (const raw of [combined, decodeURIComponent(combined)]) {
    try {
      const obj = JSON.parse(raw)
      if (obj?.user?.id) return obj.user.id
      if (obj?.access_token) {
        const sub = decodeJwtSub(obj.access_token)
        if (sub) return sub
      }
    } catch { /* próximo */ }
  }

  // Tenta como JWT direto (cookie IS o access_token)
  for (const c of authCookies) {
    const sub = decodeJwtSub(c.value)
    if (sub) return sub
  }

  return null
}

// Extrai nome/email/phone do access_token JWT ou do objeto de sessão
function extractMetaFromCookies(allCookies: { name: string; value: string }[]): { name: string; email: string; phone: string } {
  const authCookies = allCookies
    .filter((c) => c.name.startsWith('sb-') && c.name.includes('-auth-token'))
    .sort((a, b) => a.name.localeCompare(b.name))

  const combined = authCookies.map((c) => c.value).join('')

  // Tenta JSON completo da sessão
  for (const raw of [combined, decodeURIComponent(combined)]) {
    try {
      const obj = JSON.parse(raw)
      const meta = obj?.user?.user_metadata
      const email = obj?.user?.email ?? ''
      if (meta || email) {
        return {
          name:  meta?.name  || email.split('@')[0] || 'Usuário',
          email: email,
          phone: meta?.phone || '',
        }
      }
      // Tenta decodificar access_token do JSON
      if (obj?.access_token) {
        const payload = decodeJwtPayload(obj.access_token)
        const meta2 = payload?.user_metadata as Record<string, string> | undefined
        return {
          name:  meta2?.name  || (payload?.email as string)?.split('@')[0] || 'Usuário',
          email: (payload?.email as string) ?? '',
          phone: meta2?.phone || '',
        }
      }
    } catch { /* próximo */ }
  }

  // Tenta decodificar JWT direto
  for (const c of authCookies) {
    const payload = decodeJwtPayload(c.value)
    if (payload?.sub) {
      const meta = payload.user_metadata as Record<string, string> | undefined
      return {
        name:  meta?.name  || (payload.email as string)?.split('@')[0] || 'Usuário',
        email: (payload.email as string) ?? '',
        phone: meta?.phone || '',
      }
    }
  }

  return { name: 'Usuário', email: '', phone: '' }
}

async function getNameFromAuth(authUserId: string, cookieStore: Awaited<ReturnType<typeof cookies>>): Promise<string> {
  // Tenta 1: auth.admin (fonte mais confiável)
  try {
    const admin = adminClient()
    const { data } = await admin.auth.admin.getUserById(authUserId)
    const authUser = data?.user
    if (authUser) {
      const metaName = authUser.user_metadata?.name as string | undefined
      if (metaName && metaName !== 'Usuário') return metaName
      const email = authUser.email ?? ''
      if (email) return email.split('@')[0]!
    }
  } catch { /* fallback */ }

  // Tenta 2: cookies
  const meta = extractMetaFromCookies(cookieStore.getAll())
  if (meta.name && meta.name !== 'Usuário') return meta.name

  return 'Usuário'
}

async function ensureUserExists(authUserId: string, cookieStore: Awaited<ReturnType<typeof cookies>>) {
  const admin = adminClient()

  // 1. Busca por auth UUID (caso normal — usuário já vinculado)
  const { data: existing } = await admin
    .from('users')
    .select('id, name, email')
    .eq('id', authUserId)
    .single()

  if (existing?.id) {
    const updates: Record<string, string> = {}
    if (existing.name === 'Usuário' || !existing.name) {
      const name = await getNameFromAuth(authUserId, cookieStore)
      if (name && name !== 'Usuário') updates.name = name
    }
    if (!existing.email) {
      try {
        const { data: authData } = await admin.auth.admin.getUserById(authUserId)
        if (authData?.user?.email) updates.email = authData.user.email
      } catch { /* ignora */ }
    }
    if (Object.keys(updates).length > 0) {
      await admin.from('users').update(updates).eq('id', authUserId)
    }
    return authUserId
  }

  // 2. Busca email e telefone do Supabase Auth
  let authEmail: string | undefined
  let authPhone: string | undefined
  try {
    const { data: authData } = await admin.auth.admin.getUserById(authUserId)
    authEmail = authData?.user?.email
    const rawP = (authData?.user?.user_metadata?.phone as string | undefined || '').replace(/\D/g, '')
    authPhone = rawP ? (rawP.startsWith('55') ? rawP : `55${rawP}`) : undefined
  } catch { /* ignora */ }

  // 3. Tenta vincular a usuário existente pelo EMAIL (criado pelo bot via onboarding)
  if (authEmail) {
    const { data: byEmail } = await admin
      .from('users')
      .select('id, name, email')
      .eq('email', authEmail)
      .maybeSingle()

    if (byEmail?.id) {
      // Usuário do bot encontrado pelo email — retorna o ID dele
      // para que o dashboard veja os dados registrados via WhatsApp
      return byEmail.id
    }
  }

  // 4. Tenta vincular pelo TELEFONE
  const meta = extractMetaFromCookies(cookieStore.getAll())
  const rawPhone = (authPhone || meta.phone || '').replace(/\D/g, '')
  const userPhone = rawPhone
    ? (rawPhone.startsWith('55') ? rawPhone : `55${rawPhone}`)
    : `uid_${authUserId.replace(/-/g, '')}`

  if (rawPhone) {
    const { data: byPhone } = await admin
      .from('users')
      .select('id')
      .eq('phone', userPhone)
      .maybeSingle()

    if (byPhone?.id) {
      // Vincula email ao usuário existente para futuros logins
      if (authEmail) {
        await admin.from('users').update({ email: authEmail }).eq('id', byPhone.id)
      }
      return byPhone.id
    }
  }

  // 5. Cria novo usuário (primeiro acesso sem conta no bot)
  const name = await getNameFromAuth(authUserId, cookieStore)

  const { error } = await admin.from('users').insert({
    id:           authUserId,
    name,
    phone:        userPhone,
    email:        authEmail,
    profile_type: 'outro',
  })

  if (error) {
    if (error.message.includes('duplicate') || error.message.includes('unique') || error.code === '23505') {
      const { data: retry } = await admin.from('users').select('id').eq('id', authUserId).maybeSingle()
      return retry?.id ?? authUserId
    }
    console.error('Erro ao criar usuário:', error.message)
    return null
  }

  return authUserId
}

export async function getAuthenticatedUserId(): Promise<string | null> {
  try {
    const cookieStore = await cookies()

    // Tenta 1: ler cookies diretamente
    const fromCookies = extractUserIdFromCookies(cookieStore.getAll())
    if (fromCookies) {
      return await ensureUserExists(fromCookies, cookieStore)
    }

    // Tenta 2: usar o cliente Supabase server-side
    const supabase = await createServerSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user?.id) {
      return await ensureUserExists(session.user.id, cookieStore)
    }

    return null
  } catch {
    return null
  }
}
