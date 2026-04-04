'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@supabase/supabase-js'
import { getAuthenticatedUserId } from '@/lib/get-user-id'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

async function requireUserId(): Promise<string> {
  const userId = await getAuthenticatedUserId()
  if (!userId) throw new Error('Não autenticado')
  return userId
}

export async function excluirTarefa(id: string) {
  const userId = await requireUserId()
  const supabase = adminClient()
  await supabase.from('tasks').delete().eq('id', id).eq('user_id', userId)
  revalidatePath('/tarefas')
}

export async function toggleTask(id: string, done: boolean) {
  const userId = await requireUserId()
  const supabase = adminClient()
  await supabase
    .from('tasks')
    .update({ completed_at: done ? new Date().toISOString() : null })
    .eq('id', id)
    .eq('user_id', userId)
  revalidatePath('/tarefas')
}

export async function criarTarefa(input: {
  title: string
  priority: 'high' | 'medium' | 'low'
  quadrant: 'urgent_important' | 'important_not_urgent' | 'urgent_not_important' | 'neither'
  due_date: string | null
}) {
  const userId  = await requireUserId()
  const supabase = adminClient()

  const { error } = await supabase.from('tasks').insert({
    user_id:  userId,
    title:    input.title,
    quadrant: input.quadrant,
    due_date: input.due_date || null,
  })

  if (error) throw new Error(error.message)
  revalidatePath('/tarefas')
}
