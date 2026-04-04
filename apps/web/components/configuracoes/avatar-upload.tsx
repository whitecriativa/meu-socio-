'use client'

import { useState, useRef } from 'react'
import { Camera } from 'lucide-react'
import { createBrowserClient } from '@/lib/supabase'

interface AvatarUploadProps {
  userId: string
  currentUrl: string | null
  name: string
}

export function AvatarUpload({ userId, currentUrl, name }: AvatarUploadProps) {
  const [url, setUrl] = useState(currentUrl)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const initials = name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() || 'U'

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      alert('Imagem muito grande. Máximo 2MB.')
      return
    }

    setLoading(true)
    try {
      const supabase = createBrowserClient()
      const ext = file.name.split('.').pop()
      const path = `${userId}/avatar.${ext}`

      const { error } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true })

      if (error) throw error

      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      const publicUrl = `${data.publicUrl}?t=${Date.now()}`
      setUrl(publicUrl)

      // Salva avatar_url no banco
      await supabase.from('users').update({ avatar_url: data.publicUrl }).eq('id', userId)
    } catch (err) {
      alert('Erro ao fazer upload. Tente novamente.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        {url ? (
          <img
            src={url}
            alt="Avatar"
            className="w-16 h-16 rounded-full object-cover border-2 border-gray-100"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-[#0F40CB] flex items-center justify-center text-white text-xl font-bold border-2 border-gray-100">
            {initials}
          </div>
        )}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={loading}
          className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors"
        >
          {loading
            ? <span className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
            : <Camera className="w-3 h-3 text-gray-500" />
          }
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFile}
        />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-700">Foto de perfil</p>
        <p className="text-xs text-gray-400">JPG, PNG ou WebP · máx 2MB</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="text-xs text-[#0F40CB] font-medium mt-1 hover:underline"
        >
          {url ? 'Trocar foto' : 'Adicionar foto'}
        </button>
      </div>
    </div>
  )
}
