'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Sparkles, User, Bot, RefreshCw, Copy, Check, Info } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const STARTER_PROMPTS = [
  'How much should I have in emergency fund as an H1B visa holder?',
  'Should I max my 401k or pay off student loans first?',
  'When do I need to file FBAR and what are the penalties?',
  'How does the India-US tax treaty affect my finances?',
  'What is my FIRE number and how close am I?',
  'Should I contribute to a traditional or Roth 401k on H1B?',
  'How do I plan for green card legal fees?',
  'What happens to my Social Security if I return to India?',
]

interface Props {
  initialContext: string
}

export function AssistantClient({ initialContext }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [copied, setCopied] = useState<number | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(text: string) {
    if (!text.trim() || streaming) return

    const userMsg: Message = { role: 'user', content: text.trim() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setStreaming(true)

    const assistantMsg: Message = { role: 'assistant', content: '' }
    setMessages([...newMessages, assistantMsg])

    abortRef.current = new AbortController()

    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          context: initialContext,
        }),
        signal: abortRef.current.signal,
      })

      if (!response.ok) {
        let errorMsg = `Request failed (${response.status})`
        try {
          const errJson = await response.json()
          errorMsg = errJson.error ?? errorMsg
        } catch {
          errorMsg = await response.text().catch(() => errorMsg)
        }
        setMessages([...newMessages, { role: 'assistant', content: `⚠️ ${errorMsg}` }])
        return
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let fullContent = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          fullContent += decoder.decode(value, { stream: true })
          setMessages([...newMessages, { role: 'assistant', content: fullContent }])
        }
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        setMessages([...newMessages, { role: 'assistant', content: 'Connection error. Make sure your GITHUB_TOKEN is set in .env.local.' }])
      }
    } finally {
      setStreaming(false)
      abortRef.current = null
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  async function copyMessage(content: string, idx: number) {
    await navigator.clipboard.writeText(content)
    setCopied(idx)
    setTimeout(() => setCopied(null), 2000)
  }

  function clearConversation() {
    if (streaming) {
      abortRef.current?.abort()
      setStreaming(false)
    }
    setMessages([])
  }

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-white font-semibold">FinanceOS AI</h1>
            <p className="text-xs text-slate-500">Powered by GPT-4o via GitHub Models</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button onClick={clearConversation} className="flex items-center gap-2 text-sm text-[#94A3B8] hover:text-white transition-colors px-3 py-1.5 hover:bg-[#1E293B] rounded-xl">
            <RefreshCw className="w-4 h-4" /> New Chat
          </button>
        )}
      </div>

      {/* Context indicator */}
      {initialContext && (
        <div className="flex items-start gap-2 bg-indigo-600/10 border border-indigo-500/20 rounded-xl px-3 py-2 mb-4">
          <Info className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
          <p className="text-xs text-indigo-300">AI has access to your current financial snapshot for personalized advice.</p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {messages.length === 0 && (
          <div className="space-y-6">
            <div className="text-center py-8">
              <Sparkles className="w-12 h-12 text-indigo-500 mx-auto mb-3" />
              <h2 className="text-xl font-semibold text-white mb-1">Ask me anything about your finances</h2>
              <p className="text-slate-400 text-sm">I'm specialized in H1B finances, US taxes, and immigrant financial planning.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {STARTER_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="text-left text-sm text-[#CBD5E1] bg-[#1E293B] hover:bg-[#334155] border border-[#1E293B] hover:border-[#334155] rounded-xl px-4 py-3 transition-all"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-indigo-600' : 'bg-[#1E293B] border border-[#334155]'}`}>
              {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-emerald-400" />}
            </div>
            <div className={`group relative max-w-[85%] ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-[#1E293B] border border-[#334155] text-[#E2E8F0]'} rounded-2xl ${msg.role === 'user' ? 'rounded-tr-sm' : 'rounded-tl-sm'} px-4 py-3`}>
              <div className="text-sm whitespace-pre-wrap leading-relaxed">
                {msg.content}
                {streaming && idx === messages.length - 1 && msg.role === 'assistant' && (
                  <span className="inline-block w-2 h-4 bg-emerald-400 ml-0.5 animate-pulse rounded-sm" />
                )}
              </div>
              {msg.content && !streaming && (
                <button
                  onClick={() => copyMessage(msg.content, idx)}
                  className="absolute top-2 right-2 transition-opacity p-1 hover:bg-[#334155] rounded-xl"
                >
                  {copied === idx ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-500" />}
                </button>
              )}
            </div>
          </motion.div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="relative">
        <div className="flex items-end gap-3 bg-[#1E293B] border border-[#334155] focus-within:border-indigo-500 rounded-2xl px-4 py-3 transition-colors">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Ask about your H1B finances, taxes, goals..."
            className="flex-1 bg-transparent text-white resize-none focus:outline-none text-sm placeholder:text-slate-500 max-h-32"
            style={{ lineHeight: '1.5' }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || streaming}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
        <p className="text-xs text-slate-600 text-center mt-2">AI can make mistakes. Verify with a qualified tax advisor for financial decisions.</p>
      </div>
    </div>
  )
}
