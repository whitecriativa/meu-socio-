'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase'
import { Logo } from '@/components/brand/logo'

export default function CadastroPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.password.length < 6) {
      setError('A senha precisa ter pelo menos 6 caracteres.')
      return
    }
    setLoading(true)
    setError('')

    const supabase = createBrowserClient()

    const rawPhone = form.phone.replace(/\D/g, '')
    const phone = rawPhone.startsWith('55') ? rawPhone : `55${rawPhone}`

    const { error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { name: form.name, phone } },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    })

    if (loginError) {
      setError('Conta criada! Verifique seu email e depois faça login.')
      setLoading(false)
      return
    }

    if (loginData?.user) {
      // Deletar PRIMEIRO o usuário temporário criado pelo bot (mesmo phone, id diferente)
      // Isso evita UNIQUE violation no phone ao inserir o usuário real logo abaixo
      await fetch('/api/onboarding/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authUserId: loginData.user.id, phone }),
      })

      // Agora que o temp user foi removido, inserir/atualizar o usuário real
      await supabase.from('users').upsert({
        id: loginData.user.id,
        name: form.name,
        email: form.email,
        phone,
        onboarding_step: 'completo',
      }, { onConflict: 'id' })
    }

    window.location.href = '/'
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)] px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <Logo size={52} showText={true} />
          <p className="text-sm text-[var(--text-secondary)] mt-3">Grátis para começar</p>
        </div>

        <div className="bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-5">Criar conta</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Seu nome</label>
              <input name="name" type="text" value={form.name} onChange={handleChange}
                placeholder="Como você se chama?" required
                className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-base)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[#0F40CB]/30 focus:border-[#0F40CB]" />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Email</label>
              <input name="email" type="email" value={form.email} onChange={handleChange}
                placeholder="seu@email.com" required
                className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-base)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[#0F40CB]/30 focus:border-[#0F40CB]" />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                WhatsApp <span className="text-[var(--text-secondary)] font-normal">(com DDD)</span>
              </label>
              <input name="phone" type="tel" value={form.phone} onChange={handleChange}
                placeholder="11999991234" required
                className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-base)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[#0F40CB]/30 focus:border-[#0F40CB]" />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Senha</label>
              <input name="password" type="password" value={form.password} onChange={handleChange}
                placeholder="Mínimo 6 caracteres" required
                className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-base)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[#0F40CB]/30 focus:border-[#0F40CB]" />
            </div>

            {error && (
              <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">{error}</p>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-2.5 rounded-xl bg-[#0F40CB] text-white text-sm font-semibold hover:bg-[#0a32a0] transition-colors disabled:opacity-50">
              {loading ? 'Criando conta...' : 'Criar conta grátis'}
            </button>
          </form>

          <p className="text-xs text-[var(--text-secondary)] text-center mt-4">
            Já tem conta?{' '}
            <a href="/login" className="text-[#0F40CB] hover:underline font-medium">Entrar</a>
          </p>
        </div>
      </div>
    </div>
  )
}
