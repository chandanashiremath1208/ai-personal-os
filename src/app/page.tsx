import Link from 'next/link'
import { Play, Sparkles, Youtube, CheckCircle2 } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-red-500/30 overflow-hidden relative flex flex-col">
      <nav className="border-b border-slate-800/50 bg-slate-900/30 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-lg shadow-red-500/20">
                <Play className="w-4 h-4 text-white ml-0.5" />
              </div>
              <span className="font-bold text-lg tracking-tight">AI Summarizer</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-sm font-medium hover:text-red-400 transition-colors">
                Sign In
              </Link>
              <Link 
                href="/login" 
                className="h-9 px-4 text-sm font-semibold rounded-lg bg-white hover:bg-slate-100 text-slate-900 shadow-sm transition-all transform hover:-translate-y-0.5 flex items-center justify-center"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="relative pt-20 pb-32 lg:pt-32 lg:pb-40">
        {/* Animated background elements */}
        <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-red-900/20 blur-[120px] rounded-full pointer-events-none -z-10 animate-pulse" style={{ animationDuration: '4s' }}></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-orange-900/10 blur-[100px] rounded-full pointer-events-none -z-10"></div>
        <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] bg-purple-900/10 blur-[100px] rounded-full pointer-events-none -z-10"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/50 border border-slate-700 backdrop-blur-sm mb-8 animate-fade-in">
            <Sparkles className="w-4 h-4 text-orange-400" />
            <span className="text-sm font-medium text-slate-300">Powered by advanced AI models</span>
          </div>
          
          <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
            Summarize <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">YouTube</span><br className="hidden md:block"/> Videos instantly.
          </h1>
          
          <p className="text-lg lg:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Stop wasting time watching hour-long videos. Paste any YouTube link and get a concise, accurate summary in seconds. Powered by OpenRouter AI.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link 
              href="/login" 
              className="w-full sm:w-auto h-14 px-8 text-lg font-bold rounded-2xl bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white shadow-[0_0_20px_-5px_rgba(239,68,68,0.4)] transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              Start Summarizing for Free
              <Play className="w-5 h-5 ml-1" />
            </Link>
          </div>

          {/* Features highlight */}
          <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto border-t border-slate-800/50 pt-16">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4 shadow-xl">
                <Youtube className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-lg font-bold mb-2">Works with any Video</h3>
              <p className="text-slate-400 text-sm">Long podcasts, tutorials, or lectures. If it has a transcript, we can summarize it.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4 shadow-xl">
                <Sparkles className="w-6 h-6 text-orange-500" />
              </div>
              <h3 className="text-lg font-bold mb-2">Smart AI Models</h3>
              <p className="text-slate-400 text-sm">Using state-of-the-art LLMs via OpenRouter to extract the most important insights.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4 shadow-xl">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              </div>
              <h3 className="text-lg font-bold mb-2">Save Hours</h3>
              <p className="text-slate-400 text-sm">Extract key takeaways and action items in seconds instead of watching in 1x speed.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center">
                <Play className="w-3 h-3 text-white ml-0.5" />
              </div>
              <span className="text-sm font-semibold text-slate-400">AI YouTube Summarizer</span>
            </div>
            <p className="text-xs text-slate-600">
              Powered by OpenRouter AI · Built with Next.js & Supabase
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
