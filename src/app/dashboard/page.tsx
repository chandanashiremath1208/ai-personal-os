'use client'

import { createClient } from '@utils/supabase/client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Youtube, FileText, Search, Sparkles, Clock, ArrowRight,
  Play, TrendingUp, Zap
} from 'lucide-react'

interface RecentItem {
  type: 'summary' | 'note' | 'research'
  title: string
  date: string
  preview: string
}

export default function DashboardHome() {
  const [user, setUser] = useState<any>(null)
  const [recentItems, setRecentItems] = useState<RecentItem[]>([])
  const [stats, setStats] = useState({ summaries: 0, notes: 0, researches: 0 })

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)

        // Load stats from localStorage
        const history = localStorage.getItem(`yt-history-${user.id}`)
        const parsedHistory = history ? JSON.parse(history) : []
        setStats(prev => ({ ...prev, summaries: parsedHistory.length }))

        // Load recent items
        const recent: RecentItem[] = parsedHistory.slice(0, 3).map((h: any) => ({
          type: 'summary' as const,
          title: h.videoMeta?.title || 'YouTube Video',
          date: h.date,
          preview: h.summary?.substring(0, 100) + '...'
        }))
        setRecentItems(recent)
      }
    }
    init()
  }, [])

  const displayName = user?.user_metadata?.full_name?.split(' ')[0] || 'there'

  const tools = [
    {
      href: '/dashboard/summarizer',
      icon: Youtube,
      title: 'YouTube Summarizer',
      description: 'Paste any YouTube URL and get an AI-generated summary of the video content in seconds.',
      color: 'from-red-500 to-orange-500',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/20',
      iconColor: 'text-red-500',
    },
    {
      href: '/dashboard/notes',
      icon: FileText,
      title: 'Notes',
      description: 'Create, edit, and organize your notes with a rich text editor. All synced to the cloud.',
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
      iconColor: 'text-blue-500',
    },
    {
      href: '/dashboard/research',
      icon: Search,
      title: 'AI Research',
      description: 'Ask any question and get AI-powered answers with web sources and citations.',
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20',
      iconColor: 'text-purple-500',
    },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
          Hey {displayName} <span className="inline-block animate-bounce">👋</span>
        </h1>
        <p className="text-slate-400 dark:text-slate-400 text-sm sm:text-base">
          Welcome to your AI Personal OS. Choose a tool to get started.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-8">
        {[
          { label: 'Summaries', value: stats.summaries, icon: Youtube, color: 'text-red-500' },
          { label: 'Notes', value: stats.notes, icon: FileText, color: 'text-blue-500' },
          { label: 'Researches', value: stats.researches, icon: Search, color: 'text-purple-500' },
        ].map((stat) => (
          <div key={stat.label} className="bg-slate-900/50 dark:bg-slate-900/50 bg-white border border-slate-800 dark:border-slate-800 border-gray-200 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center">
            <stat.icon className={`w-5 h-5 ${stat.color} mx-auto mb-1.5`} />
            <p className="text-xl sm:text-2xl font-bold">{stat.value}</p>
            <p className="text-xs text-slate-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Tool Cards */}
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Zap className="w-5 h-5 text-orange-500" />
        Your Tools
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        {tools.map((tool) => {
          const Icon = tool.icon
          return (
            <Link
              key={tool.href}
              href={tool.href}
              className={`group relative overflow-hidden rounded-2xl border ${tool.borderColor} dark:${tool.borderColor} border-gray-200 bg-slate-900/30 dark:bg-slate-900/30 bg-white p-5 sm:p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl`}
            >
              <div className={`absolute top-0 right-0 w-32 h-32 ${tool.bgColor} blur-[60px] rounded-full pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity`} />
              <div className={`w-11 h-11 rounded-xl ${tool.bgColor} flex items-center justify-center mb-4 relative`}>
                <Icon className={`w-5 h-5 ${tool.iconColor}`} />
              </div>
              <h3 className="text-base font-bold mb-2 relative">{tool.title}</h3>
              <p className="text-sm text-slate-400 dark:text-slate-400 text-gray-500 relative leading-relaxed">{tool.description}</p>
              <div className={`mt-4 flex items-center gap-1 text-sm font-semibold ${tool.iconColor} relative group-hover:gap-2 transition-all`}>
                Open <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          )
        })}
      </div>

      {/* Recent Activity */}
      {recentItems.length > 0 && (
        <>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-400" />
            Recent Activity
          </h2>
          <div className="space-y-3">
            {recentItems.map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-4 rounded-xl border border-slate-800 dark:border-slate-800 border-gray-200 bg-slate-900/30 dark:bg-slate-900/30 bg-white hover:border-slate-700 transition-colors"
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0
                  ${item.type === 'summary' ? 'bg-red-500/10 text-red-500' :
                    item.type === 'note' ? 'bg-blue-500/10 text-blue-500' :
                    'bg-purple-500/10 text-purple-500'}`}
                >
                  {item.type === 'summary' ? <Youtube className="w-4 h-4" /> :
                   item.type === 'note' ? <FileText className="w-4 h-4" /> :
                   <Search className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.title}</p>
                  <p className="text-xs text-slate-500 truncate">{item.preview}</p>
                </div>
                <span className="text-xs text-slate-600 flex-shrink-0">{item.date}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Empty state */}
      {recentItems.length === 0 && (
        <div className="text-center py-12 rounded-2xl border border-dashed border-slate-800 dark:border-slate-800 border-gray-300">
          <Sparkles className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 dark:text-slate-400 text-gray-500 font-medium">No activity yet</p>
          <p className="text-sm text-slate-600 dark:text-slate-600 text-gray-400 mt-1">Start using a tool to see your recent activity here.</p>
        </div>
      )}
    </div>
  )
}
