'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase'
import { Logo } from '@/components/brand/logo'

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createBrowserClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    window.location.href = '/'
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)] px-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Logo size={52} showText={true} />
        </div>

        <div className="bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-5">Entrar</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Email</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="seu@email.com"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-base)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[#0F40CB]/30 focus:border-[#0F40CB]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Senha</label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Sua senha"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-base)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[#0F40CB]/30 focus:border-[#0F40CB]"
              />
            </div>

            {error && (
              <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-[#0F40CB] text-white text-sm font-semibold hover:bg-[#0a32a0] transition-colors disabled:opacity-50"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className="flex items-center justify-between mt-4">
            <p className="text-xs text-[var(--text-secondary)]">
              Não tem conta?{' '}
              <a href="/cadastro" className="text-[#0F40CB] hover:underline font-medium">Criar conta</a>
            </p>
            <a href="/recuperar-senha" className="text-xs text-[var(--text-secondary)] hover:underline">
              Esqueci a senha
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
