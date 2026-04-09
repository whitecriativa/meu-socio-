'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import type { BookingService } from '@/components/configuracoes/booking-section'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

export async function salvarBooking(
  userId: string,
  data: { slug: string; active: boolean; services: BookingService[] },
) {
  const { slug, active, services } = data
  const supabase = adminClient()

  const cleanSlug = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')

  if (cleanSlug && cleanSlug.length < 3) {
    throw new Error('O slug precisa ter pelo menos 3 caracteres.')
  }

  // Verificar se slug já está em uso por outro usuário
  if (cleanSlug) {
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('booking_slug', cleanSlug)
      .neq('id', userId)
      .maybeSingle()

    if (existing) {
      throw new Error('Este link já está em uso. Escolha outro.')
    }
  }

  const { error } = await supabase
    .from('users')
    .update({
      booking_slug: cleanSlug || null,
      booking_active: active && !!cleanSlug,
      booking_services: services,
    })
    .eq('id', userId)

  if (error) throw new Error(error.message)

  revalidatePath('/configuracoes')
}
