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
  Settings,
  MessageCircle,
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/financeiro', label: 'Financeiro', icon: DollarSign },
  { href: '/agenda', label: 'Agenda', icon: CalendarDays },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/tarefas', label: 'Tarefas', icon: CheckSquare },
  { href: '/metas', label: 'Metas', icon: Target },
]

// Itens que aparecem na bottom nav do mobile (máx 5)
const MOBILE_NAV = NAV_ITEMS.slice(0, 5)

export function Sidebar() {
  const pathname = usePathname()

  return (
    <>
      {/* ── Sidebar desktop ─────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-60 min-h-screen bg-[#2D6A4F] text-white flex-shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
          <div className="w-8 h-8 rounded-lg bg-[#F4845F] flex items-center justify-center flex-shrink-0">
            <MessageCircle className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-sm leading-none">Sócio</p>
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
              </Link>
            )
          })}
        </nav>

        {/* Rodapé */}
        <div className="px-2 pb-4 border-t border-white/10 pt-3 space-y-0.5">
          <Link
            href="/configuracoes"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/65 hover:bg-white/10 hover:text-white transition-colors"
          >
            <Settings className="w-4 h-4" />
            Configurações
          </Link>
          <div className="flex items-center gap-3 px-3 py-2.5 mt-1">
            <div className="w-7 h-7 rounded-full bg-[#F4845F] flex items-center justify-center text-xs font-bold flex-shrink-0">
              A
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">Ana Lima</p>
              <p className="text-xs text-white/50 truncate">Manicure</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Header mobile ───────────────────────────────────── */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-30 bg-[#2D6A4F] text-white flex items-center justify-between px-4 h-14 shadow-md">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-[#F4845F] flex items-center justify-center">
            <MessageCircle className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-sm">Sócio</span>
        </div>
        <div className="w-7 h-7 rounded-full bg-[#F4845F] flex items-center justify-center text-xs font-bold">
          A
        </div>
      </header>

      {/* ── Bottom nav mobile ───────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 flex">
        {MOBILE_NAV.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-[10px] font-medium transition-colors ${
                isActive ? 'text-[#2D6A4F]' : 'text-gray-400'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-[#2D6A4F]' : 'text-gray-400'}`} />
              {label}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
