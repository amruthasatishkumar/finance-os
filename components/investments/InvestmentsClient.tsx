'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Edit2, Trash2, X, TrendingUp, PieChart, AlertTriangle } from 'lucide-react'
import { MetricCard } from '@/components/shared/MetricCard'
import { SectionHeader, AlertBanner } from '@/components/shared/index'
import { DonutChart, FinanceAreaChart } from '@/components/charts/index'
import { formatCurrency, formatPercent } from '@/lib/utils'
import { calcPortfolioProjection, type ProjectionPoint } from '@/lib/calculations/investments'
import { createAsset, updateAsset, deleteAsset } from '@/actions/investments'
import { IRS_CONTRIBUTION_LIMITS_2025 } from '@/lib/constants'
import type { Asset, Investment } from '@/generated/prisma/client'

const PORTFOLIO_COLORS: Record<string, string> = {
  Checking: '#6366F1', Savings: '#8B5CF6', '401(k)': '#10B981', 'Roth IRA': '#06B6D4',
  HSA: '#F59E0B', Brokerage: '#3B82F6', 'NRE Account': '#F97316', 'NRO Account': '#EF4444',
  FCNR: '#EC4899', Crypto: '#FBBF24', Vehicle: '#64748B', 'Real Estate': '#14B8A6', Other: '#94A3B8',
}
const FALLBACK_COLORS = ['#6366F1', '#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#14B8A6']

const ACCOUNT_LABELS: Record<string, { label: string; icon: string; limit?: number; isForeign?: boolean }> = {
  checking: { label: 'Checking', icon: '🏦' },
  savings: { label: 'Savings', icon: '💰' },
  '401k': { label: '401(k)', icon: '🏢', limit: IRS_CONTRIBUTION_LIMITS_2025.k401Traditional },
  roth_ira: { label: 'Roth IRA', icon: '🦺', limit: IRS_CONTRIBUTION_LIMITS_2025.rothIra },
  hsa: { label: 'HSA', icon: '🏥', limit: IRS_CONTRIBUTION_LIMITS_2025.hsaIndividual },
  brokerage: { label: 'Brokerage', icon: '📈' },
  nre_account: { label: 'NRE Account', icon: '🇮🇳', isForeign: true },
  nro_account: { label: 'NRO Account', icon: '🇮🇳', isForeign: true },
  fcnr: { label: 'FCNR', icon: '🌏', isForeign: true },
  crypto: { label: 'Crypto', icon: '₿' },
  vehicle: { label: 'Vehicle', icon: '🚗' },
  real_estate: { label: 'Real Estate', icon: '🏠' },
  other: { label: 'Other', icon: '📦' },
}

const schema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  balance: z.coerce.number().min(0),
  currency: z.string().default('USD'),
  institution: z.string().optional(),
  isForeignAccount: z.boolean().default(false),
  contributionYTD: z.coerce.number().min(0).default(0),
  irsAnnualLimit: z.coerce.number().optional(),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Props {
  assets: Asset[]
  investments: Investment[]
  totalAssets: number
  netWorth: number
  foreignTotal: number
  usdToInr: number
  returnRate: number
  retirementAge: number
}

export function InvestmentsClient({ assets, totalAssets, netWorth, foreignTotal, usdToInr, returnRate, retirementAge }: Props) {
  const [items, setItems] = useState(assets)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'accounts' | 'projection'>('accounts')

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { currency: 'USD', isForeignAccount: false, contributionYTD: 0 },
  })

  const watchType = watch('type')

  // Portfolio composition for donut chart
  const donutData = useMemo(() => {
    const groups: Record<string, number> = {}
    items.forEach((a) => {
      const label = ACCOUNT_LABELS[a.type]?.label ?? a.type
      groups[label] = (groups[label] ?? 0) + a.balance
    })
    return Object.entries(groups).map(([name, value], i) => ({ name, value: Math.round(value), color: PORTFOLIO_COLORS[name] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length] }))
  }, [items])

  // Projection
  const investableAssets = useMemo(() =>
    items.filter((a) => ['401k', 'roth_ira', 'hsa', 'brokerage', 'nre_account', 'nro_account'].includes(a.type))
      .reduce((s, a) => {
        const usdValue = a.currency === 'USD' ? a.balance : a.balance / usdToInr
        return s + usdValue
      }, 0),
  [items, usdToInr])

  const projectionYears = Math.max(5, retirementAge - 29)
  const projectionPoints = useMemo(() =>
    calcPortfolioProjection(investableAssets, 30000 / 12, projectionYears, returnRate - 0.02, returnRate, returnRate + 0.02),
  [investableAssets, projectionYears, returnRate])

  const projectionChart = projectionPoints.map((p: ProjectionPoint) => ({
    label: `${p.year}`,
    conservative: p.conservative,
    base: p.base,
    optimistic: p.optimistic,
  }))

  const fbarWarning = foreignTotal >= 9000

  async function onSubmit(data: FormData) {
    setLoading(true)
    try {
      const irsLimit = ACCOUNT_LABELS[data.type]?.limit
      const payload = { ...data, irsAnnualLimit: irsLimit }
      if (editId) {
        const updated = await updateAsset(editId, payload)
        setItems((prev) => prev.map((a) => (a.id === editId ? { ...a, ...updated } : a)))
      } else {
        const created = await createAsset(payload)
        setItems((prev) => [...prev, created])
      }
      reset()
      setShowForm(false)
      setEditId(null)
    } finally {
      setLoading(false)
    }
  }

  function startEdit(a: Asset) {
    setEditId(a.id)
    setValue('name', a.name)
    setValue('type', a.type)
    setValue('balance', a.balance)
    setValue('currency', a.currency)
    setValue('institution', a.institution ?? '')
    setValue('isForeignAccount', a.isForeignAccount)
    setValue('contributionYTD', a.contributionYTD ?? 0)
    setValue('notes', a.notes ?? '')
    setShowForm(true)
  }

  async function handleDelete(id: string) {
    await deleteAsset(id)
    setItems((prev) => prev.filter((a) => a.id !== id))
  }

  return (
    <div className="space-y-8 p-6">
      {fbarWarning && (
        <AlertBanner
          type={foreignTotal >= 10000 ? 'danger' : 'warning'}
          title={`FBAR alert: Foreign accounts total $${Math.round(foreignTotal).toLocaleString()} USD equivalent. ${foreignTotal >= 10000 ? 'You must file FBAR by April 15.' : 'Approaching $10,000 FBAR threshold.'}`}
        />
      )}

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total Assets" value={formatCurrency(totalAssets, 'USD', true)} icon={<TrendingUp className="w-5 h-5" />} color="emerald" />
        <MetricCard title="Net Worth" value={formatCurrency(netWorth, 'USD', true)} icon={<TrendingUp className="w-5 h-5" />} color="indigo" />
        <MetricCard title="Investable" value={formatCurrency(investableAssets, 'USD', true)} subtitle="401k + IRA + brokerage" icon={<PieChart className="w-5 h-5" />} color="violet" />
        <MetricCard title="Foreign Assets" value={formatCurrency(foreignTotal, 'USD', true)} subtitle={fbarWarning ? '⚠️ FBAR tracked' : 'FBAR safe'} icon={<AlertTriangle className="w-5 h-5" />} color={fbarWarning ? 'amber' : 'slate'} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#0B1120] p-1 rounded-xl w-fit">
        {(['accounts', 'projection'] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-xl text-sm capitalize transition-colors ${activeTab === tab ? 'bg-indigo-600 text-white' : 'text-[#64748B] hover:text-white'}`}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'accounts' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Donut chart */}
          {donutData.length > 0 && (
            <div className="card p-5">
              <p className="text-sm font-medium text-[#94A3B8] mb-3">Portfolio Composition</p>
              <DonutChart data={donutData} />
            </div>
          )}

          {/* Account list */}
          <div className="lg:col-span-2 space-y-3">
            <div className="mb-4">
              <SectionHeader
                title="Accounts"
                subtitle={`${items.length} tracked`}
                action={
                  <button onClick={() => { setShowForm(true); setEditId(null); reset() }} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-2 rounded-xl transition-colors font-medium">
                    <Plus className="w-4 h-4" />Add Account
                  </button>
                }
              />
            </div>
            {items.length === 0 && <div className="card text-center py-12 text-slate-500">No accounts yet.</div>}
            {items.map((asset) => {
              const meta = ACCOUNT_LABELS[asset.type] ?? { label: asset.type, icon: '📦' }
              const balanceUSD = asset.currency === 'USD' ? asset.balance : asset.balance / usdToInr
              const ytdPct = meta.limit && asset.contributionYTD ? (asset.contributionYTD / meta.limit) * 100 : null
              return (
                <motion.div key={asset.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-[#0B1120] flex items-center justify-center flex-shrink-0 text-lg">
                      {meta.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-[#F8FAFC]">{asset.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-[#64748B]">{meta.label}</span>
                        {asset.institution && <span className="text-xs text-[#475569]">· {asset.institution}</span>}
                        {asset.isForeignAccount && <span className="badge-amber">Foreign</span>}
                      </div>
                      {ytdPct !== null && (
                        <div className="mt-1.5">
                          <div className="flex justify-between text-xs text-[#64748B] mb-0.5">
                            <span>YTD: {formatCurrency(asset.contributionYTD ?? 0)}</span>
                            <span>Limit: {formatCurrency(meta.limit!)}</span>
                          </div>
                          <div className="h-1 w-32 bg-[#334155] rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min(100, ytdPct)}%` }} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right mr-2">
                      <p className="font-semibold text-[#F8FAFC] tabular-nums">{formatCurrency(asset.balance, asset.currency === 'USD' ? 'USD' : 'INR')}</p>
                      {asset.currency !== 'USD' && <p className="text-xs text-[#64748B]">~{formatCurrency(balanceUSD)} USD</p>}
                    </div>
                    <button onClick={() => startEdit(asset)} className="p-1.5 hover:bg-[#334155] rounded-lg transition-colors"><Edit2 className="w-3.5 h-3.5 text-[#64748B]" /></button>
                    <button onClick={() => handleDelete(asset.id)} className="p-1.5 hover:bg-red-900/30 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}

      {activeTab === 'projection' && (
        <div className="card p-5">
          <h3 className="font-semibold text-white mb-4">Portfolio Projection to Age {retirementAge}</h3>
          <FinanceAreaChart
            data={projectionChart as any}
            lines={[
              { key: 'optimistic', label: 'Optimistic', color: '#10B981' },
              { key: 'base', label: 'Base', color: '#6366F1' },
              { key: 'conservative', label: 'Conservative', color: '#F59E0B' },
            ]}
            height={320}
          />
          <p className="text-xs text-[#64748B] mt-2">Assumes ${(30000 / 1000).toFixed(0)}k/yr additional contributions. Conservative = {formatPercent((returnRate - 0.02) * 100)}, Base = {formatPercent(returnRate * 100)}, Optimistic = {formatPercent((returnRate + 0.02) * 100)}.</p>
        </div>
      )}

      {/* Add/Edit Drawer */}
      {showForm && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-black/60 z-40" onClick={() => { setShowForm(false); setEditId(null) }} />
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed right-0 top-0 h-full w-full max-w-md bg-[#0B1120] border-l border-[#1E293B] z-50 overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-white">{editId ? 'Edit Account' : 'Add Account'}</h2>
                <button onClick={() => { setShowForm(false); setEditId(null) }} className="p-2 hover:bg-[#1E293B] rounded-xl"><X className="w-5 h-5 text-[#64748B]" /></button>
              </div>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="text-xs text-[#94A3B8] mb-1.5 block font-medium">Account Name *</label>
                  <input {...register('name')} className="w-full bg-[#1E293B] border border-[#334155] rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500 text-sm placeholder:text-[#475569]" placeholder="e.g. Fidelity 401k" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-[#94A3B8] mb-1.5 block font-medium">Account Type</label>
                    <select {...register('type')} className="w-full bg-[#1E293B] border border-[#334155] rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500 text-sm">
                      {Object.entries(ACCOUNT_LABELS).map(([v, { label, icon }]) => <option key={v} value={v}>{icon} {label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-[#94A3B8] mb-1.5 block font-medium">Currency</label>
                    <select {...register('currency')} className="w-full bg-[#1E293B] border border-[#334155] rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500 text-sm">
                      <option value="USD">USD</option>
                      <option value="INR">INR</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-[#94A3B8] mb-1.5 block font-medium">Balance *</label>
                  <input {...register('balance')} type="number" step="100" className="w-full bg-[#1E293B] border border-[#334155] rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500 text-sm" />
                </div>
                {ACCOUNT_LABELS[watchType]?.limit && (
                  <div>
                    <label className="text-xs text-[#94A3B8] mb-1.5 block font-medium">YTD Contributions ($) — Limit: {formatCurrency(ACCOUNT_LABELS[watchType].limit!)}</label>
                    <input {...register('contributionYTD')} type="number" step="100" className="w-full bg-[#1E293B] border border-[#334155] rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500 text-sm" />
                  </div>
                )}
                <div>
                  <label className="text-xs text-[#94A3B8] mb-1.5 block font-medium">Institution</label>
                  <input {...register('institution')} className="w-full bg-[#1E293B] border border-[#334155] rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500 text-sm placeholder:text-[#475569]" placeholder="e.g. Fidelity" />
                </div>
                <label className="flex items-center gap-2 text-sm text-[#CBD5E1] cursor-pointer p-3 bg-[#1E293B] rounded-xl">
                  <input {...register('isForeignAccount')} type="checkbox" className="w-4 h-4 accent-indigo-500" />
                  Foreign account (FBAR tracked)
                </label>
                <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors text-sm">
                  {loading ? 'Saving...' : editId ? 'Update' : 'Add Account'}
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </div>
  )
}
