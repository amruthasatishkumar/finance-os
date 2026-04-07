'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Shield, AlertTriangle, Clock, Globe, TrendingUp, Plus, X, Trash2 } from 'lucide-react'
import { MetricCard } from '@/components/shared/MetricCard'
import { SectionHeader, AlertBanner } from '@/components/shared/index'
import { formatCurrency } from '@/lib/utils'
import { daysUntil } from '@/lib/utils'
import { addRemittanceLog, deleteRemittanceLog } from '@/actions/h1b'
import type { VisaInfo, Asset, RemittanceLog } from '@/generated/prisma/client'

const GC_STAGES = [
  { value: 'none', label: 'Not Started', step: 0 },
  { value: 'perm_in_progress', label: 'PERM In Progress', step: 1 },
  { value: 'i140_filed', label: 'I-140 Filed', step: 2 },
  { value: 'i140_approved', label: 'I-140 Approved', step: 3 },
  { value: 'waiting_priority', label: 'Waiting Priority Date', step: 4 },
  { value: 'i485_filed', label: 'I-485 Filed', step: 5 },
  { value: 'approved', label: '🎉 Green Card Approved', step: 6 },
]

const FBAR_THRESHOLD = 10000
const FBAR_WARNING = 9000

interface Props {
  visaInfo: VisaInfo | null
  remittances: RemittanceLog[]
  foreignAssets: Asset[]
  foreignTotal: number
  fbarStatus: string
  usdToInr: number
  includeSocialSecurity: boolean
}

export function H1BClient({ visaInfo, remittances, foreignAssets, foreignTotal, fbarStatus, usdToInr, includeSocialSecurity }: Props) {
  const [showRemittanceForm, setShowRemittanceForm] = useState(false)
  const [remittanceList, setRemittanceList] = useState(remittances)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [form, setForm] = useState({ amount: '', currency: 'USD', toCountry: 'India', method: 'Wise', exchangeRate: '', notes: '' })
  const [loading, setLoading] = useState(false)

  const visaDaysLeft = visaInfo?.expiryDate ? daysUntil(new Date(visaInfo.expiryDate)) : null
  const gcStage = GC_STAGES.find((s) => s.value === visaInfo?.gcPetitionStage) ?? GC_STAGES[0]
  const gcProgress = (gcStage.step / (GC_STAGES.length - 1)) * 100

  const fbarColor = fbarStatus === 'exceeded' ? 'red' : fbarStatus === 'warning' ? 'amber' : 'emerald'
  const totalRemittedYTD = remittanceList
    .filter((r) => new Date(r.createdAt).getFullYear() === new Date().getFullYear())
    .reduce((s, r) => s + r.amount, 0)

  async function handleAddRemittance() {
    setLoading(true)
    try {
      const created = await addRemittanceLog({
        amount: parseFloat(form.amount),
        currency: form.currency,
        toCountry: form.toCountry,
        method: form.method,
        exchangeRate: form.exchangeRate ? parseFloat(form.exchangeRate) : undefined,
        notes: form.notes || undefined,
      })
      setRemittanceList((prev) => [created, ...prev])
      setShowRemittanceForm(false)
      setForm({ amount: '', currency: 'USD', toCountry: 'India', method: 'Wise', exchangeRate: '', notes: '' })
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteRemittance(id: string) {
    setDeletingId(id)
    try {
      await deleteRemittanceLog(id)
      setRemittanceList((prev) => prev.filter((r) => r.id !== id))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-8 p-6">
      {/* Critical alerts */}
      {visaDaysLeft !== null && visaDaysLeft < 180 && (
        <AlertBanner type={visaDaysLeft < 60 ? 'danger' : 'warning'} title={`H1B expires in ${visaDaysLeft} days (${new Date(visaInfo!.expiryDate!).toLocaleDateString()}). Contact immigration attorney immediately.`} />
      )}
      {fbarStatus === 'exceeded' && (
        <AlertBanner type="danger" title={`You have exceeded the FBAR threshold. Foreign accounts = $${Math.round(foreignTotal).toLocaleString()} USD. File FBAR (FinCEN 114) by April 15.`} />
      )}
      {!includeSocialSecurity && (
        <AlertBanner type="info" title="Social Security is excluded from your projections. India-US Totalization Agreement does NOT cover SS benefits for most H1B holders who return to India." />
      )}

      {/* Metrics row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Visa Status"
          value={visaInfo?.visaType ?? 'H1B'}
          subtitle={visaDaysLeft !== null ? `${visaDaysLeft} days left` : 'No expiry set'}
          icon={<Shield className="w-5 h-5" />}
          color={visaDaysLeft !== null && visaDaysLeft < 180 ? 'red' : 'emerald'}
        />
        <MetricCard
          title="GC Stage"
          value={gcStage.label.replace('🎉 ', '')}
          subtitle={`Step ${gcStage.step} of ${GC_STAGES.length - 1}`}
          icon={<Globe className="w-5 h-5" />}
          color="indigo"
        />
        <MetricCard
          title="Foreign Accounts"
          value={formatCurrency(foreignTotal)}
          subtitle={`FBAR: ${fbarStatus}`}
          icon={<AlertTriangle className="w-5 h-5" />}
          color={fbarColor as any}
        />
        <MetricCard
          title="Remitted YTD"
          value={formatCurrency(totalRemittedYTD)}
          subtitle="To India this year"
          icon={<TrendingUp className="w-5 h-5" />}
          color="violet"
        />
      </div>

      {/* H1B Timeline */}
      <div className="card p-5">
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-400" />
          H1B Key Dates
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: 'Visa Expiry', date: visaInfo?.expiryDate ? new Date(visaInfo.expiryDate) : null, urgent: visaDaysLeft !== null && visaDaysLeft < 180 },
            { label: 'Next Renewal Due', date: visaInfo?.nextH1bRenewalDue ? new Date(visaInfo.nextH1bRenewalDue) : null, urgent: false },
            { label: 'Passport Expiry', date: visaInfo?.passportExpiry ? new Date(visaInfo.passportExpiry) : null, urgent: false },
            { label: 'Priority Date', date: visaInfo?.priorityDate ? new Date(visaInfo.priorityDate) : null, urgent: false },
          ].map(({ label, date, urgent }) => (
            <div key={label} className={`bg-[#1E293B] rounded-xl p-4 ${urgent ? 'border border-red-500/40' : ''}`}>
              <p className="text-xs text-[#94A3B8] mb-1">{label}</p>
              <p className={`text-base font-semibold ${urgent ? 'text-red-400' : 'text-white'}`}>
                {date ? date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
              </p>
              {date && <p className="text-xs text-[#475569] mt-0.5">{daysUntil(date)} days from now</p>}
            </div>
          ))}
        </div>
      </div>

      {/* Green Card Pipeline */}
      <div className="card p-5">
        <h3 className="font-semibold text-white mb-4">Green Card Pipeline</h3>
        <div className="mb-4">
          <div className="flex justify-between text-xs text-[#94A3B8] mb-2">
            <span>Stage: {gcStage.label}</span>
            <span>{gcProgress.toFixed(0)}% complete</span>
          </div>
          <div className="h-3 bg-[#334155] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }} animate={{ width: `${gcProgress}%` }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-emerald-500"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {GC_STAGES.map((stage) => (
            <div
              key={stage.value}
              className={`px-3 py-1.5 rounded-full text-xs ${gcStage.step >= stage.step ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/30' : 'bg-[#1E293B] text-[#475569]'}`}
            >
              {stage.step + 1}. {stage.label}
            </div>
          ))}
        </div>
        {visaInfo?.estimatedGcCost && (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="bg-[#1E293B] rounded-xl p-3">
              <p className="text-xs text-[#94A3B8]">Estimated GC Cost</p>
              <p className="text-[#F8FAFC] font-semibold">{formatCurrency(visaInfo.estimatedGcCost)}</p>
            </div>
            <div className="bg-[#1E293B] rounded-xl p-3">
              <p className="text-xs text-[#94A3B8]">GC Fund Saved</p>
              <p className="text-emerald-400 font-semibold">{formatCurrency(visaInfo.gcCostSaved)}</p>
            </div>
          </div>
        )}
      </div>

      {/* FBAR Meter */}
      <div className="card p-5">
        <h3 className="font-semibold text-white mb-4">FBAR Threshold Monitor</h3>
        <p className="text-sm text-[#94A3B8] mb-3">
          FinCEN 114 required if aggregate foreign accounts exceed $10,000 USD at any point in the calendar year.
        </p>
        <div className="space-y-2 mb-3">
          <div className="flex justify-between text-sm">
            <span className="text-[#94A3B8]">Current foreign balance</span>
            <span className={fbarStatus === 'exceeded' ? 'text-red-400 font-semibold' : fbarStatus === 'warning' ? 'text-amber-400 font-semibold' : 'text-emerald-400 font-semibold'}>
              {formatCurrency(foreignTotal)} / {formatCurrency(FBAR_THRESHOLD)}
            </span>
          </div>
          <div className="h-3 bg-[#334155] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }} animate={{ width: `${Math.min(100, (foreignTotal / FBAR_THRESHOLD) * 100)}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className={`h-full rounded-full ${fbarStatus === 'exceeded' ? 'bg-red-500' : fbarStatus === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'}`}
            />
          </div>
        </div>
        {foreignAssets.length > 0 && (
          <div className="space-y-2 mt-4">
            {foreignAssets.map((a) => {
              const usdBal = a.currency === 'USD' ? a.balance : a.balance / usdToInr
              return (
                <div key={a.id} className="flex justify-between text-sm">
                  <span className="text-[#CBD5E1]">{a.name}</span>
                  <span className="text-[#94A3B8]">{formatCurrency(a.balance, a.currency === 'USD' ? 'USD' : 'INR')} (~{formatCurrency(usdBal)})</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Remittance Log */}
      <div className="card p-5">
        <div className="mb-4">
          <SectionHeader
            title="Remittance Log"
            subtitle="Money sent home"
            action={
              <button onClick={() => setShowRemittanceForm(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-2 rounded-xl font-medium transition-colors">
                <Plus className="w-4 h-4" />Log Remittance
              </button>
            }
          />
        </div>
        <div className="mt-4 space-y-2">
          {remittanceList.length === 0 && <p className="text-slate-500 text-sm text-center py-6">No remittance records yet.</p>}
          {remittanceList.slice(0, 10).map((r) => (
            <div key={r.id} className="flex items-center justify-between py-2.5 border-b border-[#1E293B] last:border-0 group">
              <div>
                <p className="text-sm text-[#F8FAFC]">{r.method} → {r.toCountry}</p>
                <p className="text-xs text-[#475569]">{new Date(r.createdAt).toLocaleDateString()}</p>
                {r.notes && <p className="text-xs text-[#64748B] mt-0.5">{r.notes}</p>}
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-[#F8FAFC]">{formatCurrency(r.amount, r.currency)}</p>
                  {r.exchangeRate && <p className="text-xs text-[#475569]">@ {r.exchangeRate}</p>}
                </div>
                <button
                  onClick={() => handleDeleteRemittance(r.id)}
                  disabled={deletingId === r.id}
                  className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-900/30 rounded-lg transition-all disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Remittance form modal */}
      {showRemittanceForm && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-black/60 z-40" onClick={() => setShowRemittanceForm(false)} />
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-[#0B1120] border border-[#1E293B] rounded-2xl p-6 w-full max-w-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold">Log Remittance</h3>
                <button onClick={() => setShowRemittanceForm(false)}><X className="w-5 h-5 text-[#64748B]" /></button>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-[#94A3B8] mb-1.5 block font-medium">Amount</label>
                    <input type="number" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} className="w-full bg-[#1E293B] border border-[#334155] rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500" placeholder="1000" />
                  </div>
                  <div>
                    <label className="text-xs text-[#94A3B8] mb-1.5 block font-medium">Currency</label>
                    <select value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))} className="w-full bg-[#1E293B] border border-[#334155] rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500">
                      <option value="USD">USD</option>
                      <option value="INR">INR</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-[#94A3B8] mb-1.5 block font-medium">Method</label>
                    <select value={form.method} onChange={(e) => setForm((f) => ({ ...f, method: e.target.value }))} className="w-full bg-[#1E293B] border border-[#334155] rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500">
                      <option>Wise</option>
                      <option>Remitly</option>
                      <option>ICICI Money2India</option>
                      <option>Wire Transfer</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-[#94A3B8] mb-1.5 block font-medium">Exchange Rate</label>
                    <input type="number" step="0.01" value={form.exchangeRate} onChange={(e) => setForm((f) => ({ ...f, exchangeRate: e.target.value }))} className="w-full bg-[#1E293B] border border-[#334155] rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500" placeholder="83.5" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-[#94A3B8] mb-1.5 block font-medium">Notes</label>
                  <input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} className="w-full bg-[#1E293B] border border-[#334155] rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500" placeholder="Monthly support" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowRemittanceForm(false)} className="flex-1 bg-[#1E293B] hover:bg-[#334155] text-[#94A3B8] py-2.5 rounded-xl text-sm transition-colors">Cancel</button>
                  <button onClick={handleAddRemittance} disabled={loading || !form.amount} className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-semibold">
                    {loading ? 'Saving...' : 'Log'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </div>
  )
}
