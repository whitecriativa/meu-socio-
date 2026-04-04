'use client'

import { useState } from 'react'
import { PlayCircle, BookOpen, Search, Clock, ChevronRight } from 'lucide-react'

const TRAILS = [
  { id: 'financas',   label: 'Finanças',     emoji: '💰', count: 8 },
  { id: 'comercial',  label: 'Comercial',    emoji: '🤝', count: 6 },
  { id: 'marketing',  label: 'Marketing',    emoji: '📣', count: 5 },
  { id: 'gestao',     label: 'Gestão',       emoji: '📋', count: 4 },
  { id: 'digital',    label: 'Digital',      emoji: '💻', count: 7 },
]

const VIDEOS = [
  { id: 1, title: 'Como precificar seus serviços', duration: '8 min', trail: 'financas',  thumbnail: '💰', new: true },
  { id: 2, title: 'Fidelização: clientes que ficam', duration: '6 min', trail: 'comercial', thumbnail: '🤝', new: false },
  { id: 3, title: 'Instagram para prestadores de serviço', duration: '12 min', trail: 'marketing', thumbnail: '📣', new: true },
  { id: 4, title: 'Gestão financeira no dia a dia', duration: '9 min', trail: 'financas',  thumbnail: '💵', new: false },
  { id: 5, title: 'Como captar clientes no WhatsApp', duration: '7 min', trail: 'comercial', thumbnail: '💬', new: false },
  { id: 6, title: 'Imposto MEI: o que você precisa saber', duration: '10 min', trail: 'financas', thumbnail: '📑', new: false },
]

const POSTS = [
  { id: 1, title: '5 formas de aumentar o ticket médio em 30 dias', readTime: '3 min', trail: 'comercial',  date: 'Hoje' },
  { id: 2, title: 'Como usar o WhatsApp para vender mais sem spam', readTime: '4 min', trail: 'marketing',  date: 'Ontem' },
  { id: 3, title: 'Pró-labore: quanto pagar a si mesmo?', readTime: '5 min', trail: 'financas',   date: '2 dias' },
  { id: 4, title: 'Modelo de contrato simples para prestadores',    readTime: '2 min', trail: 'gestao',     date: '3 dias' },
]

const TRAIL_LABELS: Record<string, string> = {
  financas: 'Finanças', comercial: 'Comercial', marketing: 'Marketing', gestao: 'Gestão', digital: 'Digital',
}

export default function AprendaPage() {
  const [search, setSearch]       = useState('')
  const [activeTrail, setTrail]   = useState<string | null>(null)

  const filterStr = search.toLowerCase()
  const filteredVideos = VIDEOS.filter((v) =>
    (!activeTrail || v.trail === activeTrail) &&
    (!filterStr  || v.title.toLowerCase().includes(filterStr))
  )
  const filteredPosts = POSTS.filter((p) =>
    (!activeTrail || p.trail === activeTrail) &&
    (!filterStr  || p.title.toLowerCase().includes(filterStr))
  )

  return (
    <div className="px-4 py-5 md:px-8 md:py-8 max-w-2xl space-y-5">

      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Aprenda</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
          Conteúdo para fazer seu negócio crescer
        </p>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
        <input
          type="text"
          placeholder="Buscar vídeos e artigos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#0F40CB]/30"
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
          }}
        />
      </div>

      {/* Trilhas */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <button
          onClick={() => setTrail(null)}
          className="flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors"
          style={{
            backgroundColor: !activeTrail ? '#0F40CB' : 'var(--bg-card)',
            color: !activeTrail ? '#fff' : 'var(--text-muted)',
            border: '1px solid var(--border)',
          }}
        >
          Todos
        </button>
        {TRAILS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTrail(activeTrail === t.id ? null : t.id)}
            className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors"
            style={{
              backgroundColor: activeTrail === t.id ? '#0F40CB' : 'var(--bg-card)',
              color: activeTrail === t.id ? '#fff' : 'var(--text-muted)',
              border: '1px solid var(--border)',
            }}
          >
            <span>{t.emoji}</span>
            {t.label}
            <span
              className="text-[10px] rounded-full px-1.5 py-0.5"
              style={{ backgroundColor: activeTrail === t.id ? 'rgba(255,255,255,0.25)' : 'var(--border)' }}
            >
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Vídeos */}
      {filteredVideos.length > 0 && (
        <section>
          <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>
            Vídeos
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredVideos.map((v) => (
              <div
                key={v.id}
                className="rounded-2xl overflow-hidden cursor-pointer group"
                style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
              >
                {/* Thumbnail */}
                <div
                  className="h-28 flex items-center justify-center relative"
                  style={{ background: 'linear-gradient(135deg, #0F40CB 0%, #4A2FB8 100%)' }}
                >
                  <span className="text-4xl">{v.thumbnail}</span>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                    <PlayCircle className="w-12 h-12 text-white drop-shadow" />
                  </div>
                  {v.new && (
                    <span className="absolute top-2 right-2 bg-[#B6F273] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      NOVO
                    </span>
                  )}
                </div>
                {/* Info */}
                <div className="p-3">
                  <p className="text-sm font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>
                    {v.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span
                      className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: 'var(--border)', color: 'var(--text-muted)' }}
                    >
                      {TRAIL_LABELS[v.trail]}
                    </span>
                    <span className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                      <Clock className="w-3 h-3" />{v.duration}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Artigos */}
      {filteredPosts.length > 0 && (
        <section>
          <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>
            Artigos
          </p>
          <div className="space-y-2.5">
            {filteredPosts.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 p-3 rounded-2xl cursor-pointer group"
                style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
              >
                <div className="w-10 h-10 rounded-xl bg-[#B6F273]/10 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-5 h-5 text-[#B6F273]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-tight" style={{ color: 'var(--text-primary)' }}>
                    {p.title}
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {TRAIL_LABELS[p.trail]} · {p.readTime} de leitura · {p.date}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {filteredVideos.length === 0 && filteredPosts.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
            Nenhum conteúdo encontrado
          </p>
          <button
            onClick={() => { setSearch(''); setTrail(null) }}
            className="mt-3 text-xs font-semibold text-[#0F40CB] underline"
          >
            Limpar filtros
          </button>
        </div>
      )}

    </div>
  )
}
