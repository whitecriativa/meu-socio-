'use client'

import Link from 'next/link'
import { Bell, Sun, Moon, MessageCircle } from 'lucide-react'
import { useTheme } from '@/components/theme-provider'

interface HeaderProps {
  userName: string
  businessLevel: string
  alertCount?: number
}

export function Header({ userName, businessLevel, alertCount = 0 }: HeaderProps) {
  const { theme, toggle } = useTheme()

  const hour = typeof window !== 'undefined' ? new Date().getHours() : 12
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-14 flex items-center justify-between px-4 md:px-6
      bg-white/90 dark:bg-[#0F0F1A]/90 backdrop-blur-md border-b border-gray-100 dark:border-white/5">

      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-xl bg-[#5B3FD4] flex items-center justify-center flex-shrink-0">
          <MessageCircle className="w-3.5 h-3.5 text-white" />
        </div>
        <div className="hidden sm:block">
          <p className="text-sm font-bold text-gray-900 dark:text-white leading-none">Meu Sócio</p>
        </div>
      </div>

      {/* Centro — saudação */}
      <div className="flex-1 px-4 hidden md:block">
        <p className="text-sm font-medium text-gray-700 dark:text-white/80">
          {greeting}, <span className="font-bold text-gray-900 dark:text-white">{userName} 👋</span>
        </p>
        <p className="text-xs text-gray-400 dark:text-white/40">{businessLevel}</p>
      </div>

      {/* Ações */}
      <div className="flex items-center gap-2">
        {/* Toggle dark/light */}
        <button
          onClick={toggle}
          className="w-8 h-8 rounded-xl flex items-center justify-center
            text-gray-500 dark:text-white/60 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
          aria-label="Alternar tema"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notificações */}
        <Link href="/" className="relative w-8 h-8 rounded-xl flex items-center justify-center
          text-gray-500 dark:text-white/60 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
          <Bell className="w-4 h-4" />
          {alertCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
              {alertCount > 9 ? '9+' : alertCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  )
}
