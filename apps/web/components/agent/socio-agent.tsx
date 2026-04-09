'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import { MessageCircle, X, Send, Loader2, Bot } from 'lucide-react'
import { askAgent } from '@/app/api/agent/actions'

type Message = {
  role: 'user' | 'assistant'
  content: string
}

export function SocioAgent() {
  const [open, setOpen]         = useState(false)
  const [input, setInput]       = useState('')
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Olá! Sou o Sócio IA. Posso ajudar com dúvidas sobre seu negócio, finanças, agenda ou qualquer coisa do app. Como posso te ajudar?' },
  ])
  const [, startTransition] = useTransition()
  const [loading, setLoading]   = useState(false)
  const bottomRef               = useRef<HTMLDivElement>(null)
  const inputRef                = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

  async function send() {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    const userMsg: Message = { role: 'user', content: text }
    setMessages((prev) => [...prev, userMsg])
    setLoading(true)

    startTransition(async () => {
      try {
        const history = [...messages, userMsg]
        const reply = await askAgent(history)
        setMessages((prev) => [...prev, { role: 'assistant', content: reply }])
      } catch {
        setMessages((prev) => [...prev, { role: 'assistant', content: 'Ocorreu um erro. Tente novamente.' }])
      } finally {
        setLoading(false)
      }
    })
  }

  return (
    <>
      {/* Botão flutuante */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
        style={{ backgroundColor: '#0F40CB' }}
        aria-label="Abrir Sócio IA"
      >
        {open
          ? <X className="w-6 h-6 text-white" />
          : <Bot className="w-6 h-6 text-white" />
        }
        {!open && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#B6F273] border-2 border-white" />
        )}
      </button>

      {/* Chat */}
      {open && (
        <div className="fixed bottom-36 right-4 md:bottom-24 md:right-6 z-50 w-80 max-w-[calc(100vw-2rem)] flex flex-col rounded-2xl shadow-2xl overflow-hidden border border-gray-100"
          style={{ height: '420px' }}
        >
          {/* Header */}
          <div className="flex items-center gap-2.5 px-4 py-3" style={{ backgroundColor: '#0F40CB' }}>
            <div className="w-8 h-8 rounded-full bg-[#B6F273] flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-[#0F40CB]" />
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-none">Sócio IA</p>
              <p className="text-[11px] text-white/60 mt-0.5">Seu assistente de negócios</p>
            </div>
          </div>

          {/* Mensagens */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5 bg-white">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-[#0F40CB] text-white rounded-br-sm'
                      : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 px-3 py-2 rounded-2xl rounded-bl-sm flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 text-gray-400 animate-spin" />
                  <span className="text-xs text-gray-400">Digitando...</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 px-3 py-2.5 bg-white border-t border-gray-100">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
              placeholder="Pergunte qualquer coisa..."
              className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#0F40CB] transition"
              disabled={loading}
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors disabled:opacity-40"
              style={{ backgroundColor: '#0F40CB' }}
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
