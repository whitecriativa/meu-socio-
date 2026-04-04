'use client'

import { useState, useTransition } from 'react'
import { Star, Zap, Clock, ArrowDown, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { toggleTask, excluirTarefa } from '@/app/(dashboard)/tarefas/actions'
import { NovaTarefaModal } from './nova-tarefa-modal'

type Quadrant = 'urgent_important' | 'important_not_urgent' | 'urgent_not_important' | 'neither'

export interface TaskItem {
  id: string
  title: string
  quadrant: Quadrant
  done: boolean
}

const POINTS: Record<Quadrant, number> = {
  urgent_important: 10,
  important_not_urgent: 5,
  urgent_not_important: 5,
  neither: 3,
}

const QUADRANT_META: Record<Quadrant, { label: string; icon: React.ReactNode; bg: string }> = {
  urgent_important:     { label: 'Urgente + Importante', icon: <Zap className="w-3 h-3" />,      bg: 'bg-red-50 text-red-600'          },
  important_not_urgent: { label: 'Importante',           icon: <Star className="w-3 h-3" />,      bg: 'bg-[#0F40CB]/10 text-[#0F40CB]' },
  urgent_not_important: { label: 'Urgente',              icon: <Clock className="w-3 h-3" />,     bg: 'bg-amber-50 text-amber-600'      },
  neither:              { label: 'Pode esperar',         icon: <ArrowDown className="w-3 h-3" />, bg: 'bg-gray-100 text-gray-500'       },
}

const ORDER: Quadrant[] = ['urgent_important', 'important_not_urgent', 'urgent_not_important', 'neither']

export default function TarefasList({ initialTasks }: { initialTasks: TaskItem[] }) {
  const [tasks, setTasks] = useState(initialTasks)
  const [, startTransition] = useTransition()

  function toggle(id: string) {
    const task = tasks.find((t) => t.id === id)
    if (!task) return
    const newDone = !task.done
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: newDone } : t)))
    startTransition(() => { toggleTask(id, newDone) })
  }

  function handleDelete(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id))
    startTransition(() => { excluirTarefa(id) })
  }

  const pointsEarned = tasks.filter((t) => t.done).reduce((s, t) => s + POINTS[t.quadrant], 0)
  const totalPoints  = tasks.reduce((s, t) => s + POINTS[t.quadrant], 0)
  const doneCount    = tasks.filter((t) => t.done).length

  if (tasks.length === 0) {
    return (
      <div className="px-4 py-5 md:px-8 md:py-8 max-w-3xl">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900 mb-1">Tarefas</h1>
            <p className="text-sm text-gray-500">Organize suas prioridades do dia</p>
          </div>
          <NovaTarefaModal />
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-4xl mb-3">✅</p>
            <p className="text-sm font-medium text-gray-700">Nenhuma tarefa ainda</p>
            <p className="text-xs text-gray-400 mt-1">Adicione pelo botão acima ou pelo WhatsApp</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="px-4 py-5 md:px-8 md:py-8 max-w-3xl space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Tarefas</h1>
          <p className="text-sm text-gray-500 mt-0.5">{doneCount}/{tasks.length} concluídas hoje</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1.5 bg-[#0F40CB]/10 text-[#0F40CB] px-3 py-1.5 rounded-xl">
              <Star className="w-3.5 h-3.5 fill-[#0F40CB]" />
              <span className="text-sm font-bold">{pointsEarned} pts</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">{totalPoints - pointsEarned} pts disponíveis</p>
          </div>
          <NovaTarefaModal />
        </div>
      </div>

      <Card>
        <CardContent className="py-3 px-4">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
            <span>Progresso do dia</span>
            <span className="font-semibold text-[#0F40CB]">
              {doneCount === 0
                ? 'Bora começar! 💪'
                : doneCount === tasks.length
                ? 'Tudo feito! 🎉'
                : `${Math.round((doneCount / tasks.length) * 100)}%`}
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.round((doneCount / tasks.length) * 100)}%`, backgroundColor: '#0F40CB' }}
            />
          </div>
        </CardContent>
      </Card>

      {ORDER.map((q) => {
        const group = tasks.filter((t) => t.quadrant === q)
        if (group.length === 0) return null
        const meta = QUADRANT_META[q]
        return (
          <section key={q}>
            <div className="flex items-center gap-2 mb-2">
              <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${meta.bg}`}>
                {meta.icon}
                {meta.label}
              </span>
            </div>
            <Card>
              <CardContent className="p-0 divide-y divide-gray-50">
                {group.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-start gap-3 px-4 py-3.5 hover:bg-gray-50/50 transition-colors group"
                  >
                    <button
                      onClick={() => toggle(task.id)}
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                        task.done ? 'bg-[#B6F273] border-[#B6F273]' : 'border-gray-300 hover:border-[#0F40CB]'
                      }`}
                    >
                      {task.done && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12">
                          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </button>
                    <span className={`flex-1 text-sm leading-snug ${task.done ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                      {task.title}
                    </span>
                    <span className={`flex items-center gap-0.5 text-xs font-semibold flex-shrink-0 ml-2 ${task.done ? 'text-[#B6F273]' : 'text-gray-400'}`}>
                      <Star className={`w-3 h-3 ${task.done ? 'fill-[#B6F273]' : ''}`} />
                      +{POINTS[task.quadrant]}
                    </span>
                    <button
                      onClick={() => handleDelete(task.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400 transition-all flex-shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>
        )
      })}
    </div>
  )
}
