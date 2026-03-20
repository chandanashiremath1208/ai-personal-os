'use client'

import { createClient } from '@utils/supabase/client'
import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  Search, Loader2, Sparkles, Copy, Check, Download,
  Clock, Trash2, ChevronDown, ChevronUp, Send
} from 'lucide-react'

interface HistoryItem {
  id: string
  query: string
  answer: string
  date: string
}

export default function ResearchPage() {
  const [user, setUser] = useState<any>(null)
  const [query, setQuery] = useState('')
  const [answer, setAnswer] = useState('')
  const [researching, setResearching] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        const saved = localStorage.getItem(`research-history-${user.id}`)
        if (saved) { try { setHistory(JSON.parse(saved)) } catch {} }
      }
    }
    init()
  }, [])

  const saveHistory = (items: HistoryItem[]) => {
    setHistory(items)
    if (user) localStorage.setItem(`research-history-${user.id}`, JSON.stringify(items.slice(0, 20)))
  }

  const handleResearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    setResearching(true)
    setError('')
    setAnswer('')

    try {
      const res = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Something went wrong.')
      } else {
        setAnswer(data.answer)
        const newItem: HistoryItem = {
          id: Date.now().toString(), query, answer: data.answer,
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        }
        saveHistory([newItem, ...history])
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.')
    } finally {
      setResearching(false)
    }
  }

  const handleCopy = () => { navigator.clipboard.writeText(answer); setCopied(true); setTimeout(() => setCopied(false), 2000) }

  const handleDownload = () => {
    const blob = new Blob([`# Research: ${query}\n\n${answer}`], { type: 'text/markdown' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `research_${query.replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 40)}.md`
    a.click()
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">AI</span> Research
        </h1>
        <p className="text-slate-400 text-sm sm:text-base">Ask any question and get AI-powered answers with sources and citations.</p>
      </div>

      {/* Input Form */}
      <div className="bg-slate-900/50 dark:bg-slate-900/50 bg-white border border-slate-800 dark:border-slate-800 border-gray-200 rounded-2xl p-4 sm:p-6 shadow-xl">
        <form onSubmit={handleResearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text" value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask any research question..."
              className="w-full h-12 sm:h-14 bg-slate-950/50 dark:bg-slate-950/50 bg-gray-50 border border-slate-800 dark:border-slate-800 border-gray-300 rounded-xl sm:rounded-2xl pl-12 pr-5 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all outline-none text-sm sm:text-base"
              required
            />
          </div>
          <button type="submit" disabled={researching}
            className="h-12 sm:h-14 px-6 sm:px-8 text-sm sm:text-base font-bold rounded-xl sm:rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-[0_0_20px_-5px_rgba(168,85,247,0.4)] transition-all transform hover:-translate-y-0.5 flex items-center justify-center whitespace-nowrap gap-2 disabled:opacity-70 disabled:hover:translate-y-0 cursor-pointer"
          >
            {researching ? <><Loader2 className="w-5 h-5 animate-spin" /> Researching...</> : <><Send className="w-5 h-5" /> Research</>}
          </button>
        </form>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-5 p-4 bg-red-950/50 border border-red-900 text-red-400 text-sm rounded-2xl flex items-start gap-3">
          <span className="text-lg leading-none">⚠</span><span>{error}</span>
        </div>
      )}

      {/* Skeleton Loading */}
      {researching && (
        <div className="mt-6 bg-slate-900/50 border border-slate-800 rounded-2xl p-6 sm:p-8 animate-pulse space-y-4">
          <div className="space-y-3">
            {[100, 83, 66, 100, 75, 83].map((w, i) => <div key={i} className="h-3 bg-slate-800 rounded" style={{ width: `${w}%` }} />)}
          </div>
          <div className="flex items-center justify-center gap-3 pt-4">
            <Sparkles className="w-5 h-5 text-purple-500/50 animate-spin" />
            <p className="text-slate-500 text-sm">AI is researching your question...</p>
          </div>
        </div>
      )}

      {/* Answer */}
      {answer && !researching && (
        <div className="mt-5 bg-slate-900/50 dark:bg-slate-900/50 bg-white border border-slate-800 dark:border-slate-800 border-gray-200 rounded-2xl p-5 sm:p-8 shadow-xl">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              <h2 className="text-lg sm:text-xl font-bold">Research Result</h2>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleDownload} className="flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 cursor-pointer">
                <Download className="w-4 h-4" /> Download
              </button>
              <button onClick={handleCopy} className="flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 cursor-pointer">
                {copied ? <><Check className="w-4 h-4 text-emerald-400" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy</>}
              </button>
            </div>
          </div>
          <div className="prose prose-invert prose-sm max-w-none prose-headings:text-slate-100 prose-headings:font-bold prose-h2:text-lg prose-h2:mt-6 prose-h2:mb-3 prose-h2:border-b prose-h2:border-slate-800 prose-h2:pb-2 prose-p:text-slate-300 prose-p:leading-relaxed prose-li:text-slate-300 prose-strong:text-slate-100 prose-ul:my-2 prose-ol:my-2 prose-a:text-purple-400">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{answer}</ReactMarkdown>
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="mt-8">
          <button onClick={() => setShowHistory(!showHistory)} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4 cursor-pointer">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-semibold">Recent Researches ({history.length})</span>
            {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {showHistory && (
            <div className="space-y-3">
              {history.map((item) => (
                <div key={item.id} className="bg-slate-900/40 border border-slate-800/50 rounded-xl p-4 flex gap-3 items-center group hover:border-slate-700 transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                    <Search className="w-4 h-4 text-purple-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold truncate cursor-pointer hover:text-purple-400 transition-colors"
                      onClick={() => { setQuery(item.query); setAnswer(item.answer); setError(''); }}>
                      {item.query}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">{item.date}</p>
                  </div>
                  <button onClick={() => saveHistory(history.filter(h => h.id !== item.id))} className="text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
