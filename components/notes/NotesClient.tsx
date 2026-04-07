'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Edit2, Trash2, X, Pin, BookOpen, Heart } from 'lucide-react'
import { SectionHeader } from '@/components/shared/index'
import { createNote, updateNote, deleteNote, createReflection, updateReflection, deleteReflection } from '@/actions/notes'
import type { Note, Reflection } from '@/generated/prisma/client'

const MOODS = ['😊 Great', '🙂 Good', '😐 Okay', '😟 Stressed', '😔 Worried']

interface Props {
  notes: Note[]
  reflections: Reflection[]
}

export function NotesClient({ notes: initialNotes, reflections: initialReflections }: Props) {
  const [activeTab, setActiveTab] = useState<'notes' | 'reflections'>('notes')
  const [notes, setNotes] = useState(initialNotes)
  const [reflections, setReflections] = useState(initialReflections)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ title: '', body: '', tags: '', isPinned: false, mood: '', period: '' })
  const [loading, setLoading] = useState(false)

  function resetForm() {
    setForm({ title: '', body: '', tags: '', isPinned: false, mood: '', period: '' })
    setEditId(null)
    setShowForm(false)
  }

  async function handleSaveNote() {
    if (!form.title.trim() || !form.body.trim()) return
    setLoading(true)
    try {
      if (editId) {
        const updated = await updateNote(editId, { title: form.title, body: form.body, tags: form.tags, isPinned: form.isPinned })
        setNotes((prev) => prev.map((n) => (n.id === editId ? { ...n, ...updated } : n)))
      } else {
        const created = await createNote({ title: form.title, body: form.body, tags: form.tags || undefined, isPinned: form.isPinned })
        setNotes((prev) => [created, ...prev])
      }
      resetForm()
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveReflection() {
    if (!form.title.trim() || !form.body.trim()) return
    setLoading(true)
    try {
      if (editId) {
        const updated = await updateReflection(editId, { title: form.title, body: form.body, mood: form.mood })
        setReflections((prev) => prev.map((r) => (r.id === editId ? { ...r, ...updated } : r)))
      } else {
        const created = await createReflection({ title: form.title, body: form.body, mood: form.mood || undefined, period: form.period || undefined })
        setReflections((prev) => [created, ...prev])
      }
      resetForm()
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteNote(id: string) {
    await deleteNote(id)
    setNotes((prev) => prev.filter((n) => n.id !== id))
  }

  async function handleDeleteReflection(id: string) {
    await deleteReflection(id)
    setReflections((prev) => prev.filter((r) => r.id !== id))
  }

  function startEditNote(note: Note) {
    setEditId(note.id)
    setForm({ title: note.title, body: note.body, tags: note.tags ?? '', isPinned: note.isPinned, mood: '', period: '' })
    setShowForm(true)
  }

  function startEditReflection(r: Reflection) {
    setEditId(r.id)
    setForm({ title: r.title, body: r.body, tags: '', isPinned: false, mood: r.mood ?? '', period: '' })
    setShowForm(true)
  }

  return (
    <div className="space-y-6 p-6">
      {/* Tabs */}
      <div className="flex gap-1 bg-[#0B1120] p-1 rounded-xl w-fit">
        <button onClick={() => setActiveTab('notes')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-colors ${activeTab === 'notes' ? 'bg-indigo-600 text-white' : 'text-[#64748B] hover:text-white'}`}>
          <BookOpen className="w-4 h-4" />Notes ({notes.length})
        </button>
        <button onClick={() => setActiveTab('reflections')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-colors ${activeTab === 'reflections' ? 'bg-indigo-600 text-white' : 'text-[#64748B] hover:text-white'}`}>
          <Heart className="w-4 h-4" />Reflections ({reflections.length})
        </button>
      </div>

      {activeTab === 'notes' && (
        <div>
          <div className="mb-4">
            <SectionHeader
              title="Financial Notes"
              subtitle="Capture important financial observations"
              action={
                <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-2 rounded-xl font-medium transition-colors">
                  <Plus className="w-4 h-4" />New Note
                </button>
              }
            />
          </div>
          <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
            {notes.length === 0 && <div className="card col-span-2 text-center py-12 text-slate-500">No notes yet. Capture your financial thoughts here.</div>}
            {notes.map((note) => (
              <motion.div key={note.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card p-4 group relative">
                {note.isPinned && <Pin className="absolute top-3 right-3 w-4 h-4 text-amber-400" />}
                <h3 className="font-semibold text-white mb-2 pr-6">{note.title}</h3>
                <p className="text-sm text-[#94A3B8] whitespace-pre-wrap line-clamp-4">{note.body}</p>
                {note.tags && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {note.tags.split(',').map((tag) => (
                      <span key={tag} className="text-xs bg-[#1E293B] text-[#94A3B8] px-2 py-0.5 rounded-full">{tag.trim()}</span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2 mt-3 justify-end">
                  <button onClick={() => startEditNote(note)} className="p-1.5 hover:bg-[#1E293B] rounded-xl transition-colors"><Edit2 className="w-3.5 h-3.5 text-[#64748B]" /></button>
                  <button onClick={() => handleDeleteNote(note.id)} className="p-1.5 hover:bg-red-900/30 rounded-xl transition-colors"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                </div>
                <p className="text-xs text-[#475569] mt-2">{new Date(note.createdAt).toLocaleDateString()}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'reflections' && (
        <div>
          <div className="mb-4">
            <SectionHeader
              title="Monthly Reflections"
              subtitle="Journal your financial journey"
              action={
                <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-2 rounded-xl font-medium transition-colors">
                  <Plus className="w-4 h-4" />New Reflection
                </button>
              }
            />
          </div>
          <div className="mt-4 space-y-4">
            {reflections.length === 0 && <div className="card text-center py-12 text-slate-500">No reflections yet. How are you feeling about your finances?</div>}
            {reflections.map((r) => (
              <motion.div key={r.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-4 group">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 mb-2">
                    {r.mood && <span className="text-lg">{r.mood.split(' ')[0]}</span>}
                    <h3 className="font-semibold text-white">{r.title}</h3>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => startEditReflection(r)} className="p-1.5 hover:bg-[#1E293B] rounded-xl transition-colors"><Edit2 className="w-3.5 h-3.5 text-[#64748B]" /></button>
                    <button onClick={() => handleDeleteReflection(r.id)} className="p-1.5 hover:bg-red-900/30 rounded-xl transition-colors"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                  </div>
                </div>
                <p className="text-sm text-[#CBD5E1] whitespace-pre-wrap">{r.body}</p>
                <p className="text-xs text-[#475569] mt-3">{new Date(r.createdAt).toLocaleDateString()}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Form drawer */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-40" onClick={resetForm} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed right-0 top-0 h-full w-full max-w-md bg-[#0B1120] border-l border-[#1E293B] z-50 overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-white">{editId ? 'Edit' : 'New'} {activeTab === 'notes' ? 'Note' : 'Reflection'}</h2>
                  <button onClick={resetForm} className="p-2 hover:bg-[#1E293B] rounded-xl transition-colors"><X className="w-5 h-5 text-[#64748B]" /></button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-[#94A3B8] mb-1.5 block font-medium">Title *</label>
                    <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="w-full bg-[#1E293B] border border-[#334155] rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500 text-sm placeholder:text-[#475569]" />
                  </div>
                  <div>
                    <label className="text-xs text-[#94A3B8] mb-1.5 block font-medium">Body *</label>
                    <textarea value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} rows={8} className="w-full bg-[#1E293B] border border-[#334155] rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500 text-sm resize-none placeholder:text-[#475569]" />
                  </div>
                  {activeTab === 'notes' && (
                    <>
                      <div>
                        <label className="text-xs text-[#94A3B8] mb-1.5 block font-medium">Tags (comma-separated)</label>
                        <input value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} className="w-full bg-[#1E293B] border border-[#334155] rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500 text-sm placeholder:text-[#475569]" placeholder="tax, h1b, investing" />
                      </div>
                      <label className="flex items-center gap-2 text-sm text-[#CBD5E1] cursor-pointer p-3 bg-[#1E293B] rounded-xl">
                        <input type="checkbox" checked={form.isPinned} onChange={(e) => setForm((f) => ({ ...f, isPinned: e.target.checked }))} className="w-4 h-4 accent-indigo-500" />
                        Pin this note
                      </label>
                    </>
                  )}
                  {activeTab === 'reflections' && (
                    <div>
                      <label className="text-xs text-[#94A3B8] mb-1.5 block font-medium">Mood</label>
                      <div className="flex flex-wrap gap-2">
                        {MOODS.map((mood) => (
                          <button key={mood} onClick={() => setForm((f) => ({ ...f, mood }))} className={`px-3 py-1.5 rounded-xl text-sm transition-colors ${form.mood === mood ? 'bg-indigo-600 text-white' : 'bg-[#1E293B] text-[#64748B] hover:text-white'}`}>
                            {mood}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <button
                    onClick={activeTab === 'notes' ? handleSaveNote : handleSaveReflection}
                    disabled={loading || !form.title.trim() || !form.body.trim()}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
                  >
                    {loading ? 'Saving...' : editId ? 'Update' : 'Save'}
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
