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

export async function toggleTask(id: string, done: boolean) {
  const supabase = adminClient()
  await supabase
    .from('tasks')
    .update({ completed_at: done ? new Date().toISOString() : null })
    .eq('id', id)
  revalidatePath('/tarefas')
}

export async function criarTarefa(input: {
  title: string
  priority: 'high' | 'medium' | 'low'
  quadrant: 'urgent_important' | 'important_not_urgent' | 'urgent_not_important' | 'neither'
  due_date: string | null
}) {
  const userId   = process.env.NEXT_PUBLIC_DEMO_USER_ID!
  const supabase = adminClient()

  const { error } = await supabase.from('tasks').insert({
    user_id:  userId,
    title:    input.title,
    priority: input.priority,
    quadrant: input.quadrant,
    due_date: input.due_date || null,
  })

  if (error) throw new Error(error.message)
  revalidatePath('/tarefas')
}
