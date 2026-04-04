'use client'

import { useState } from 'react'
import { createBrowserClient } from '@/lib/supabase'
import { Logo } from '@/components/brand/logo'

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createBrowserClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/auth/callback?next=/nova-senha`,
    })

    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)] px-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Logo size={52} showText={true} />
        </div>

        <div className="bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border)]">
          {sent ? (
            <div className="text-center">
              <div className="text-3xl mb-3">📬</div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Email enviado!</h2>
              <p className="text-sm text-[var(--text-secondary)]">
                Enviamos um link para <strong>{email}</strong> para você criar uma nova senha.
              </p>
              <a href="/login" className="block mt-4 text-sm text-[#0F40CB] hover:underline">
                Voltar para o login
              </a>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-1">Recuperar senha</h2>
              <p className="text-sm text-[var(--text-secondary)] mb-5">
                Digite seu email e enviaremos um link para criar uma nova senha
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-base)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[#0F40CB]/30 focus:border-[#0F40CB]"
                />

                {error && <p className="text-sm text-red-500">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-[#0F40CB] text-white text-sm font-semibold hover:bg-[#0a32a0] transition-colors disabled:opacity-50"
                >
                  {loading ? 'Enviando...' : 'Enviar link'}
                </button>
              </form>

              <a href="/login" className="block text-center text-sm text-[var(--text-secondary)] hover:underline mt-4">
                Voltar para o login
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
