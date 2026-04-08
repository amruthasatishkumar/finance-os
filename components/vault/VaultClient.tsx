'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, File, Lock, Pin, Trash2, ExternalLink, Upload, Pencil } from 'lucide-react'
import { SectionHeader } from '@/components/shared/index'
import type { Document } from '@/generated/prisma/client'

const DOC_TYPES = [
  { value: 'passport', label: '🛂 Passport', icon: '🛂' },
  { value: 'visa', label: '✈️ Visa Documents', icon: '✈️' },
  { value: 'i797', label: '📋 I-797 Approval', icon: '📋' },
  { value: 'employment', label: '💼 Employment Verification', icon: '💼' },
  { value: 'tax_return', label: '🧾 Tax Return', icon: '🧾' },
  { value: 'bank_statement', label: '🏦 Bank Statement', icon: '🏦' },
  { value: 'insurance', label: '🏥 Insurance', icon: '🏥' },
  { value: 'property', label: '🏠 Property Document', icon: '🏠' },
  { value: 'vehicle', label: '🚗 Vehicle Title', icon: '🚗' },
  { value: 'fbar', label: '📄 FBAR Filing', icon: '📄' },
  { value: 'other', label: '📦 Other', icon: '📦' },
]

interface Props {
  documents: Document[]
}

export function VaultClient({ documents: initialDocs }: Props) {
  const [docs, setDocs] = useState(initialDocs)
  const [showForm, setShowForm] = useState(false)
  const [editDocId, setEditDocId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', type: 'passport', notes: '', isPinned: false, expiryDate: '' })
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('all')

  const filtered = filter === 'all' ? docs : docs.filter((d) => d.type === filter)
  const expiring = docs.filter((d) => {
    if (!d.expiryDate) return false
    const days = Math.ceil((new Date(d.expiryDate).getTime() - Date.now()) / 86400000)
    return days <= 90 && days > 0
  })

  async function handleAdd() {
    setLoading(true)
    try {
      if (editDocId) {
        const response = await fetch('/api/vault', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editDocId, ...form }),
        })
        if (response.ok) {
          const updated = await response.json()
          setDocs((prev) => prev.map((d) => d.id === editDocId ? updated : d))
          setShowForm(false)
          setEditDocId(null)
          setForm({ name: '', type: 'passport', notes: '', isPinned: false, expiryDate: '' })
        }
      } else {
        const response = await fetch('/api/vault', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        if (response.ok) {
          const doc = await response.json()
          setDocs((prev) => [doc, ...prev])
          setShowForm(false)
          setForm({ name: '', type: 'passport', notes: '', isPinned: false, expiryDate: '' })
        }
      }
    } finally {
      setLoading(false)
    }
  }

  function startEdit(doc: Document) {
    setEditDocId(doc.id)
    setForm({
      name: doc.name,
      type: doc.type,
      notes: doc.notes ?? '',
      isPinned: doc.isPinned,
      expiryDate: doc.expiryDate ? new Date(doc.expiryDate).toISOString().split('T')[0] : '',
    })
    setShowForm(true)
  }

  async function handleDelete(id: string) {
    await fetch(`/api/vault?id=${id}`, { method: 'DELETE' })
    setDocs((prev) => prev.filter((d) => d.id !== id))
  }

  return (
    <div className="space-y-6 p-6">
      {/* Expiry warnings */}
      {expiring.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
          <p className="text-amber-400 font-medium mb-2">⚠️ Documents Expiring Soon</p>
          <div className="space-y-1">
            {expiring.map((d) => {
              const days = Math.ceil((new Date(d.expiryDate!).getTime() - Date.now()) / 86400000)
              return (
                <p key={d.id} className="text-sm text-amber-200">{d.name} — expires in {days} days</p>
              )
            })}
          </div>
        </div>
      )}

      {/* Security notice */}
      <div className="flex items-start gap-3 bg-[#1E293B] border border-[#334155] rounded-xl p-4">
        <Lock className="w-5 h-5 text-[#94A3B8] mt-0.5 shrink-0" />
        <div>
          <p className="text-sm text-[#CBD5E1] font-medium">Local Storage Only</p>
          <p className="text-xs text-[#64748B] mt-0.5">Document metadata is stored locally in your SQLite database. No files are uploaded to any server. This is a reference vault for document names and expiry tracking only.</p>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilter('all')} className={`px-3 py-1.5 rounded-full text-sm transition-colors ${filter === 'all' ? 'bg-indigo-600 text-white' : 'bg-[#1E293B] text-[#94A3B8] hover:text-white'}`}>
          All ({docs.length})
        </button>
        {DOC_TYPES.filter((t) => docs.some((d) => d.type === t.value)).map((t) => (
          <button key={t.value} onClick={() => setFilter(t.value)} className={`px-3 py-1.5 rounded-full text-sm transition-colors ${filter === t.value ? 'bg-indigo-600 text-white' : 'bg-[#1E293B] text-[#94A3B8] hover:text-white'}`}>
            {t.icon} {t.label.replace(/[^\w\s]/g, '').trim()}
          </button>
        ))}
      </div>

      {/* Documents */}
      <div>
        <SectionHeader
          title="Document Vault"
          subtitle={`${filtered.length} documents tracked`}
          action={
              <button onClick={() => { setEditDocId(null); setForm({ name: '', type: 'passport', notes: '', isPinned: false, expiryDate: '' }); setShowForm(true) }} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-2 rounded-xl transition-colors font-medium">
              <Plus className="w-4 h-4" />Add Document
            </button>
          }
        />
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
          {filtered.length === 0 && <div className="card col-span-2 text-center py-12 text-slate-500">No documents tracked yet.</div>}
          {filtered.map((doc) => {
            const meta = DOC_TYPES.find((t) => t.value === doc.type)
            const daysToExpiry = doc.expiryDate ? Math.ceil((new Date(doc.expiryDate).getTime() - Date.now()) / 86400000) : null
            const isExpiring = daysToExpiry !== null && daysToExpiry <= 90
            const isExpired = daysToExpiry !== null && daysToExpiry <= 0
            return (
              <motion.div key={doc.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={`card p-4 group flex items-start gap-4 ${isExpiring ? 'border-amber-500/30' : ''}`}>
                <div className="text-2xl mt-0.5">{meta?.icon ?? '📄'}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-white">{doc.name}</p>
                    {doc.isPinned && <Pin className="w-3.5 h-3.5 text-amber-400" />}
                  </div>
                  <p className="text-xs text-[#94A3B8] mt-0.5">{meta?.label ?? doc.type}</p>
                  {doc.expiryDate && (
                    <p className={`text-xs mt-1 ${isExpired ? 'text-red-400' : isExpiring ? 'text-amber-400' : 'text-[#64748B]'}`}>
                      {isExpired ? '🔴 Expired' : isExpiring ? `⚠️ Expires in ${daysToExpiry} days` : `Expires ${new Date(doc.expiryDate).toLocaleDateString()}`}
                    </p>
                  )}
                  {doc.notes && <p className="text-xs text-[#64748B] mt-1 italic">{doc.notes}</p>}
                </div>
                <button onClick={() => handleDelete(doc.id)} className="p-1.5 hover:bg-red-900/30 rounded-xl transition-colors">
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
                <button onClick={() => startEdit(doc)} className="p-1.5 hover:bg-[#334155] rounded-xl transition-colors">
                  <Pencil className="w-4 h-4 text-[#64748B]" />
                </button>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Form drawer */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-40" onClick={() => { setShowForm(false); setEditDocId(null) }} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed right-0 top-0 h-full w-full max-w-md bg-[#0B1120] border-l border-[#1E293B] z-50">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-white">{editDocId ? 'Edit Document' : 'Track Document'}</h2>
                  <button onClick={() => { setShowForm(false); setEditDocId(null) }}><X className="w-5 h-5 text-[#64748B]" /></button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-[#94A3B8] mb-1.5 block font-medium">Document Name *</label>
                    <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full bg-[#1E293B] border border-[#334155] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 text-sm" placeholder="e.g. US Passport" />
                  </div>
                  <div>
                    <label className="text-xs text-[#94A3B8] mb-1.5 block font-medium">Type</label>
                    <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} className="w-full bg-[#1E293B] border border-[#334155] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 text-sm">
                      {DOC_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-[#94A3B8] mb-1.5 block font-medium">Expiry Date</label>
                    <input type="date" value={form.expiryDate} onChange={(e) => setForm((f) => ({ ...f, expiryDate: e.target.value }))} className="w-full bg-[#1E293B] border border-[#334155] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-[#94A3B8] mb-1.5 block font-medium">Notes</label>
                    <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={3} className="w-full bg-[#1E293B] border border-[#334155] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 resize-none text-sm" />
                  </div>
                  <label className="flex items-center gap-2 text-sm text-[#94A3B8] cursor-pointer">
                    <input type="checkbox" checked={form.isPinned} onChange={(e) => setForm((f) => ({ ...f, isPinned: e.target.checked }))} className="w-4 h-4 accent-indigo-500" />
                    Pin this document
                  </label>
                  <button onClick={handleAdd} disabled={loading || !form.name.trim()} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium py-2.5 rounded-xl transition-colors">
                    {loading ? 'Saving...' : editDocId ? 'Update Document' : 'Track Document'}
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
