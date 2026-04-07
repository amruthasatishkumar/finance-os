'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Edit2, Trash2, TrendingUp, DollarSign, Briefcase, X, ShieldCheck } from 'lucide-react'
import { MetricCard } from '@/components/shared/MetricCard'
import { SectionHeader } from '@/components/shared/index'
import { formatCurrency, formatPercent, normalizeToMonthly } from '@/lib/utils'
import { createIncomeSource, updateIncomeSource, deleteIncomeSource } from '@/actions/income'
import { createPreTaxDeduction, updatePreTaxDeduction, deletePreTaxDeduction } from '@/actions/pretax'
import type { IncomeSource, PreTaxDeduction } from '@/generated/prisma/client'

const INCOME_TYPES = [
  { value: 'salary', label: 'Salary' },
  { value: 'bonus', label: 'Bonus' },
  { value: 'rsu', label: 'RSU / Stock' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'rental', label: 'Rental' },
  { value: 'interest', label: 'Interest' },
  { value: 'dividend', label: 'Dividend' },
  { value: 'other', label: 'Other' },
]

const FREQUENCIES = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'annual', label: 'Annual' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'biweekly', label: 'Biweekly' },
  { value: 'one_time', label: 'One-time' },
]

const PRETAX_TYPES = [
  { value: '401k_traditional', label: '401k (Traditional)', icon: '🏦' },
  { value: '401k_roth', label: '401k (Roth)', icon: '📈' },
  { value: 'health_insurance', label: 'Health Insurance', icon: '🏥' },
  { value: 'hsa', label: 'HSA', icon: '💊' },
  { value: 'fsa_healthcare', label: 'FSA (Healthcare)', icon: '🩺' },
  { value: 'fsa_dependent', label: 'FSA (Dependent Care)', icon: '👶' },
  { value: 'dental_vision', label: 'Dental / Vision', icon: '👁️' },
  { value: 'life_insurance', label: 'Life Insurance', icon: '🛡️' },
  { value: 'other', label: 'Other', icon: '📋' },
]

const pretaxTypeMap = Object.fromEntries(PRETAX_TYPES.map((t) => [t.value, t]))

const schema = z.object({
  name: z.string().min(1, 'Name required'),
  type: z.string().min(1),
  amount: z.coerce.number().min(0, 'Amount must be positive'),
  frequency: z.string().default('monthly'),
  taxable: z.boolean().default(true),
  growthRate: z.coerce.number().min(0).default(0.05),
  notes: z.string().optional(),
})

const pretaxSchema = z.object({
  name: z.string().min(1, 'Name required'),
  type: z.string().min(1),
  monthlyAmount: z.coerce.number().min(0, 'Amount must be non-negative'),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>
type PretaxFormData = z.infer<typeof pretaxSchema>

interface Props {
  incomeSources: IncomeSource[]
  preTaxItems: PreTaxDeduction[]
  grossMonthly: number
  netMonthly: number
  stateTaxRate: number
  filingStatus: string
  preTaxDeductions: number
  state: string
  taxBreakdown: {
    gross: number
    preTaxDeductions: number
    federalTax: number
    stateTax: number
    fica: number
    totalTax: number
    net: number
    effectiveFederalRate: number
    effectiveTotalRate: number
  } | null
}

export function IncomeClient({ incomeSources, preTaxItems: initialPretaxItems, grossMonthly, netMonthly, stateTaxRate, filingStatus, preTaxDeductions, state, taxBreakdown }: Props) {
  const [sources, setSources] = useState(incomeSources)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Pre-tax deductions state
  const [pretaxItems, setPretaxItems] = useState<PreTaxDeduction[]>(initialPretaxItems)
  const [showPretaxForm, setShowPretaxForm] = useState(false)
  const [pretaxEditId, setPretaxEditId] = useState<string | null>(null)
  const [pretaxLoading, setPretaxLoading] = useState(false)

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { frequency: 'monthly', taxable: true, growthRate: 0.05 },
  })

  const { register: registerPt, handleSubmit: handleSubmitPt, reset: resetPt, setValue: setValuePt, formState: { errors: errorsPt } } = useForm<PretaxFormData>({
    resolver: zodResolver(pretaxSchema),
    defaultValues: { type: '401k_traditional', monthlyAmount: 0 },
  })

  const effectiveTaxRate = grossMonthly > 0 ? (grossMonthly - netMonthly) / grossMonthly : 0
  const annualGross = grossMonthly * 12
  const annualNet = netMonthly * 12

  async function onSubmit(data: FormData) {
    setLoading(true)
    try {
      if (editId) {
        const updated = await updateIncomeSource(editId, data)
        setSources((prev) => prev.map((s) => (s.id === editId ? { ...s, ...updated } : s)))
      } else {
        const created = await createIncomeSource(data)
        setSources((prev) => [...prev, created])
      }
      reset()
      setShowForm(false)
      setEditId(null)
    } finally {
      setLoading(false)
    }
  }

  function startEdit(source: IncomeSource) {
    setEditId(source.id)
    setValue('name', source.name)
    setValue('type', source.type)
    setValue('amount', source.amount)
    setValue('frequency', source.frequency)
    setValue('taxable', source.taxable)
    setValue('growthRate', source.growthRate)
    setValue('notes', source.notes ?? '')
    setShowForm(true)
  }

  async function handleDelete(id: string) {
    await deleteIncomeSource(id)
    setSources((prev) => prev.filter((s) => s.id !== id))
  }

  async function onPretaxSubmit(data: PretaxFormData) {
    setPretaxLoading(true)
    try {
      if (pretaxEditId) {
        const updated = await updatePreTaxDeduction(pretaxEditId, data)
        setPretaxItems((prev) => prev.map((d) => (d.id === pretaxEditId ? { ...d, ...updated } : d)))
      } else {
        const created = await createPreTaxDeduction(data)
        setPretaxItems((prev) => [...prev, created])
      }
      resetPt()
      setShowPretaxForm(false)
      setPretaxEditId(null)
    } finally {
      setPretaxLoading(false)
    }
  }

  function startEditPretax(item: PreTaxDeduction) {
    setPretaxEditId(item.id)
    setValuePt('name', item.name)
    setValuePt('type', item.type)
    setValuePt('monthlyAmount', item.monthlyAmount)
    setValuePt('notes', item.notes ?? '')
    setShowPretaxForm(true)
  }

  async function handleDeletePretax(id: string) {
    await deletePreTaxDeduction(id)
    setPretaxItems((prev) => prev.filter((d) => d.id !== id))
  }

  const typeIcons: Record<string, string> = {
    salary: '💼', bonus: '🎯', rsu: '📈', freelance: '🧑‍💻',
    rental: '🏠', interest: '🏦', dividend: '💹', other: '💰',
  }

  return (
    <div className="space-y-8 p-6">
      {/* Header metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Monthly Gross"
          value={formatCurrency(grossMonthly)}
          subtitle={`$${(annualGross / 1000).toFixed(0)}k / year`}
          icon={<DollarSign className="w-5 h-5" />}
          color="indigo"
        />
        <MetricCard
          title="Monthly Net"
          value={formatCurrency(netMonthly)}
          subtitle={`After ${formatPercent(effectiveTaxRate * 100)} effective tax`}
          icon={<TrendingUp className="w-5 h-5" />}
          color="emerald"
        />
        <MetricCard
          title="Annual Net"
          value={formatCurrency(annualNet, 'USD', true)}
          subtitle="Take-home income"
          icon={<Briefcase className="w-5 h-5" />}
          color="violet"
        />
        <MetricCard
          title="Tax Burden"
          value={formatPercent(effectiveTaxRate * 100)}
          subtitle={`Federal + ${state} state + FICA`}
          icon={<TrendingUp className="w-5 h-5" />}
          color="amber"
        />
      </div>

      {/* Tax Breakdown */}
      {taxBreakdown && (
        <div className="card p-5">
          <h3 className="font-semibold text-[#F8FAFC] mb-1">Tax Breakdown</h3>
          <p className="text-xs text-[#64748B] mb-4">
            {state} · {filingStatus === 'married_jointly' ? 'Married Filing Jointly' : 'Single'} · {formatCurrency(preTaxDeductions, 'USD', false)} pre-tax deductions
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Waterfall */}
            <div className="space-y-2.5">
              {[
                { label: 'Gross Annual',             value: taxBreakdown.gross,             color: 'text-[#F8FAFC]',   bg: 'bg-[#334155]',       sign: '' },
                { label: '401k / Pre-tax Deductions',value: -taxBreakdown.preTaxDeductions, color: 'text-amber-400',   bg: 'bg-amber-500/10',     sign: '−' },
                { label: 'Federal Income Tax',        value: -taxBreakdown.federalTax,       color: 'text-red-400',     bg: 'bg-red-500/10',       sign: '−' },
                { label: `${state === 'California' || stateTaxRate === 0.093 ? 'CA State Tax + SDI' : 'State Tax'}`, value: -taxBreakdown.stateTax, color: 'text-orange-400', bg: 'bg-orange-500/10', sign: '−' },
                { label: 'FICA (SS + Medicare)',      value: -taxBreakdown.fica,             color: 'text-yellow-400',  bg: 'bg-yellow-500/10',    sign: '−' },
              ].map(({ label, value, color, bg, sign }) => (
                <div key={label} className={`flex justify-between items-center px-3 py-2 rounded-xl ${bg}`}>
                  <span className="text-sm text-[#94A3B8]">{label}</span>
                  <span className={`text-sm font-semibold tabular-nums ${color}`}>
                    {sign}{formatCurrency(Math.abs(value))}
                  </span>
                </div>
              ))}
              <div className="flex justify-between items-center px-3 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30">
                <span className="text-sm font-semibold text-[#F8FAFC]">Annual Take-Home</span>
                <span className="text-sm font-bold text-emerald-400 tabular-nums">{formatCurrency(taxBreakdown.net)}</span>
              </div>
            </div>

            {/* Monthly summary */}
            <div className="flex flex-col justify-center gap-3">
              {[
                { label: 'Monthly Gross',       value: taxBreakdown.gross / 12,             color: 'text-[#F8FAFC]' },
                { label: 'Monthly 401k',        value: -(taxBreakdown.preTaxDeductions / 12), color: 'text-amber-400' },
                { label: 'Monthly Taxes',       value: -(taxBreakdown.totalTax / 12),        color: 'text-red-400' },
                { label: 'Monthly Take-Home',   value: taxBreakdown.net / 12,               color: 'text-emerald-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex justify-between">
                  <span className="text-sm text-[#94A3B8]">{label}</span>
                  <span className={`text-sm font-semibold tabular-nums ${color}`}>
                    {value < 0 ? '−' : ''}{formatCurrency(Math.abs(value))}
                  </span>
                </div>
              ))}
              <div className="mt-2 pt-3 border-t border-[#334155]">
                <p className="text-xs text-[#64748B]">Effective total rate (incl. 401k)</p>
                <p className="text-lg font-bold text-[#F8FAFC]">{(taxBreakdown.effectiveTotalRate * 100).toFixed(1)}%</p>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Federal {(taxBreakdown.effectiveFederalRate * 100).toFixed(1)}% · 
                  State {((taxBreakdown.stateTax / taxBreakdown.gross) * 100).toFixed(1)}% · 
                  FICA {((taxBreakdown.fica / taxBreakdown.gross) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Income Sources */}
      <div>
        <div className="mb-4">
          <SectionHeader
            title="Income Sources"
            subtitle="All active income streams"
            action={
              <button
                onClick={() => { setShowForm(true); setEditId(null); reset() }}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-2 rounded-xl transition-colors font-medium"
              >
                <Plus className="w-4 h-4" />
                Add Source
              </button>
            }
          />
        </div>

        <div className="mt-4 grid gap-3">
          {sources.length === 0 && (
            <div className="card text-center py-12 text-slate-500">
              No income sources yet. Add your salary or other income.
            </div>
          )}
          {sources.map((source) => {
            const monthly = normalizeToMonthly(source.amount, source.frequency)
            return (
              <motion.div
                key={source.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="card p-5 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#0B1120] flex items-center justify-center flex-shrink-0 text-xl">
                    {typeIcons[source.type] ?? '💰'}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-[#F8FAFC]">{source.name}</p>
                    <p className="text-xs text-[#64748B] capitalize mt-0.5">
                      {source.type.replace(/_/g, ' ')} · {source.frequency}
                      {!source.taxable && ' · Non-taxable'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right mr-2">
                    <p className="font-semibold text-[#F8FAFC] tabular-nums">{formatCurrency(source.amount)}</p>
                    <p className="text-xs text-[#64748B] tabular-nums">{formatCurrency(monthly)}/mo</p>
                  </div>
                  <button onClick={() => startEdit(source)} className="p-1.5 hover:bg-[#334155] rounded-lg transition-colors">
                    <Edit2 className="w-3.5 h-3.5 text-[#64748B]" />
                  </button>
                  <button onClick={() => handleDelete(source.id)} className="p-1.5 hover:bg-red-900/30 rounded-lg transition-colors">
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Add / Edit Drawer — Income Sources */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40"
              onClick={() => { setShowForm(false); setEditId(null) }}
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-[#0B1120] border-l border-[#1E293B] z-50 overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-white">
                    {editId ? 'Edit Income Source' : 'Add Income Source'}
                  </h2>
                  <button onClick={() => { setShowForm(false); setEditId(null) }} className="p-2 hover:bg-[#1E293B] rounded-xl">
                    <X className="w-5 h-5 text-[#64748B]" />
                  </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <label className="text-xs text-[#94A3B8] mb-1.5 block font-medium">Name *</label>
                    <input {...register('name')} className="w-full bg-[#1E293B] border border-[#334155] rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500 text-sm placeholder:text-[#475569]" placeholder="e.g. Base Salary — Contoso" />
                    {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-[#94A3B8] mb-1.5 block font-medium">Type</label>
                      <select {...register('type')} className="w-full bg-[#1E293B] border border-[#334155] rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500 text-sm">
                        {INCOME_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-[#94A3B8] mb-1.5 block font-medium">Frequency</label>
                      <select {...register('frequency')} className="w-full bg-[#1E293B] border border-[#334155] rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500 text-sm">
                        {FREQUENCIES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-[#94A3B8] mb-1.5 block font-medium">Amount ($) *</label>
                    <input {...register('amount')} type="number" step="100" className="w-full bg-[#1E293B] border border-[#334155] rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500 text-sm" placeholder="165000" />
                    {errors.amount && <p className="text-red-400 text-xs mt-1">{errors.amount.message}</p>}
                  </div>

                  <div>
                    <label className="text-xs text-[#94A3B8] mb-1.5 block font-medium">Annual Growth Rate</label>
                    <input {...register('growthRate')} type="number" step="0.01" min="0" max="1" className="w-full bg-[#1E293B] border border-[#334155] rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500 text-sm" placeholder="0.05" />
                    <p className="text-xs text-[#475569] mt-1">E.g. 0.05 = 5% annual raise</p>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-[#1E293B] rounded-xl">
                    <input {...register('taxable')} type="checkbox" id="taxable" className="w-4 h-4 accent-indigo-500" />
                    <label htmlFor="taxable" className="text-sm text-[#94A3B8] cursor-pointer">Taxable income</label>
                  </div>

                  <div>
                    <label className="text-xs text-[#94A3B8] mb-1.5 block font-medium">Notes</label>
                    <textarea {...register('notes')} rows={2} className="w-full bg-[#1E293B] border border-[#334155] rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500 text-sm placeholder:text-[#475569] resize-none" placeholder="Optional notes..." />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
                  >
                    {loading ? 'Saving...' : editId ? 'Update Source' : 'Add Source'}
                  </button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Pre-Tax Contributions Section */}
      <div>
        <div className="mb-4">
          <SectionHeader
            title="Pre-Tax Contributions"
            subtitle="401k, health insurance, HSA/FSA — reduces your taxable income"
            action={
              <button
                onClick={() => { setShowPretaxForm(true); setPretaxEditId(null); resetPt() }}
                className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white text-sm px-4 py-2 rounded-xl transition-colors font-medium"
              >
                <Plus className="w-4 h-4" />
                Add Deduction
              </button>
            }
          />
        </div>

        {pretaxItems.length > 0 && (
          <div className="mb-4 flex items-center justify-between px-3 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span className="text-sm text-[#94A3B8]">Total monthly pre-tax deductions</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-semibold text-amber-400 tabular-nums">
                {formatCurrency(pretaxItems.reduce((s, d) => s + d.monthlyAmount, 0))}/mo
              </span>
              <span className="text-xs text-[#64748B] ml-2 tabular-nums">
                ({formatCurrency(pretaxItems.reduce((s, d) => s + d.monthlyAmount * 12, 0))}/yr)
              </span>
            </div>
          </div>
        )}

        <div className="grid gap-3">
          {pretaxItems.length === 0 && (
            <div className="card text-center py-10 text-slate-500 text-sm">
              No pre-tax deductions added yet. Add your 401k, health insurance, HSA, etc.
            </div>
          )}
          {pretaxItems.map((item) => {
            const meta = pretaxTypeMap[item.type] ?? { icon: '📋', label: item.type }
            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="card p-5 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0 text-xl">
                    {meta.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-[#F8FAFC]">{item.name}</p>
                    <p className="text-xs text-[#64748B] mt-0.5">{meta.label}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right mr-2">
                    <p className="font-semibold text-amber-400 tabular-nums">{formatCurrency(item.monthlyAmount)}/mo</p>
                    <p className="text-xs text-[#64748B] tabular-nums">{formatCurrency(item.monthlyAmount * 12)}/yr</p>
                  </div>
                  <button onClick={() => startEditPretax(item)} className="p-1.5 hover:bg-[#334155] rounded-lg transition-colors">
                    <Edit2 className="w-3.5 h-3.5 text-[#64748B]" />
                  </button>
                  <button onClick={() => handleDeletePretax(item.id)} className="p-1.5 hover:bg-red-900/30 rounded-lg transition-colors">
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Add / Edit Drawer — Pre-Tax Deductions */}
      <AnimatePresence>
        {showPretaxForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40"
              onClick={() => { setShowPretaxForm(false); setPretaxEditId(null) }}
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-[#0B1120] border-l border-[#1E293B] z-50 overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-white">
                    {pretaxEditId ? 'Edit Deduction' : 'Add Pre-Tax Deduction'}
                  </h2>
                  <button onClick={() => { setShowPretaxForm(false); setPretaxEditId(null) }} className="p-2 hover:bg-[#1E293B] rounded-xl">
                    <X className="w-5 h-5 text-[#64748B]" />
                  </button>
                </div>

                <form onSubmit={handleSubmitPt(onPretaxSubmit)} className="space-y-4">
                  <div>
                    <label className="text-xs text-[#94A3B8] mb-1.5 block font-medium">Name *</label>
                    <input
                      {...registerPt('name')}
                      className="w-full bg-[#1E293B] border border-[#334155] rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-500 text-sm placeholder:text-[#475569]"
                      placeholder="e.g. 401k — Microsoft, BCBS Health"
                    />
                    {errorsPt.name && <p className="text-red-400 text-xs mt-1">{errorsPt.name.message}</p>}
                  </div>

                  <div>
                    <label className="text-xs text-[#94A3B8] mb-1.5 block font-medium">Type</label>
                    <select
                      {...registerPt('type')}
                      className="w-full bg-[#1E293B] border border-[#334155] rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-500 text-sm"
                    >
                      {PRETAX_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-[#94A3B8] mb-1.5 block font-medium">Monthly Amount ($) *</label>
                    <input
                      {...registerPt('monthlyAmount')}
                      type="number"
                      step="1"
                      min="0"
                      className="w-full bg-[#1E293B] border border-[#334155] rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-500 text-sm"
                      placeholder="1875"
                    />
                    {errorsPt.monthlyAmount && <p className="text-red-400 text-xs mt-1">{errorsPt.monthlyAmount.message}</p>}
                    <p className="text-xs text-[#475569] mt-1">Enter the per-paycheck/monthly amount deducted</p>
                  </div>

                  <div>
                    <label className="text-xs text-[#94A3B8] mb-1.5 block font-medium">Notes</label>
                    <textarea
                      {...registerPt('notes')}
                      rows={2}
                      className="w-full bg-[#1E293B] border border-[#334155] rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-500 text-sm placeholder:text-[#475569] resize-none"
                      placeholder="Optional notes..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={pretaxLoading}
                    className="w-full bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
                  >
                    {pretaxLoading ? 'Saving...' : pretaxEditId ? 'Update Deduction' : 'Add Deduction'}
                  </button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
