'use client'

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
  MessageCircle,
  Zap,
  BookOpen,
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/',              label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/financeiro',    label: 'Financeiro',   icon: DollarSign },
  { href: '/agenda',        label: 'Agenda',       icon: CalendarDays },
  { href: '/clientes',      label: 'Clientes',     icon: Users },
  { href: '/tarefas',       label: 'Tarefas',      icon: CheckSquare },
  { href: '/metas',         label: 'Metas',        icon: Target },
  { href: '/gamificacao',   label: 'Conquistas',   icon: Zap },
  { href: '/aprenda',       label: 'Aprenda',      icon: BookOpen },
  { href: '/calculadora',   label: 'Calculadora',  icon: Calculator },
]

const MOBILE_NAV = [
  { href: '/',            label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/financeiro',  label: 'Financeiro', icon: DollarSign },
  { href: '/agenda',      label: 'Agenda',     icon: CalendarDays },
  { href: '/aprenda',     label: 'Aprenda',    icon: BookOpen },
  { href: '/gamificacao', label: 'Conquistas', icon: Zap },
]

interface SidebarProps {
  userName: string
  userRole: string | null
}

export function Sidebar({ userName, userRole }: SidebarProps) {
  const pathname = usePathname()
  const isConfigActive = pathname === '/configuracoes'
  const initials = userName.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()

  return (
    <>
      {/* ── Sidebar desktop ─────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-60 min-h-screen bg-[#5B3FD4] text-white flex-shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
          <div className="w-8 h-8 rounded-xl bg-[#52D68A] flex items-center justify-center flex-shrink-0">
            <MessageCircle className="w-4 h-4 text-[#5B3FD4]" />
          </div>
          <div>
            <p className="font-bold text-sm leading-none tracking-tight">Meu Sócio</p>
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
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#52D68A]" />
                )}
              </Link>
            )
          })}
        </nav>

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
            <div className="w-7 h-7 rounded-full bg-[#52D68A] flex items-center justify-center text-[#5B3FD4] text-xs font-bold flex-shrink-0">
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

      {/* ── Bottom nav mobile ───────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 flex" style={{ backgroundColor: 'var(--bg-card)', borderTop: '1px solid var(--border)' }}>
        {MOBILE_NAV.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-[10px] font-medium transition-colors"
              style={{ color: isActive ? '#5B3FD4' : 'var(--text-muted)' }}
            >
              <Icon className="w-5 h-5" style={{ color: isActive ? '#5B3FD4' : 'var(--text-muted)' }} />
              {label}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
