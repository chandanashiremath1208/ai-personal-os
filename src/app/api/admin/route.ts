import { NextResponse } from 'next/server'
import { createClient } from '@utils/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all users from auth.users via Supabase admin API
    // Note: For this to work, you need the service_role key or use supabase admin
    // For now, we'll fetch data available to us

    // Get all notes to calculate stats
    const { data: allNotes, error: notesError } = await supabase
      .from('notes')
      .select('id, user_id, created_at, updated_at')

    // Get the count of unique users from notes
    const uniqueUsers = new Set((allNotes || []).map(n => n.user_id))

    // Calculate stats
    const totalNotes = allNotes?.length || 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const notesToday = (allNotes || []).filter(n => new Date(n.created_at) >= today).length

    // Weekly activity  
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const notesThisWeek = (allNotes || []).filter(n => new Date(n.created_at) >= weekAgo).length

    return NextResponse.json({
      stats: {
        totalUsers: uniqueUsers.size || 1,
        totalNotes,
        notesToday,
        notesThisWeek,
      },
      recentNotes: (allNotes || []).slice(0, 10).map(n => ({
        id: n.id,
        userId: n.user_id,
        createdAt: n.created_at,
      })),
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
