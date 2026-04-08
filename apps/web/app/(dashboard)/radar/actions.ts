'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@supabase/supabase-js'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

export async function saveRadarSettings(userId: string, enabled: boolean, alertMinutes: number) {
  const supabase = adminClient()
  await supabase
    .from('users')
    .update({ radar_enabled: enabled, radar_alert_minutes: alertMinutes })
    .eq('id', userId)
  revalidatePath('/radar')
}
