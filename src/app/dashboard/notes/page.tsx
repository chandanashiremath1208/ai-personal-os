'use client'

import { useState, useEffect } from 'react'
import {
  FileText, Plus, Edit3, Trash2, Save, X, Loader2,
  Bold, Italic, List, Heading, Clock, Search, Sparkles, Wand2
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'

interface Note {
  id: string
  title: string
  content: string
  created_at: string
  updated_at: string
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [aiQuery, setAiQuery] = useState('')
  const [aiSearching, setAiSearching] = useState(false)
  const [aiAnswer, setAiAnswer] = useState('')
  const [isAiMode, setIsAiMode] = useState(false)
  const [mentionedIds, setMentionedIds] = useState<string[]>([])
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [error, setError] = useState('')

  useEffect(() => { fetchNotes() }, [])

  const fetchNotes = async () => {
    try {
      const res = await fetch('/api/notes')
      const data = await res.json()
      if (res.ok) setNotes(data.notes || [])
      else setError(data.error)
    } catch (err: any) { setError(err.message) }
    finally { setLoading(false) }
  }

  const handleCreate = async () => {
    if (!editTitle.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitle, content: editContent }),
      })
      const data = await res.json()
      if (res.ok) {
        setNotes([data.note, ...notes])
        setSelectedNote(data.note)
        setIsCreating(false)
        setIsEditing(false)
      } else setError(data.error)
    } catch (err: any) { setError(err.message) }
    finally { setSaving(false) }
  }

  const handleUpdate = async () => {
    if (!selectedNote || !editTitle.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/notes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedNote.id, title: editTitle, content: editContent }),
      })
      const data = await res.json()
      if (res.ok) {
        setNotes(notes.map(n => n.id === data.note.id ? data.note : n))
        setSelectedNote(data.note)
        setIsEditing(false)
      } else setError(data.error)
    } catch (err: any) { setError(err.message) }
    finally { setSaving(false) }
  }

  const handleAiSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!aiQuery.trim()) return
    setAiSearching(true)
    setAiAnswer('')
    setMentionedIds([])
    try {
      const res = await fetch('/api/notes/ai-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: aiQuery }),
      })
      const data = await res.json()
      if (res.ok) {
        setAiAnswer(data.answer)
        setMentionedIds(data.mentionedIds || [])
      } else setError(data.error)
    } catch (err: any) { setError(err.message) }
    finally { setAiSearching(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this note?')) return
    try {
      const res = await fetch(`/api/notes?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        setNotes(notes.filter(n => n.id !== id))
        if (selectedNote?.id === id) { setSelectedNote(null); setIsEditing(false) }
      }
    } catch (err: any) { setError(err.message) }
  }

  const startCreate = () => {
    setIsCreating(true)
    setIsEditing(true)
    setSelectedNote(null)
    setEditTitle('')
    setEditContent('')
  }

  const startEdit = (note: Note) => {
    setSelectedNote(note)
    setIsEditing(true)
    setIsCreating(false)
    setEditTitle(note.title)
    setEditContent(note.content)
  }

  const cancelEdit = () => {
    setIsEditing(false)
    setIsCreating(false)
    if (selectedNote) {
      setEditTitle(selectedNote.title)
      setEditContent(selectedNote.content)
    }
  }

  const insertFormat = (prefix: string, suffix: string = '') => {
    const textarea = document.getElementById('note-content') as HTMLTextAreaElement
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = editContent.substring(start, end)
    const newContent = editContent.substring(0, start) + prefix + selected + suffix + editContent.substring(end)
    setEditContent(newContent)
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + prefix.length, end + prefix.length)
    }, 0)
  }

  const filteredNotes = notes.filter(n =>
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.content.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] lg:h-screen">
      {/* Notes List (sidebar) */}
      <div className={`w-full sm:w-80 flex-shrink-0 border-r border-slate-800 dark:border-slate-800 border-gray-200 flex flex-col bg-slate-900/30 dark:bg-slate-900/30 bg-gray-50 ${selectedNote || isCreating ? 'hidden sm:flex' : 'flex'}`}>
        <div className="p-4 border-b border-slate-800 dark:border-slate-800 border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" /> Notes
            </h1>
            <div className="flex gap-1">
              <button
                onClick={() => { setIsAiMode(!isAiMode); if (!isAiMode) { setAiAnswer(''); setAiQuery(''); setMentionedIds([]); } }}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${isAiMode ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30' : 'bg-slate-800/50 text-slate-400 hover:text-white'}`}
                title="AI Search"
              >
                <Sparkles className="w-4 h-4" />
              </button>
              <button onClick={startCreate} className="w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center transition-colors cursor-pointer">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {isAiMode ? (
            <form onSubmit={handleAiSearch} className="relative">
              <Wand2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
              <input
                value={aiQuery} onChange={(e) => setAiQuery(e.target.value)}
                placeholder="Ask AI about your notes..."
                className="w-full h-9 bg-purple-500/10 border border-purple-500/30 rounded-lg pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-purple-500/50"
              />
            </form>
          ) : (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notes..."
                className="w-full h-9 bg-slate-950/50 dark:bg-slate-950/50 bg-white border border-slate-800 dark:border-slate-800 border-gray-300 rounded-lg pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {aiAnswer && (
            <div className="m-3 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-slate-300">
              <div className="flex items-center gap-2 mb-2 text-purple-400 font-bold uppercase tracking-wider">
                <Sparkles className="w-3 h-3" /> AI Insight
              </div>
              <div className="prose prose-invert prose-xs max-w-none">
                <ReactMarkdown>{aiAnswer}</ReactMarkdown>
              </div>
              <button onClick={() => setAiAnswer('')} className="mt-2 text-slate-500 hover:text-white transition-colors">Dismiss</button>
            </div>
          )}
          {aiSearching && (
            <div className="m-3 p-4 flex flex-col items-center gap-3 bg-purple-500/5 rounded-xl border border-purple-500/10 animate-pulse">
              <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
              <p className="text-xs text-purple-400">Consulting your notes...</p>
            </div>
          )}
          {filteredNotes.length === 0 && !aiSearching && (
            <div className="text-center py-12 px-4">
              <FileText className="w-10 h-10 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">{notes.length === 0 ? 'No notes yet' : 'No matching notes'}</p>
              {notes.length === 0 && (
                <button onClick={startCreate} className="mt-3 text-sm text-blue-400 hover:text-blue-300 cursor-pointer">Create your first note →</button>
              )}
            </div>
          )}
          {filteredNotes.map(note => (
            <div
              key={note.id}
              onClick={() => { setSelectedNote(note); setIsEditing(false); setIsCreating(false); setEditTitle(note.title); setEditContent(note.content) }}
              className={`p-4 border-b border-slate-800/50 dark:border-slate-800/50 border-gray-100 cursor-pointer transition-colors group
                ${selectedNote?.id === note.id ? 'bg-blue-500/10 border-l-2 border-l-blue-500' : 
                  (mentionedIds.includes(note.id) ? 'bg-purple-500/5 border-l-2 border-l-purple-500/50 animate-pulse' : 'hover:bg-slate-800/30 dark:hover:bg-slate-800/30 hover:bg-gray-100')}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold truncate">{note.title}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{note.content || 'Empty note'}</p>
                  <p className="text-xs text-slate-600 mt-1.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(note.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(note.id) }}
                  className="text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 p-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Note Editor / Viewer */}
      <div className={`flex-1 flex flex-col min-w-0 ${!selectedNote && !isCreating ? 'hidden sm:flex' : 'flex'}`}>
        {(selectedNote || isCreating) ? (
          <>
            {/* Editor toolbar */}
            <div className="h-14 border-b border-slate-800 dark:border-slate-800 border-gray-200 flex items-center justify-between px-4 gap-2 flex-shrink-0">
              <div className="flex items-center gap-1">
                <button onClick={() => { setSelectedNote(null); setIsCreating(false) }} className="sm:hidden mr-2 text-slate-400 cursor-pointer">
                  ← Back
                </button>
                {isEditing && (
                  <>
                    <button onClick={() => insertFormat('**', '**')} className="w-8 h-8 rounded-lg hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer" title="Bold">
                      <Bold className="w-4 h-4" />
                    </button>
                    <button onClick={() => insertFormat('*', '*')} className="w-8 h-8 rounded-lg hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer" title="Italic">
                      <Italic className="w-4 h-4" />
                    </button>
                    <button onClick={() => insertFormat('## ')} className="w-8 h-8 rounded-lg hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer" title="Heading">
                      <Heading className="w-4 h-4" />
                    </button>
                    <button onClick={() => insertFormat('- ')} className="w-8 h-8 rounded-lg hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer" title="List">
                      <List className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <>
                    <button onClick={cancelEdit} className="px-3 py-1.5 text-sm text-slate-400 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
                    <button onClick={isCreating ? handleCreate : handleUpdate} disabled={saving}
                      className="px-4 py-1.5 text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center gap-1.5 disabled:opacity-70 cursor-pointer"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      {isCreating ? 'Create' : 'Save'}
                    </button>
                  </>
                ) : (
                  <button onClick={() => startEdit(selectedNote!)} className="px-4 py-1.5 text-sm font-semibold bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center gap-1.5 cursor-pointer">
                    <Edit3 className="w-4 h-4" /> Edit
                  </button>
                )}
              </div>
            </div>

            {/* Editor content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
              {isEditing ? (
                <div className="max-w-3xl mx-auto space-y-4">
                  <input
                    value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Note title..."
                    className="w-full text-xl sm:text-2xl font-bold bg-transparent outline-none placeholder:text-slate-600 border-b border-slate-800 dark:border-slate-800 border-gray-200 pb-3"
                    autoFocus
                  />
                  <textarea
                    id="note-content"
                    value={editContent} onChange={(e) => setEditContent(e.target.value)}
                    placeholder="Start writing... (Markdown supported: **bold**, *italic*, ## heading, - list)"
                    className="w-full min-h-[400px] bg-transparent outline-none placeholder:text-slate-600 text-sm leading-relaxed resize-none"
                  />
                </div>
              ) : (
                <div className="max-w-3xl mx-auto">
                  <h1 className="text-xl sm:text-2xl font-bold mb-4">{selectedNote?.title}</h1>
                  <p className="text-xs text-slate-500 mb-6">
                    Last updated: {new Date(selectedNote?.updated_at || '').toLocaleString()}
                  </p>
                  <div className="prose prose-invert prose-sm max-w-none prose-headings:text-slate-100 prose-p:text-slate-300 prose-li:text-slate-300 prose-strong:text-slate-100 whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
                    {selectedNote?.content || 'This note is empty. Click Edit to start writing.'}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <FileText className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">Select a note or create a new one</p>
              <button onClick={startCreate} className="mt-3 px-4 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg cursor-pointer">
                <Plus className="w-4 h-4 inline mr-1" /> New Note
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Error toast */}
      {error && (
        <div className="fixed bottom-4 right-4 p-4 bg-red-950 border border-red-900 text-red-400 text-sm rounded-xl z-50 max-w-sm">
          {error}
          <button onClick={() => setError('')} className="ml-2 text-red-300 cursor-pointer">×</button>
        </div>
      )}
    </div>
  )
}
