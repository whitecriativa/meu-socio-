import { createBrowserClient as createClient } from '@supabase/ssr'

// Cliente para uso em componentes React (browser)
export function createBrowserClient() {
  return createClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!,
  )
}
