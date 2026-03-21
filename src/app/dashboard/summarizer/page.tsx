'use client'

import { createClient } from '@utils/supabase/client'
import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  Loader2, Link2, Sparkles, Copy, Check,
  Youtube, Download, Clock, Trash2, ChevronDown, ChevronUp, FileText, BookmarkCheck
} from 'lucide-react'

interface VideoMeta {
  title: string
  author: string
  thumbnail: string
}

interface HistoryItem {
  id: string
  url: string
  summary: string
  videoMeta: VideoMeta
  date: string
}

export default function SummarizerPage() {
  const [user, setUser] = useState<any>(null)
  const [url, setUrl] = useState('')
  const [summary, setSummary] = useState('')
  const [videoMeta, setVideoMeta] = useState<VideoMeta | null>(null)
  const [summarizing, setSummarizing] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [savedAsNote, setSavedAsNote] = useState(false)
  const [savingNote, setSavingNote] = useState(false)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        const saved = localStorage.getItem(`yt-history-${user.id}`)
        if (saved) { try { setHistory(JSON.parse(saved)) } catch {} }
      }
    }
    init()
  }, [])

  const saveHistory = (items: HistoryItem[]) => {
    setHistory(items)
    if (user) localStorage.setItem(`yt-history-${user.id}`, JSON.stringify(items.slice(0, 20)))
  }

  const extractVideoId = (url: string) => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
      /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
      /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    ]
    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) return match[1]
    }
    return null
  }

  const fetchTranscriptClientSide = async (videoId: string) => {
    // Round 5: Multi-Relay Strategy
    // Try a dedicated REST API first (highest reliability for transcripts)
    try {
      console.log(`[Summarizer] Attempting dedicated Transcript API for: ${videoId}`)
      const res = await fetch(`https://yt-transcript-api.vercel.app/api/transcript?videoId=${videoId}`)
      if (res.ok) {
        const data = await res.json()
        if (data && data.transcript) {
          console.log('[Summarizer] Success! Transcript fetched via dedicated API.')
          return data.transcript.map((t: any) => t.text).join(' ')
        }
      }
    } catch (e) { console.warn('[Summarizer] Dedicated API failed.') }

    // Backup proxies - using different strategies
    const proxies = [
      // Strategy 1: AllOrigins RAW (more reliable than JSON wrapper)
      (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
      // Strategy 2: CorsProxy.io
      (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
      // Strategy 3: ThingProxy
      (url: string) => `https://thingproxy.freeboard.io/fetch/${url}`,
      // Strategy 4: CodeTabs
      (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`
    ]

    for (const getProxyUrl of proxies) {
      try {
        console.log(`[Summarizer] Trying proxy strategy: ${getProxyUrl('YouTube-URL')}`)
        const response = await fetch(getProxyUrl(`https://www.youtube.com/watch?v=${videoId}`))
        if (!response.ok) continue
        
        const html = await response.text()
        if (!html || html.length < 500) continue

        // Extract player data
        const playerMatch = html.match(/ytInitialPlayerResponse\s*=\s*({[\s\S]+?})(?:\s*;|\s*\n|\s*<script)/)
        const dataMatch = html.match(/ytInitialData\s*=\s*({[\s\S]+?})(?:\s*;|\s*\n|\s*<script)/)
        
        let playerResponse = null
        try {
          if (playerMatch) playerResponse = JSON.parse(playerMatch[1])
          else if (dataMatch) {
            const initialData = JSON.parse(dataMatch[1])
            playerResponse = initialData.playerResponse || initialData
          }
        } catch (e) { continue }

        const captionTracks = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks || 
                            playerResponse?.playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks

        if (captionTracks && captionTracks.length > 0) {
          const track = captionTracks.find((t: any) => t.languageCode === 'en' && !t.kind) || 
                        captionTracks.find((t: any) => t.languageCode === 'en') || 
                        captionTracks[0]
          
          console.log(`[Summarizer] Found captions. Fetching XML via proxy...`)
          const transcriptRes = await fetch(getProxyUrl(track.baseUrl))
          if (!transcriptRes.ok) continue

          const transcriptXml = await transcriptRes.text()
          if (!transcriptXml || !transcriptXml.includes('<text')) continue

          const textMatches = transcriptXml.matchAll(/<text[^>]*>([^<]*)<\/text>/g)
          const lines = []
          for (const match of textMatches) {
            lines.push(match[1]
              .replace(/&amp;/g, '&')
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>')
              .replace(/&#39;/g, "'")
              .replace(/&quot;/g, '"')
              .replace(/\n/g, ' ')
            )
          }
          const text = lines.join(' ').replace(/\s+/g, ' ').trim()
          if (text && text.length > 20) {
            console.log('[Summarizer] Success! Transcript extracted via proxy relay.')
            return text
          }
        }
      } catch (e) {
        console.warn('[Summarizer] Proxy attempt failed.', e)
      }
    }
    return null
  }

  const handleSummarize = async (e: React.FormEvent) => {
    e.preventDefault()
    setSummarizing(true)
    setError('')
    setSummary('')
    setVideoMeta(null)

    try {
      // Attempt 1: Normal server-side fetch
      let res = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      
      let data = await res.json()

      // Attempt 2: If server is blocked (403 or specific error), try client-side fetch + CORS proxy
      if (!res.ok && (res.status === 403 || data.error?.includes('BLOCKING'))) {
        const videoId = extractVideoId(url)
        if (videoId) {
          console.log('Server blocked (Round 3). Trying client-side fallback with multi-proxy...')
          const clientTranscript = await fetchTranscriptClientSide(videoId)
          if (clientTranscript) {
            console.log('Client-side transcript fetched successfully! Sending back for AI summary...')
            res = await fetch('/api/summarize', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url, transcript: clientTranscript }),
            })
            data = await res.json()
          }
        }
      }

      if (data.videoMeta) setVideoMeta(data.videoMeta)
      if (!res.ok) {
        setError(data.error || 'The video transcript could not be reached. Many creators disable captions for international IPs, and search engines are blocking automated access. Please try a different video or check if captions are enabled on YouTube.')
      } else {
        setSummary(data.summary)
        const newItem: HistoryItem = {
          id: Date.now().toString(), url, summary: data.summary,
          videoMeta: data.videoMeta,
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        }
        saveHistory([newItem, ...history])
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.')
    } finally {
      setSummarizing(false)
    }
  }

  const handleCopy = () => { navigator.clipboard.writeText(summary); setCopied(true); setTimeout(() => setCopied(false), 2000) }

  const handleDownload = () => {
    const title = videoMeta?.title || 'YouTube Video'
    const blob = new Blob([`# ${title}\n\n${summary}`], { type: 'text/markdown' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_summary.md`
    a.click()
  }

  const handleSaveAsNote = async () => {
    if (!summary) return
    setSavingNote(true)
    try {
      const title = `📺 ${videoMeta?.title || 'YouTube Summary'}`
      const content = `**Source:** ${url}\n**Channel:** ${videoMeta?.author || 'Unknown'}\n\n---\n\n${summary}`
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      })
      if (res.ok) {
        setSavedAsNote(true)
        setTimeout(() => setSavedAsNote(false), 3000)
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to save note')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save note')
    } finally {
      setSavingNote(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">YouTube</span> Summarizer
        </h1>
        <p className="text-slate-400 text-sm sm:text-base">Paste a YouTube URL and get an AI-powered summary in seconds.</p>
      </div>

      {/* Input Form */}
      <div className="bg-slate-900/50 dark:bg-slate-900/50 bg-white border border-slate-800 dark:border-slate-800 border-gray-200 rounded-2xl p-4 sm:p-6 shadow-xl">
        <form onSubmit={handleSummarize} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="url" value={url} onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full h-12 sm:h-14 bg-slate-950/50 dark:bg-slate-950/50 bg-gray-50 border border-slate-800 dark:border-slate-800 border-gray-300 rounded-xl sm:rounded-2xl pl-12 pr-5 focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all outline-none text-sm sm:text-base"
              required
            />
          </div>
          <button type="submit" disabled={summarizing}
            className="h-12 sm:h-14 px-6 sm:px-8 text-sm sm:text-base font-bold rounded-xl sm:rounded-2xl bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white shadow-[0_0_20px_-5px_rgba(239,68,68,0.4)] transition-all transform hover:-translate-y-0.5 flex items-center justify-center whitespace-nowrap gap-2 disabled:opacity-70 disabled:hover:translate-y-0 cursor-pointer"
          >
            {summarizing ? <><Loader2 className="w-5 h-5 animate-spin" /> Summarizing...</> : <><Sparkles className="w-5 h-5" /> Summarize</>}
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
      {summarizing && (
        <div className="mt-6 space-y-4">
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 flex gap-4 animate-pulse">
            <div className="w-32 h-20 bg-slate-800 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-3 pt-1"><div className="h-4 bg-slate-800 rounded w-3/4" /><div className="h-3 bg-slate-800 rounded w-1/2" /></div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 sm:p-8 animate-pulse space-y-4">
            <div className="space-y-3">
              {[100, 83, 66, 100, 75, 83, 66].map((w, i) => <div key={i} className="h-3 bg-slate-800 rounded" style={{ width: `${w}%` }} />)}
            </div>
            <div className="flex items-center justify-center gap-3 pt-4">
              <Sparkles className="w-5 h-5 text-red-500/50 animate-spin" />
              <p className="text-slate-500 text-sm">AI is analyzing the transcript...</p>
            </div>
          </div>
        </div>
      )}

      {/* Video Meta */}
      {videoMeta && !summarizing && (
        <div className="mt-5 bg-slate-900/50 dark:bg-slate-900/50 bg-white border border-slate-800 dark:border-slate-800 border-gray-200 rounded-2xl p-4 flex gap-4 items-center">
          <img src={videoMeta.thumbnail} alt={videoMeta.title} className="w-28 sm:w-36 h-20 sm:h-24 object-cover rounded-xl flex-shrink-0 border border-slate-700" />
          <div className="min-w-0">
            <h3 className="font-bold text-sm sm:text-base line-clamp-2 leading-snug">{videoMeta.title}</h3>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">{videoMeta.author}</p>
          </div>
        </div>
      )}

      {/* Summary Result */}
      {summary && !summarizing && (
        <div className="mt-4 bg-slate-900/50 dark:bg-slate-900/50 bg-white border border-slate-800 dark:border-slate-800 border-gray-200 rounded-2xl p-5 sm:p-8 shadow-xl">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Youtube className="w-5 h-5 text-red-500" />
              <h2 className="text-lg sm:text-xl font-bold">Video Summary</h2>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={handleSaveAsNote} disabled={savingNote || savedAsNote}
                className={`flex items-center gap-1.5 text-sm font-medium transition-colors px-3 py-1.5 rounded-lg cursor-pointer ${
                  savedAsNote ? 'bg-emerald-500/20 text-emerald-400' : 'text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20'
                }`}
              >
                {savingNote ? <Loader2 className="w-4 h-4 animate-spin" /> : savedAsNote ? <BookmarkCheck className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                {savedAsNote ? 'Saved!' : 'Save as Note'}
              </button>
              <button onClick={handleDownload} className="flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 cursor-pointer">
                <Download className="w-4 h-4" /> Download
              </button>
              <button onClick={handleCopy} className="flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 cursor-pointer">
                {copied ? <><Check className="w-4 h-4 text-emerald-400" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy</>}
              </button>
            </div>
          </div>
          <div className="prose prose-invert prose-sm max-w-none prose-headings:text-slate-100 prose-headings:font-bold prose-h2:text-lg prose-h2:mt-6 prose-h2:mb-3 prose-h2:border-b prose-h2:border-slate-800 prose-h2:pb-2 prose-p:text-slate-300 prose-p:leading-relaxed prose-li:text-slate-300 prose-strong:text-slate-100 prose-ul:my-2 prose-ol:my-2">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{summary}</ReactMarkdown>
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="mt-8">
          <button onClick={() => setShowHistory(!showHistory)} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4 cursor-pointer">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-semibold">Recent Summaries ({history.length})</span>
            {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {showHistory && (
            <div className="space-y-3">
              {history.map((item) => (
                <div key={item.id} className="bg-slate-900/40 border border-slate-800/50 rounded-xl p-4 flex gap-3 items-center group hover:border-slate-700 transition-colors">
                  {item.videoMeta?.thumbnail && <img src={item.videoMeta.thumbnail} alt="" className="w-20 h-14 object-cover rounded-lg flex-shrink-0 border border-slate-700/50" />}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold truncate cursor-pointer hover:text-red-400 transition-colors" onClick={() => { setUrl(item.url); setSummary(item.summary); setVideoMeta(item.videoMeta); setError('') }}>
                      {item.videoMeta?.title || 'YouTube Video'}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">{item.videoMeta?.author} · {item.date}</p>
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
