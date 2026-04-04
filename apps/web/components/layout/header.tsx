'use client'

import React from 'react'
import Link from 'next/link'
import { Bell, Sun, Moon, LogOut } from 'lucide-react'
import { useTheme } from '@/components/theme-provider'
import { createBrowserClient } from '@/lib/supabase'

interface HeaderProps {
  userName: string
  businessLevel: string
  alertCount?: number
}

export function Header({ userName, businessLevel, alertCount = 0 }: HeaderProps) {
  const { theme, toggle } = useTheme()
  const [greeting, setGreeting] = React.useState('Olá')

  React.useEffect(() => {
    const hour = new Date().getHours()
    setGreeting(hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite')
  }, [])

  async function handleLogout() {
    const supabase = createBrowserClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-14 flex items-center justify-between px-4 md:px-6
      bg-white/90 dark:bg-[#0F0F1A]/90 backdrop-blur-md border-b border-gray-100 dark:border-white/5">

      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-xl bg-[#0F40CB] flex items-center justify-center flex-shrink-0">
          <svg viewBox="0 0 32 32" className="w-3.5 h-3.5 text-white" fill="currentColor" aria-hidden="true"><path d="M16 2C8.28 2 2 8.28 2 16c0 2.44.65 4.74 1.79 6.73L2 30l7.45-1.76A13.93 13.93 0 0 0 16 30c7.72 0 14-6.28 14-14S23.72 2 16 2zm0 25.5a11.44 11.44 0 0 1-5.82-1.59l-.42-.25-4.42 1.04 1.07-4.3-.28-.44A11.47 11.47 0 0 1 4.5 16C4.5 9.6 9.6 4.5 16 4.5S27.5 9.6 27.5 16 22.4 27.5 16 27.5zm6.29-8.57c-.34-.17-2.03-1-2.35-1.11-.32-.12-.55-.17-.78.17-.23.34-.9 1.11-1.1 1.34-.2.23-.4.26-.75.09-.34-.17-1.45-.54-2.76-1.71-1.02-.91-1.7-2.04-1.9-2.38-.2-.34-.02-.52.15-.69.15-.15.34-.4.51-.6.17-.2.23-.34.34-.57.12-.23.06-.43-.03-.6-.09-.17-.78-1.88-1.07-2.58-.28-.68-.57-.59-.78-.6H10.9c-.2 0-.52.08-.79.37-.28.3-1.05 1.02-1.05 2.5s1.07 2.9 1.22 3.1c.17.2 2.1 3.21 5.09 4.5.71.31 1.27.5 1.7.64.72.23 1.37.2 1.89.12.58-.09 1.78-.73 2.03-1.43.25-.7.25-1.3.17-1.43-.08-.12-.3-.2-.64-.37z"/></svg>
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

        {/* Sair */}
        <button
          onClick={handleLogout}
          className="w-8 h-8 rounded-xl flex items-center justify-center
            text-gray-500 dark:text-white/60 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
          aria-label="Sair"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  )
}
