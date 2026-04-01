import { createClient } from '@supabase/supabase-js'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}
import TarefasList, { type TaskItem } from '@/components/tarefas/tarefas-list'

export const dynamic = 'force-dynamic'

type Quadrant = 'urgent_important' | 'important_not_urgent' | 'urgent_not_important' | 'neither'

const VALID_QUADRANTS: Quadrant[] = [
  'urgent_important',
  'important_not_urgent',
  'urgent_not_important',
  'neither',
]

function toQuadrant(v: string | null | undefined): Quadrant {
  if (v && VALID_QUADRANTS.includes(v as Quadrant)) return v as Quadrant
  return 'important_not_urgent'
}

export default async function TarefasPage() {
  const userId = process.env.NEXT_PUBLIC_DEMO_USER_ID!
  const supabase = adminClient()

  const { data } = await supabase
    .from('tasks')
    .select('id, title, quadrant, completed_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)

  const tasks: TaskItem[] = (data ?? []).map((row) => ({
    id: row.id as string,
    title: row.title as string,
    quadrant: toQuadrant(row.quadrant as string | null),
    done: !!row.completed_at,
  }))

  return <TarefasList initialTasks={tasks} />
}
