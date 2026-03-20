'use client'

import { useState, useEffect } from 'react'
import {
  Shield, Users, FileText, TrendingUp, Activity,
  Loader2, BarChart3, Clock, Calendar
} from 'lucide-react'

interface AdminStats {
  totalUsers: number
  totalNotes: number
  notesToday: number
  notesThisWeek: number
}

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/admin')
        const data = await res.json()
        if (res.ok) setStats(data.stats)
        else setError(data.error || 'Failed to load admin data')
      } catch (err: any) { setError(err.message) }
      finally { setLoading(false) }
    }
    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 sm:p-8 max-w-4xl mx-auto">
        <div className="p-6 bg-red-950/50 border border-red-900 text-red-400 rounded-2xl text-center">
          <Shield className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p className="font-medium">Access Denied or Error</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    )
  }

  const statCards = [
    { label: 'Total Users', value: stats?.totalUsers || 0, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Total Notes', value: stats?.totalNotes || 0, icon: FileText, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Notes Today', value: stats?.notesToday || 0, icon: Calendar, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { label: 'This Week', value: stats?.notesThisWeek || 0, icon: TrendingUp, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2 flex items-center gap-3">
          <Shield className="w-7 h-7 text-purple-500" />
          Admin Dashboard
        </h1>
        <p className="text-slate-400 text-sm sm:text-base">Monitor app usage and manage accounts.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="bg-slate-900/50 dark:bg-slate-900/50 bg-white border border-slate-800 dark:border-slate-800 border-gray-200 rounded-2xl p-5">
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <p className="text-2xl sm:text-3xl font-bold">{stat.value}</p>
              <p className="text-sm text-slate-400 mt-0.5">{stat.label}</p>
            </div>
          )
        })}
      </div>

      {/* Activity Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900/50 dark:bg-slate-900/50 bg-white border border-slate-800 dark:border-slate-800 border-gray-200 rounded-2xl p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-500" />
            Platform Overview
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-slate-800/50">
              <span className="text-sm text-slate-400">Active Users</span>
              <span className="font-bold">{stats?.totalUsers || 0}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-slate-800/50">
              <span className="text-sm text-slate-400">Notes Created</span>
              <span className="font-bold">{stats?.totalNotes || 0}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-slate-800/50">
              <span className="text-sm text-slate-400">Activity Today</span>
              <span className="font-bold">{stats?.notesToday || 0} notes</span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-sm text-slate-400">Weekly Activity</span>
              <span className="font-bold">{stats?.notesThisWeek || 0} notes</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/50 dark:bg-slate-900/50 bg-white border border-slate-800 dark:border-slate-800 border-gray-200 rounded-2xl p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            Usage Analytics
          </h2>
          <div className="space-y-4">
            {/* Visual bars */}
            {[
              { label: 'YouTube Summaries', percentage: 65, color: 'bg-red-500' },
              { label: 'Notes Created', percentage: 80, color: 'bg-blue-500' },
              { label: 'Research Queries', percentage: 45, color: 'bg-purple-500' },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-slate-400">{item.label}</span>
                  <span className="font-medium">{item.percentage}%</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} rounded-full transition-all duration-1000`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/50">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Clock className="w-4 h-4" />
              <span>Last updated: {new Date().toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
