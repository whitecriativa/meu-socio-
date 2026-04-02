import Link from 'next/link'
import { PlayCircle, BookOpen, ChevronRight } from 'lucide-react'

const VIDEOS = [
  { id: 1, title: 'Como precificar seus serviços',    duration: '8 min', category: 'Finanças' },
  { id: 2, title: 'Fidelização: clientes que ficam', duration: '6 min', category: 'Comercial' },
]

const POST = {
  title: '5 formas de aumentar o ticket médio em 30 dias',
  readTime: '3 min de leitura',
  category: 'Estratégia',
}

export function LearnPreview() {
  return (
    <div
      className="rounded-2xl p-4"
      style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
          Aprenda
        </p>
        <Link href="/aprenda" className="flex items-center gap-0.5 text-[11px] font-medium text-[#5B3FD4]">
          Ver tudo <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="space-y-2.5">
        {/* Vídeos */}
        {VIDEOS.map((v) => (
          <Link
            key={v.id}
            href="/aprenda"
            className="flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#5B3FD4]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[#5B3FD4]/20 transition-colors">
              <PlayCircle className="w-5 h-5 text-[#5B3FD4]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-tight truncate" style={{ color: 'var(--text-primary)' }}>
                {v.title}
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {v.category} · {v.duration}
              </p>
            </div>
          </Link>
        ))}

        {/* Divisor */}
        <div style={{ borderTop: '1px solid var(--border)' }} className="pt-2.5">
          <Link href="/aprenda" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-[#52D68A]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[#52D68A]/20 transition-colors">
              <BookOpen className="w-5 h-5 text-[#52D68A]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-tight" style={{ color: 'var(--text-primary)' }}>
                {POST.title}
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {POST.category} · {POST.readTime}
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
