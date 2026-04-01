'use client'

import { CheckSquare, Circle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Task {
  id: string
  title: string
  quadrant: 'urgent_important' | 'important_not_urgent' | 'urgent_not_important'
  done: boolean
}

interface TasksCardProps {
  tasks: Task[]
}

const quadrantLabel: Record<Task['quadrant'], { label: string; variant: 'warning' | 'orange' | 'default' }> = {
  urgent_important:     { label: 'Urgente',  variant: 'warning'  },
  urgent_not_important: { label: 'Delegar',  variant: 'default'  },
  important_not_urgent: { label: 'Planejar', variant: 'orange'   },
}

export function TasksCard({ tasks }: TasksCardProps) {
  const done = tasks.filter((t) => t.done).length

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <CheckSquare className="w-3.5 h-3.5" />
            Prioridades do dia
          </span>
          <span className="text-xs text-gray-400">{done}/{tasks.length} concluídas</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-1">
        <div className="space-y-2.5">
          {tasks.map((task) => (
            <div key={task.id} className="flex items-start gap-3">
              {task.done ? (
                <CheckSquare className="w-4 h-4 text-[#52D68A] mt-0.5 flex-shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-gray-300 mt-0.5 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className={`text-sm leading-tight ${task.done ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                  {task.title}
                </p>
              </div>
              <Badge variant={quadrantLabel[task.quadrant].variant} className="flex-shrink-0 mt-0.5">
                {quadrantLabel[task.quadrant].label}
              </Badge>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-3 border-t border-gray-50">
          <div className="flex justify-between text-xs text-gray-400 mb-1.5">
            <span>Progresso do dia</span>
            <span>{Math.round((done / tasks.length) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div
              className="h-1.5 rounded-full transition-all duration-500"
              style={{
                width: `${Math.round((done / tasks.length) * 100)}%`,
                backgroundColor: '#5B3FD4',
              }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
