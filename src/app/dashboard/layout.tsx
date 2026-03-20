'use client'

import { createClient } from '@utils/supabase/client'
import { useState, useEffect, createContext, useContext } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  Play, LogOut, Loader2, Home, Youtube, FileText, Search,
  Shield, Menu, X, Sun, Moon, User, ChevronRight
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface UserContextType {
  user: any
  isAdmin: boolean
}

const UserContext = createContext<UserContextType>({ user: null, isAdmin: false })
export const useUser = () => useContext(UserContext)

const navItems = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/dashboard/summarizer', label: 'YouTube Summarizer', icon: Youtube },
  { href: '/dashboard/notes', label: 'Notes', icon: FileText },
  { href: '/dashboard/research', label: 'AI Research', icon: Search },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)

      // Check if user is admin (based on email or metadata)
      const adminEmails = ['chandanashiremath@gmail.com'] // Add your admin emails here
      const userIsAdmin = adminEmails.includes(user.email || '') || user.user_metadata?.role === 'admin'
      setIsAdmin(userIsAdmin)

      setLoading(false)
    }
    getUser()

    // Load theme preference
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'light') setDarkMode(false)
  }, [])

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
      document.documentElement.classList.remove('light')
    } else {
      document.documentElement.classList.remove('dark')
      document.documentElement.classList.add('light')
    }
    localStorage.setItem('theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 dark:bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-red-500" />
          <p className="text-slate-400 text-sm">Loading your workspace...</p>
        </div>
      </div>
    )
  }

  const avatarUrl = user?.user_metadata?.avatar_url
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'

  return (
    <UserContext.Provider value={{ user, isAdmin }}>
      <div className={`min-h-screen flex ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-gray-50 text-gray-900'} font-sans transition-colors duration-300`}>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Sidebar */}
        <aside className={`
          fixed lg:sticky top-0 left-0 z-50 h-screen w-64 flex-shrink-0
          ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} border-r
          flex flex-col transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          {/* Logo */}
          <div className={`h-16 flex items-center justify-between px-5 border-b ${darkMode ? 'border-slate-800' : 'border-gray-200'}`}>
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-lg shadow-red-500/20">
                <Play className="w-4 h-4 text-white ml-0.5" />
              </div>
              <span className="font-bold text-lg tracking-tight">Personal OS</span>
            </Link>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group
                    ${isActive
                      ? `${darkMode ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600'} shadow-sm`
                      : `${darkMode ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`
                    }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? '' : 'group-hover:scale-110'} transition-transform`} />
                  {item.label}
                  {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                </Link>
              )
            })}

            {/* Admin link */}
            {isAdmin && (
              <>
                <div className={`my-3 border-t ${darkMode ? 'border-slate-800' : 'border-gray-200'}`} />
                <Link
                  href="/dashboard/admin"
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                    ${pathname.startsWith('/dashboard/admin')
                      ? `${darkMode ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-50 text-purple-600'}`
                      : `${darkMode ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`
                    }`}
                >
                  <Shield className="w-5 h-5" />
                  Admin Panel
                </Link>
              </>
            )}
          </nav>

          {/* User profile & theme toggle */}
          <div className={`p-3 border-t ${darkMode ? 'border-slate-800' : 'border-gray-200'}`}>
            {/* Theme toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium mb-2 transition-colors cursor-pointer
                ${darkMode ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              {darkMode ? 'Light Mode' : 'Dark Mode'}
            </button>

            {/* User info */}
            <div className={`flex items-center gap-3 px-3 py-2 rounded-xl ${darkMode ? 'bg-slate-800/50' : 'bg-gray-100'}`}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-8 h-8 rounded-full border-2 border-slate-600" referrerPolicy="no-referrer" />
              ) : (
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${darkMode ? 'bg-slate-700' : 'bg-gray-300'}`}>
                  <User className="w-4 h-4" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{displayName}</p>
                <p className={`text-xs truncate ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>{user?.email}</p>
              </div>
              <button
                onClick={handleSignOut}
                className={`${darkMode ? 'text-slate-500 hover:text-red-400' : 'text-gray-400 hover:text-red-500'} transition-colors cursor-pointer`}
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>

        {/* Main content area */}
        <div className="flex-1 flex flex-col min-h-screen min-w-0">
          {/* Top bar (mobile) */}
          <header className={`lg:hidden h-14 flex items-center justify-between px-4 border-b ${darkMode ? 'border-slate-800 bg-slate-900/80' : 'border-gray-200 bg-white/80'} backdrop-blur-md sticky top-0 z-30`}>
            <button onClick={() => setSidebarOpen(true)} className="cursor-pointer">
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center">
                <Play className="w-3.5 h-3.5 text-white ml-0.5" />
              </div>
              <span className="font-bold text-sm">Personal OS</span>
            </div>
            <button onClick={() => setDarkMode(!darkMode)} className="cursor-pointer">
              {darkMode ? <Sun className="w-5 h-5 text-slate-400" /> : <Moon className="w-5 h-5 text-gray-500" />}
            </button>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-y-auto relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="min-h-full"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </UserContext.Provider>
  )
}
