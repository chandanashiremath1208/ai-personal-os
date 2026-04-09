'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Play, Sparkles, Youtube, FileText, Search, 
  ArrowRight, Shield, Globe, Zap, Loader2
} from 'lucide-react'
import { motion } from 'framer-motion'

export default function LandingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkUser = async () => {
      try {
        const supabase = createClient()
        const { data: { user }, error } = await supabase.auth.getUser()
        if (user && !error) {
          router.push('/dashboard')
        } else {
          setLoading(false)
        }
      } catch (error) {
        console.error('Supabase auth error (project might be paused):', error)
        setLoading(false)
      }
    }
    checkUser()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-red-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-red-500/30 overflow-hidden relative flex flex-col">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-red-900/10 blur-[120px] rounded-full pointer-events-none -z-10"></div>
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-900/10 blur-[120px] rounded-full pointer-events-none -z-10"></div>

      {/* Navigation */}
      <nav className="border-b border-slate-800/50 bg-slate-900/30 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-lg shadow-red-500/20">
                <Play className="w-4 h-4 text-white ml-0.5" />
              </div>
              <span className="font-bold text-lg tracking-tight">Personal OS</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-sm font-medium hover:text-red-400 transition-colors">
                Sign In
              </Link>
              <Link 
                href="/login" 
                className="h-9 px-4 text-sm font-semibold rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-900 shadow-sm transition-all transform hover:-translate-y-0.5 flex items-center justify-center"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/50 border border-slate-700 backdrop-blur-sm mb-6">
            <Sparkles className="w-4 h-4 text-orange-400" />
            <span className="text-sm font-medium text-slate-300 italic">Next Gen Personal Intelligence</span>
          </div>

          <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1]">
            Your AI <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">Personal OS</span>.
          </h1>

          <p className="text-lg lg:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            A unified workspace to summarize content, manage knowledge, and perform deep research—all protected by your private vault.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-5">
            <Link 
              href="/login" 
              className="w-full sm:w-auto h-14 px-10 text-lg font-bold rounded-2xl bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white shadow-[0_0_20px_-5px_rgba(239,68,68,0.4)] transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              Access Your OS
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </motion.div>

        {/* Feature Cards Grid - Matches Dashboard Style */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto w-full">
          {[
            { title: 'YouTube Summarizer', desc: 'Paste URLs, get instant AI summaries and save them as notes.', icon: Youtube, color: 'text-red-500', bg: 'bg-red-500/10' },
            { title: 'Smart Notes', desc: 'A full CRUD knowledge base with AI search built into every page.', icon: FileText, color: 'text-blue-500', bg: 'bg-blue-500/10' },
            { title: 'AI Research', desc: 'Perform deep research with structured facts and cited web sources.', icon: Search, color: 'text-purple-500', bg: 'bg-purple-500/10' },
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all text-left group"
            >
              <div className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                <feature.icon className={`w-6 h-6 ${feature.color}`} />
              </div>
              <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </main>

      <footer className="border-t border-slate-800/50 bg-slate-900/30 py-8">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center">
              <Play className="w-3.5 h-3.5 text-white ml-0.5" />
            </div>
            <span className="font-bold text-slate-200">Personal OS</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> Secure Vault</span>
            <span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> Cloud Sync</span>
            <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" /> Real-time AI</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
