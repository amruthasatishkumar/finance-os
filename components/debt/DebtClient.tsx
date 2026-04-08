'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Edit2, Trash2, X, CreditCard, TrendingDown, Zap, Target, History } from 'lucide-react'
import { MetricCard } from '@/components/shared/MetricCard'
import { SectionHeader, AlertBanner } from '@/components/shared/index'
import { FinanceBarChart } from '@/components/charts/index'
import { formatCurrency, formatPercent } from '@/lib/utils'
import { calcDebtAvalanche, calcDebtSnowball } from '@/lib/calculations/debt'
import { createLiability, updateLiability, deleteLiability, recordDebtPayment, getDebtPayments } from '@/actions/debt'
import type { Liability, DebtPayment } from '@/generated/prisma/client'

type LiabilityWithPayments = Liability & { payments: DebtPayment[] }

const schema = z.object({
  name: z.string().min(1),
  type: z.enum(['student_loan', 'auto_loan', 'credit_card', 'mortgage', 'personal_loan', 'h1b_legal_fee', 'other']),
  principalBalance: z.coerce.number().min(0),
  originalBalance: z.coerce.number().min(0),
  interestRate: z.coerce.number().min(0).max(1),
  minimumPayment: z.coerce.number().min(0),
  extraPayment: z.coerce.number().min(0).default(0),
  lender: z.string().optional(),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Props {
  liabilities: LiabilityWithPayments[]
  totalDebt: number
  netMonthly: number
  debtBurdenRatio: number
  freeCashFlow: number
}

const TYPE_LABELS: Record<string, string> = {
  student_loan: '🎓 Student Loan', auto_loan: '🚗 Auto Loan', credit_card: '💳 Credit Card',
  mortgage: '🏠 Mortgage', personal_loan: '💵 Personal Loan', h1b_legal_fee: '⚖️ H1B Legal Fee', other: '📋 Other',
}

export function DebtClient({ liabilities, totalDebt, netMonthly, debtBurdenRatio, freeCashFlow }: Props) {
  const [items, setItems] = useState(liabilities)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [extraPayment, setExtraPayment] = useState(0)
  const [strategy, setStrategy] = useState<'avalanche' | 'snowball'>('avalanche')
  const [loading, setLoading] = useState(false)
  // Payment state
  const [paymentLiabilityId, setPaymentLiabilityId] = useState<string | null>(null)
  const [payAmount, setPayAmount] = useState('')
  const [payPrincipal, setPayPrincipal] = useState('')
  const [payInterest, setPayInterest] = useState('')
  const [payNotes, setPayNotes] = useState('')
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0])
  const [payLoading, setPayLoading] = useState(false)
  // History state
  const [historyLiabilityId, setHistoryLiabilityId] = useState<string | null>(null)
  const [payments, setPayments] = useState<DebtPayment[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'student_loan', extraPayment: 0 },
  })

  const debtAccounts = items.map((l) => ({
    id: l.id, name: l.name,
    principalBalance: l.principalBalance,
    interestRate: l.interestRate,
    minimumPayment: l.minimumPayment,
  }))

  const payoffResult = useMemo(() => {
    if (debtAccounts.length === 0) return null
    return strategy === 'avalanche'
      ? calcDebtAvalanche(debtAccounts, extraPayment)
      : calcDebtSnowball(debtAccounts, extraPayment)
  }, [items, extraPayment, strategy])

  const avalanche = useMemo(() => debtAccounts.length > 0 ? calcDebtAvalanche(debtAccounts, extraPayment) : null, [items, extraPayment])
  const snowball = useMemo(() => debtAccounts.length > 0 ? calcDebtSnowball(debtAccounts, extraPayment) : null, [items, extraPayment])

  const interestSaved = avalanche && snowball
    ? snowball.totalInterestPaid - avalanche.totalInterestPaid
    : 0

  async function onSubmit(data: FormData) {
    setLoading(true)
    try {
      if (editId) {
        const updated = await updateLiability(editId, data)
        setItems((prev) => prev.map((l) => (l.id === editId ? { ...l, ...updated } : l)))
      } else {
        const created = await createLiability(data)
        setItems((prev) => [...prev, { ...created, payments: [] }])
      }
      reset()
      setShowForm(false)
      setEditId(null)
    } finally {
      setLoading(false)
    }
  }

  function startEdit(l: LiabilityWithPayments) {
    setEditId(l.id)
    setValue('name', l.name)
    setValue('type', l.type as any)
    setValue('principalBalance', l.principalBalance)
    setValue('originalBalance', l.originalBalance)
    setValue('interestRate', l.interestRate)
    setValue('minimumPayment', l.minimumPayment)
    setValue('extraPayment', l.extraPayment)
    setValue('lender', l.lender ?? '')
    setValue('notes', l.notes ?? '')
    setShowForm(true)
  }

  async function handlePayment() {
    if (!paymentLiabilityId) return
    const amount = parseFloat(payAmount)
    const principal = parseFloat(payPrincipal)
    const interest = parseFloat(payInterest)
    if (isNaN(amount) || amount <= 0) return
    setPayLoading(true)
    try {
      await recordDebtPayment({
        liabilityId: paymentLiabilityId,
        amount,
        principal: isNaN(principal) ? amount : principal,
        interest: isNaN(interest) ? 0 : interest,
        notes: payNotes || undefined,
        date: payDate,
      })
      // Update the principalBalance in our local state
      const principalPaid = isNaN(principal) ? amount : principal
      setItems((prev) => prev.map((l) =>
        l.id === paymentLiabilityId
          ? { ...l, principalBalance: Math.max(0, l.principalBalance - principalPaid) }
          : l
      ))
      setPaymentLiabilityId(null)
      setPayAmount('')
      setPayPrincipal('')
      setPayInterest('')
      setPayNotes('')
      setPayDate(new Date().toISOString().split('T')[0])
    } finally {
      setPayLoading(false)
    }
  }

  async function openHistory(liabilityId: string) {
    setHistoryLiabilityId(liabilityId)
    setHistoryLoading(true)
    const data = await getDebtPayments(liabilityId)
    setPayments(data)
    setHistoryLoading(false)
  }

  async function handleDelete(id: string) {
    await deleteLiability(id)
    setItems((prev) => prev.filter((l) => l.id !== id))
  }

  const chartData = items.map((l) => ({
    label: l.name.length > 12 ? l.name.substring(0, 12) + '…' : l.name,
    balance: Math.round(l.principalBalance),
    payment: Math.round(l.minimumPayment),
  }))

  return (
    <div className="space-y-8 p-6">
      {debtBurdenRatio > 0.36 && (
        <AlertBanner type="warning" title={`Your debt-to-income ratio is ${formatPercent(debtBurdenRatio * 100)}. Financial advisors recommend under 36%.`} />
      )}

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total Debt" value={formatCurrency(totalDebt, 'USD', true)} subtitle={`${items.length} accounts`} icon={<CreditCard className="w-5 h-5" />} color="red" />
        <MetricCard title="Debt-to-Income" value={formatPercent(debtBurdenRatio * 100)} subtitle="Target: < 36%" icon={<TrendingDown className="w-5 h-5" />} color={debtBurdenRatio > 0.36 ? 'red' : 'emerald'} />
        <MetricCard title="Min. Payments" value={formatCurrency(items.reduce((s, l) => s + l.minimumPayment, 0))} subtitle="Required monthly" icon={<Zap className="w-5 h-5" />} color="amber" />
        {payoffResult && <MetricCard title="Debt-Free In" value={`${payoffResult.monthsToPayoff} mo`} subtitle={`${(payoffResult.monthsToPayoff / 12).toFixed(1)} years`} icon={<Target className="w-5 h-5" />} color="violet" />}
      </div>

      {/* Payoff Simulator */}
      {items.length > 0 && (
        <div className="card p-5">
          <h3 className="font-semibold text-white mb-4">Payoff Strategy Simulator</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-xs text-[#94A3B8] mb-1.5 block font-medium">Extra monthly payment</label>
                <input
                  type="range" min="0" max={Math.min(freeCashFlow, 2000)} step="50"
                  value={extraPayment} onChange={(e) => setExtraPayment(Number(e.target.value))}
                  className="w-full accent-indigo-500"
                />
                <div className="flex justify-between text-xs text-[#64748B] mt-1">
                  <span>$0</span>
                  <span className="text-indigo-400 font-medium">+{formatCurrency(extraPayment)}</span>
                  <span>{formatCurrency(Math.min(freeCashFlow, 2000))}</span>
                </div>
              </div>
              <div className="flex gap-3">
                {(['avalanche', 'snowball'] as const).map((s) => (
                  <button key={s} onClick={() => setStrategy(s)} className={`flex-1 py-2 rounded-xl text-sm capitalize transition-colors ${strategy === s ? 'bg-indigo-600 text-white' : 'bg-[#1E293B] text-[#94A3B8] hover:text-white'}`}>
                    {s}
                  </button>
                ))}
              </div>
              {avalanche && snowball && (
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div className="bg-[#1E293B] rounded-xl p-3">
                    <p className="text-xs text-[#94A3B8]">Avalanche saves</p>
                    <p className="text-emerald-400 font-semibold">{formatCurrency(Math.abs(interestSaved))}</p>
                    <p className="text-xs text-[#64748B]">vs snowball in interest</p>
                  </div>
                  <div className="bg-[#1E293B] rounded-xl p-3">
                    <p className="text-xs text-[#94A3B8]">Total interest</p>
                    <p className="text-white font-semibold">{formatCurrency(payoffResult?.totalInterestPaid ?? 0)}</p>
                    <p className="text-xs text-[#64748B]">with {strategy}</p>
                  </div>
                </div>
              )}
            </div>
            {chartData.length > 0 && (
              <FinanceBarChart
                data={chartData}
                bars={[{ key: 'balance', label: 'Balance', color: '#EF4444' }, { key: 'payment', label: 'Min. Payment', color: '#6366F1' }]}
                height={200}
              />
            )}
          </div>
        </div>
      )}

      {/* Debt list */}
      <div>
        <div className="mb-4">
          <SectionHeader
            title="Debt Accounts"
            subtitle={`${items.length} active liabilities`}
            action={
              <button onClick={() => { setShowForm(true); setEditId(null); reset() }} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-2 rounded-xl transition-colors font-medium">
                <Plus className="w-4 h-4" />Add Debt
              </button>
            }
          />
        </div>
        <div className="mt-4 grid gap-3">
          {items.length === 0 && <div className="card text-center py-12 text-slate-500">No debt accounts. Great job!</div>}
          {items.map((l) => {
            const paidPct = l.originalBalance > 0 ? ((l.originalBalance - l.principalBalance) / l.originalBalance) * 100 : 0
            return (
              <motion.div key={l.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-[#F8FAFC]">{l.name}</p>
                      {l.type === 'h1b_legal_fee' && <span className="badge-amber">H1B</span>}
                    </div>
                    <p className="text-xs text-[#64748B] mt-0.5">{TYPE_LABELS[l.type] ?? l.type} · {l.lender ?? 'Unknown lender'}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-[#F8FAFC] tabular-nums">{formatCurrency(l.principalBalance)}</p>
                    <p className="text-xs text-[#64748B]">{formatPercent(l.interestRate * 100)} APR</p>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-[#64748B] mb-1">
                    <span>{paidPct.toFixed(0)}% paid off</span>
                    <span>Min: {formatCurrency(l.minimumPayment)}/mo</span>
                  </div>
                  <div className="h-1.5 bg-[#334155] rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${paidPct}%` }} />
                  </div>
                </div>
                <div className="flex gap-2 mt-3 justify-end">
                  <button
                    onClick={() => { setPaymentLiabilityId(l.id); setPayAmount(String(l.minimumPayment)); setPayPrincipal(''); setPayInterest(''); setPayNotes(''); setPayDate(new Date().toISOString().split('T')[0]) }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-emerald-600/15 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-600/20 rounded-xl transition-colors font-medium"
                  >
                    <Plus className="w-3 h-3" />Record Payment
                  </button>
                  <button
                    onClick={() => openHistory(l.id)}
                    className="p-1.5 hover:bg-[#334155] rounded-lg transition-colors"
                    title="Payment history"
                  >
                    <History className="w-3.5 h-3.5 text-[#64748B]" />
                  </button>
                  <button onClick={() => startEdit(l)} className="p-1.5 hover:bg-[#334155] rounded-lg transition-colors"><Edit2 className="w-3.5 h-3.5 text-[#64748B]" /></button>
                  <button onClick={() => handleDelete(l.id)} className="p-1.5 hover:bg-red-900/30 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Add/Edit Drawer */}
      {showForm && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-black/60 z-40" onClick={() => { setShowForm(false); setEditId(null) }} />
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed right-0 top-0 h-full w-full max-w-md bg-[#0B1120] border-l border-[#1E293B] z-50 overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-white">{editId ? 'Edit Debt' : 'Add Debt'}</h2>
                <button onClick={() => { setShowForm(false); setEditId(null) }} className="p-2 hover:bg-[#1E293B] rounded-xl"><X className="w-5 h-5 text-[#64748B]" /></button>
              </div>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="text-xs text-[#94A3B8] mb-1.5 block font-medium">Name *</label>
                  <input {...register('name')} className="w-full bg-[#1E293B] border border-[#334155] rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500 text-sm placeholder:text-[#475569]" placeholder="e.g. Federal Student Loan" />
                </div>
                <div>
                  <label className="text-xs text-[#94A3B8] mb-1.5 block font-medium">Type</label>
                  <select {...register('type')} className="w-full bg-[#1E293B] border border-[#334155] rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500 text-sm">
                    {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-[#94A3B8] mb-1.5 block font-medium">Current Balance ($)</label>
                    <input {...register('principalBalance')} type="number" step="100" className="w-full bg-[#1E293B] border border-[#334155] rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-[#94A3B8] mb-1.5 block font-medium">Original Balance ($)</label>
                    <input {...register('originalBalance')} type="number" step="100" className="w-full bg-[#1E293B] border border-[#334155] rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500 text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-[#94A3B8] mb-1.5 block font-medium">Interest Rate (e.g. 0.055)</label>
                    <input {...register('interestRate')} type="number" step="0.001" className="w-full bg-[#1E293B] border border-[#334155] rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500 text-sm" placeholder="0.055" />
                  </div>
                  <div>
                    <label className="text-xs text-[#94A3B8] mb-1.5 block font-medium">Min. Payment ($)</label>
                    <input {...register('minimumPayment')} type="number" step="10" className="w-full bg-[#1E293B] border border-[#334155] rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500 text-sm" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-[#94A3B8] mb-1.5 block font-medium">Lender</label>
                  <input {...register('lender')} className="w-full bg-[#1E293B] border border-[#334155] rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500 text-sm placeholder:text-[#475569]" placeholder="e.g. Navient" />
                </div>
                <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors text-sm">
                  {loading ? 'Saving...' : editId ? 'Update' : 'Add Debt'}
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}

      {/* Record Payment Modal */}
      <AnimatePresence>
        {paymentLiabilityId && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-40" onClick={() => setPaymentLiabilityId(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="fixed inset-0 flex items-center justify-center z-50 p-4">
              <div className="bg-[#0B1120] border border-[#1E293B] rounded-2xl p-6 w-full max-w-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold">Record Payment</h3>
                  <button onClick={() => setPaymentLiabilityId(null)} className="p-1.5 hover:bg-[#1E293B] rounded-lg"><X className="w-4 h-4 text-[#64748B]" /></button>
                </div>
                <div className="space-y-3 mb-4">
                  <div>
                    <label className="text-xs text-[#94A3B8] mb-1 block font-medium">Total Payment ($) *</label>
                    <input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} autoFocus
                      className="w-full bg-[#1E293B] border border-[#334155] rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500 text-sm placeholder:text-[#475569]" placeholder="e.g. 450" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-[#94A3B8] mb-1 block font-medium">Principal ($)</label>
                      <input type="number" value={payPrincipal} onChange={(e) => setPayPrincipal(e.target.value)}
                        className="w-full bg-[#1E293B] border border-[#334155] rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500 text-sm placeholder:text-[#475569]" placeholder="Auto" />
                    </div>
                    <div>
                      <label className="text-xs text-[#94A3B8] mb-1 block font-medium">Interest ($)</label>
                      <input type="number" value={payInterest} onChange={(e) => setPayInterest(e.target.value)}
                        className="w-full bg-[#1E293B] border border-[#334155] rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500 text-sm placeholder:text-[#475569]" placeholder="0" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-[#94A3B8] mb-1 block font-medium">Date</label>
                    <input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)}
                      className="w-full bg-[#1E293B] border border-[#334155] rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-[#94A3B8] mb-1 block font-medium">Notes (optional)</label>
                    <input type="text" value={payNotes} onChange={(e) => setPayNotes(e.target.value)}
                      className="w-full bg-[#1E293B] border border-[#334155] rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500 text-sm placeholder:text-[#475569]" placeholder="e.g. Extra payment" />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setPaymentLiabilityId(null)} className="flex-1 bg-[#1E293B] hover:bg-[#334155] text-[#94A3B8] py-2.5 rounded-xl text-sm transition-colors">Cancel</button>
                  <button onClick={handlePayment} disabled={payLoading} className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-medium transition-colors">
                    {payLoading ? 'Saving...' : 'Record Payment'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Payment History Drawer */}
      <AnimatePresence>
        {historyLiabilityId && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-40" onClick={() => setHistoryLiabilityId(null)} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed right-0 top-0 h-full w-full max-w-sm bg-[#0B1120] border-l border-[#1E293B] z-50 overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-semibold text-white">Payment History</h2>
                    <p className="text-xs text-[#64748B] mt-0.5">{items.find(l => l.id === historyLiabilityId)?.name}</p>
                  </div>
                  <button onClick={() => setHistoryLiabilityId(null)} className="p-2 hover:bg-[#1E293B] rounded-xl"><X className="w-5 h-5 text-[#64748B]" /></button>
                </div>
                {historyLoading ? (
                  <div className="text-[#64748B] text-sm text-center py-12">Loading...</div>
                ) : payments.length === 0 ? (
                  <div className="text-[#64748B] text-sm text-center py-12">No payments recorded yet.</div>
                ) : (
                  <div className="space-y-3">
                    {payments.map((p) => (
                      <div key={p.id} className="bg-[#1E293B] rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-emerald-400 font-semibold text-sm">{formatCurrency(p.amount)}</span>
                          <span className="text-xs text-[#64748B]">{new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                        <div className="flex gap-3 text-xs text-[#94A3B8]">
                          <span>Principal: <span className="text-white">{formatCurrency(p.principal)}</span></span>
                          <span>Interest: <span className="text-white">{formatCurrency(p.interest)}</span></span>
                        </div>
                        {p.notes && <p className="text-xs text-[#64748B] mt-1.5">{p.notes}</p>}
                      </div>
                    ))}
                    <div className="border-t border-[#1E293B] pt-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-[#64748B]">Total paid</span>
                        <span className="text-white font-semibold">{formatCurrency(payments.reduce((s, p) => s + p.amount, 0))}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
