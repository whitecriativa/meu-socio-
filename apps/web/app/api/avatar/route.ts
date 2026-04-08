import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthenticatedUserId } from '@/lib/get-user-id'

export async function POST(req: NextRequest) {
  const userId = await getAuthenticatedUserId()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const form = await req.formData()
  const file = form.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'Arquivo não enviado' }, { status: 400 })

  if (file.size > 2 * 1024 * 1024)
    return NextResponse.json({ error: 'Imagem muito grande. Máximo 2MB.' }, { status: 400 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )

  const ext  = file.name.split('.').pop() ?? 'jpg'
  const path = `${userId}/avatar.${ext}`
  const buf  = Buffer.from(await file.arrayBuffer())

  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, buf, { upsert: true, contentType: file.type })

  if (error) {
    // Tenta criar o bucket se não existir e repete
    if (error.message?.includes('Bucket not found') || error.message?.includes('bucket')) {
      await supabase.storage.createBucket('avatars', { public: true }).catch(() => null)
      const { error: e2 } = await supabase.storage
        .from('avatars')
        .upload(path, buf, { upsert: true, contentType: file.type })
      if (e2) return NextResponse.json({ error: e2.message }, { status: 500 })
    } else {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path)
  const publicUrl = pub.publicUrl

  await supabase.from('users').update({ avatar_url: publicUrl }).eq('id', userId)

  return NextResponse.json({ url: publicUrl })
}
