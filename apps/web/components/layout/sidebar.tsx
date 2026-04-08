'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  DollarSign,
  CalendarDays,
  Users,
  CheckSquare,
  Target,
  Calculator,
  Settings,
  Zap,
  BookOpen,
  Radio,
  MoreHorizontal,
  X,
} from 'lucide-react'
import { LogoIcon } from '@/components/brand/logo'

const NAV_ITEMS = [
  { href: '/',              label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/financeiro',    label: 'Financeiro',   icon: DollarSign },
  { href: '/agenda',        label: 'Agenda',       icon: CalendarDays },
  { href: '/clientes',      label: 'Clientes',     icon: Users },
  { href: '/tarefas',       label: 'Tarefas',      icon: CheckSquare },
  { href: '/metas',         label: 'Metas',        icon: Target },
  { href: '/gamificacao',   label: 'Conquistas',   icon: Zap },
  { href: '/radar',         label: 'Radar',        icon: Radio },
  { href: '/aprenda',       label: 'Aprenda',      icon: BookOpen },
  { href: '/calculadora',   label: 'Calculadora',  icon: Calculator },
]

// 4 itens principais + botão "Mais"
const MOBILE_MAIN = [
  { href: '/',            label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/financeiro',  label: 'Financeiro', icon: DollarSign },
  { href: '/agenda',      label: 'Agenda',     icon: CalendarDays },
  { href: '/aprenda',     label: 'Aprenda',    icon: BookOpen },
]

// Itens do menu "Mais"
const MOBILE_MORE = [
  { href: '/clientes',    label: 'Clientes',    icon: Users },
  { href: '/tarefas',     label: 'Tarefas',     icon: CheckSquare },
  { href: '/metas',       label: 'Metas',       icon: Target },
  { href: '/gamificacao', label: 'Conquistas',  icon: Zap },
  { href: '/radar',       label: 'Radar',       icon: Radio },
  { href: '/calculadora', label: 'Calculadora', icon: Calculator },
  { href: '/configuracoes', label: 'Config.',   icon: Settings },
]

interface SidebarProps {
  userName: string
  userRole: string | null
}

export function Sidebar({ userName, userRole }: SidebarProps) {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)
  const isConfigActive = pathname === '/configuracoes'
  const initials = userName.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()

  // Se a página atual está no "Mais", o botão Mais fica ativo
  const moreActive = MOBILE_MORE.some((i) => i.href === pathname)

  return (
    <>
      {/* ── Sidebar desktop ─────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-60 min-h-screen bg-[#0F40CB] text-white flex-shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
          <LogoIcon size={36} />
          <div>
            <p className="font-bold text-sm leading-none tracking-tight text-white">Meu Sócio <span className="text-[10px] font-semibold uppercase tracking-widest opacity-50">APP</span></p>
            <p className="text-xs text-white/50 mt-0.5">Painel de gestão</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-0.5">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-white/15 text-white'
                    : 'text-white/65 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#B6F273]" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Botão Falar com o Sócio */}
        <div className="px-3 pb-2">
          <a
            href={`https://wa.me/${process.env.NEXT_PUBLIC_BOT_PHONE ?? ''}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl font-semibold text-sm transition-all"
            style={{ backgroundColor: '#B6F273', color: '#0F40CB' }}
          >
            <svg viewBox="0 0 32 32" className="w-4 h-4 flex-shrink-0" fill="currentColor" aria-hidden="true"><path d="M16 2C8.28 2 2 8.28 2 16c0 2.44.65 4.74 1.79 6.73L2 30l7.45-1.76A13.93 13.93 0 0 0 16 30c7.72 0 14-6.28 14-14S23.72 2 16 2zm0 25.5a11.44 11.44 0 0 1-5.82-1.59l-.42-.25-4.42 1.04 1.07-4.3-.28-.44A11.47 11.47 0 0 1 4.5 16C4.5 9.6 9.6 4.5 16 4.5S27.5 9.6 27.5 16 22.4 27.5 16 27.5zm6.29-8.57c-.34-.17-2.03-1-2.35-1.11-.32-.12-.55-.17-.78.17-.23.34-.9 1.11-1.1 1.34-.2.23-.4.26-.75.09-.34-.17-1.45-.54-2.76-1.71-1.02-.91-1.7-2.04-1.9-2.38-.2-.34-.02-.52.15-.69.15-.15.34-.4.51-.6.17-.2.23-.34.34-.57.12-.23.06-.43-.03-.6-.09-.17-.78-1.88-1.07-2.58-.28-.68-.57-.59-.78-.6H10.9c-.2 0-.52.08-.79.37-.28.3-1.05 1.02-1.05 2.5s1.07 2.9 1.22 3.1c.17.2 2.1 3.21 5.09 4.5.71.31 1.27.5 1.7.64.72.23 1.37.2 1.89.12.58-.09 1.78-.73 2.03-1.43.25-.7.25-1.3.17-1.43-.08-.12-.3-.2-.64-.37z"/></svg>
            Falar com o Sócio
          </a>
        </div>

        {/* Rodapé */}
        <div className="px-2 pb-4 border-t border-white/10 pt-3 space-y-0.5">
          <Link
            href="/configuracoes"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              isConfigActive
                ? 'bg-white/15 text-white'
                : 'text-white/65 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4" />
            Configurações
          </Link>
          <div className="flex items-center gap-3 px-3 py-2.5 mt-1">
            <div className="w-7 h-7 rounded-full bg-[#B6F273] flex items-center justify-center text-[#0F40CB] text-xs font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{userName}</p>
              {userRole && (
                <p className="text-xs text-white/50 truncate">{userRole}</p>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* ── Overlay menu "Mais" ─────────────────────────────── */}
      {moreOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setMoreOpen(false)}
        >
          <div
            className="absolute bottom-16 left-0 right-0 rounded-t-2xl p-4 grid grid-cols-3 gap-3"
            style={{ backgroundColor: 'var(--bg-card)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Botão fechar */}
            <div className="col-span-3 flex justify-between items-center mb-1">
              <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>MAIS OPÇÕES</p>
              <button onClick={() => setMoreOpen(false)}>
                <X className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              </button>
            </div>
            {MOBILE_MORE.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMoreOpen(false)}
                  className="flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl transition-colors"
                  style={{
                    backgroundColor: isActive ? '#0F40CB15' : 'var(--bg-base)',
                    color: isActive ? '#0F40CB' : 'var(--text-secondary)',
                  }}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[11px] font-medium">{label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Bottom nav mobile ───────────────────────────────── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 flex"
        style={{ backgroundColor: 'var(--bg-card)', borderTop: '1px solid var(--border)' }}
      >
        {MOBILE_MAIN.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-[10px] font-medium transition-colors"
              style={{ color: isActive ? '#0F40CB' : 'var(--text-muted)' }}
            >
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          )
        })}

        {/* Botão Mais */}
        <button
          onClick={() => setMoreOpen((v) => !v)}
          className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-[10px] font-medium transition-colors"
          style={{ color: moreActive || moreOpen ? '#0F40CB' : 'var(--text-muted)' }}
        >
          {moreOpen ? <X className="w-5 h-5" /> : <MoreHorizontal className="w-5 h-5" />}
          Mais
        </button>
      </nav>
    </>
  )
}
