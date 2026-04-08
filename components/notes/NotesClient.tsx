'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Pin, Pencil, Trash2, X, BookOpen, Calendar } from 'lucide-react'
import { createNote, updateNote, deleteNote } from '@/actions/notes'
import type { Note, Reflection } from '@/generated/prisma/client'

interface Props {
  notes: Note[]
  reflections: Reflection[]
}

export function NotesClient({ notes: initialNotes, reflections: initialReflections }: Props) {
  const [notes, setNotes] = useState(initialNotes)
  const [activeTab, setActiveTab] = useState<'notes' | 'reflections'>('notes')
  const [showForm, setShowForm] = useState(false)
  const [editNote, setEditNote] = useState<Note | null>(null)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [tags, setTags] = useState('')
  const [isPinned, setIsPinned] = useState(false)
  const [loading, setLoading] = useState(false)
  const [filterTag, setFilterTag] = useState<string | null>(null)

  const allTags = Array.from(new Set(
    notes.flatMap((n) => (n.tags ?? '').split(',').map((t) => t.trim()).filter(Boolean))
  ))

  const displayedNotes = filterTag
    ? notes.filter((n) => (n.tags ?? '').includes(filterTag!))
    : notes

  function openCreate() {
    setEditNote(null); setTitle(''); setBody(''); setTags(''); setIsPinned(false); setShowForm(true)
  }

  function openEdit(n: Note) {
    setEditNote(n); setTitle(n.title); setBody(n.body); setTags(n.tags ?? ''); setIsPinned(n.isPinned); setShowForm(true)
  }

  async function handleSave() {
    if (!title.trim()) return
    setLoading(true)
    try {
      if (editNote) {
        const updated = await updateNote(editNote.id, { title, body, tags, isPinned })
        setNotes((prev) => prev.map((n) => n.id === editNote.id ? { ...n, ...updated } : n).sort((a, b) => Number(b.isPinned) - Number(a.isPinned)))
      } else {
        const created = await createNote({ title, body, tags: tags || undefined, isPinned })
        setNotes((prev) => [created, ...prev].sort((a, b) => Number(b.isPinned) - Number(a.isPinned)))
      }
      setShowForm(false)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    await deleteNote(id)
    setNotes((prev) => prev.filter((n) => n.id !== id))
  }

  async function togglePin(n: Note) {
    const updated = await updateNote(n.id, { isPinned: !n.isPinned })
    setNotes((prev) => prev.map((x) => x.id === n.id ? { ...x, isPinned: updated.isPinned } : x).sort((a, b) => Number(b.isPinned) - Number(a.isPinned)))
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Notes & Reflections</h1>
          <p className="text-sm text-[#64748B] mt-0.5">Capture your financial journey</p>
        </div>
        {activeTab === 'notes' && (
          <button onClick={openCreate} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-2 rounded-xl transition-colors font-medium">
            <Plus className="w-4 h-4" />New Note
          </button>
        )}
      </div>

      <div className="flex gap-2 border-b border-[#1E293B]">
        {(['notes', 'reflections'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors rounded-t-lg border-b-2 -mb-px ${activeTab === tab ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-[#64748B] hover:text-[#94A3B8]'}`}
          >
            {tab === 'notes' ? '📝 Notes' : '🌙 Reflections'}
          </button>
        ))}
      </div>

      {activeTab === 'notes' && (
        <div className="space-y-4">
          {allTags.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setFilterTag(null)} className={`px-2.5 py-1 rounded-full text-xs transition-colors ${!filterTag ? 'bg-indigo-600 text-white' : 'bg-[#1E293B] text-[#94A3B8]'}`}>All</button>
              {allTags.map((tag) => (
                <button key={tag} onClick={() => setFilterTag(filterTag === tag ? null : tag)} className={`px-2.5 py-1 rounded-full text-xs transition-colors ${filterTag === tag ? 'bg-indigo-600 text-white' : 'bg-[#1E293B] text-[#94A3B8] hover:text-white'}`}>#{tag}</button>
              ))}
            </div>
          )}
          {displayedNotes.length === 0 ? (
            <div className="card text-center py-16 text-[#64748B]">
              <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium text-[#94A3B8]">No notes yet.</p>
              <p className="text-sm mt-1">Create your first note to capture insights about your financial journey.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {displayedNotes.map((n) => (
                <motion.div key={n.id} layout initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className={`card p-5 ${n.isPinned ? 'border-amber-500/30 bg-amber-500/5' : ''}`}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      {n.isPinned && <Pin className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />}
                      <h3 className="font-semibold text-white text-sm">{n.title}</h3>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => togglePin(n)} className={`p-1.5 rounded-lg transition-colors ${n.isPinned ? 'text-amber-400 hover:bg-amber-500/20' : 'text-[#475569] hover:bg-[#1E293B] hover:text-[#94A3B8]'}`}>
                        <Pin className="w-3 h-3" />
                      </button>
                      <button onClick={() => openEdit(n)} className="p-1.5 hover:bg-[#334155] rounded-lg text-[#64748B] hover:text-[#94A3B8] transition-colors"><Pencil className="w-3 h-3" /></button>
                      <button onClick={() => handleDelete(n.id)} className="p-1.5 hover:bg-red-900/30 rounded-lg text-[#475569] hover:text-red-400 transition-colors"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  </div>
                  <p className="text-sm text-[#94A3B8] whitespace-pre-wrap line-clamp-4">{n.body}</p>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex gap-1.5 flex-wrap">
                      {(n.tags ?? '').split(',').map((t) => t.trim()).filter(Boolean).map((tag) => (
                        <span key={tag} className="text-xs px-2 py-0.5 bg-indigo-500/15 text-indigo-400 rounded-full">#{tag}</span>
                      ))}
                    </div>
                    <span className="text-xs text-[#475569]">{new Date(n.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'reflections' && (
        <div className="space-y-4">
          {initialReflections.length === 0 ? (
            <div className="card text-center py-16 text-[#64748B]">
              <Calendar className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium text-[#94A3B8]">No monthly reflections yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {initialReflections.map((r) => (
                <div key={r.id} className="card p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-white">{r.title || r.period}</h3>
                    {r.mood && <span className="text-lg">{r.mood.split(' ')[0]}</span>}
                  </div>
                  <p className="text-sm text-[#94A3B8] whitespace-pre-wrap">{r.body}</p>
                  <p className="text-xs text-[#475569] mt-3">{r.period}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-40" onClick={() => setShowForm(false)} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed right-0 top-0 h-full w-full max-w-md bg-[#0B1120] border-l border-[#1E293B] z-50 overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-white">{editNote ? 'Edit Note' : 'New Note'}</h2>
                  <button onClick={() => setShowForm(false)} className="p-2 hover:bg-[#1E293B] rounded-xl"><X className="w-5 h-5 text-[#64748B]" /></button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-[#94A3B8] mb-1.5 block font-medium">Title *</label>
                    <input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus
                      className="w-full bg-[#1E293B] border border-[#334155] rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500 text-sm placeholder:text-[#475569]"
                      placeholder="e.g. Thoughts on my 2025 salary review" />
                  </div>
                  <div>
                    <label className="text-xs text-[#94A3B8] mb-1.5 block font-medium">Content</label>
                    <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={8}
                      className="w-full bg-[#1E293B] border border-[#334155] rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500 text-sm placeholder:text-[#475569] resize-none"
                      placeholder="Write your thoughts here..." />
                  </div>
                  <div>
                    <label className="text-xs text-[#94A3B8] mb-1.5 block font-medium">Tags (comma-separated)</label>
                    <input value={tags} onChange={(e) => setTags(e.target.value)}
                      className="w-full bg-[#1E293B] border border-[#334155] rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500 text-sm placeholder:text-[#475569]"
                      placeholder="e.g. career, salary, goals" />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-[#CBD5E1] p-3 bg-[#1E293B] rounded-xl">
                    <input type="checkbox" checked={isPinned} onChange={(e) => setIsPinned(e.target.checked)} className="w-4 h-4 accent-amber-500" />
                    Pin this note
                  </label>
                  <button onClick={handleSave} disabled={loading || !title.trim()}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors text-sm">
                    {loading ? 'Saving...' : editNote ? 'Update Note' : 'Create Note'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

