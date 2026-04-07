'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Edit2, Trash2, X, Target, CheckCircle, PauseCircle } from 'lucide-react'
import { MetricCard } from '@/components/shared/MetricCard'
import { ProgressRing } from '@/components/shared/ProgressRing'
import { SectionHeader } from '@/components/shared/index'
import { formatCurrency, monthsUntil } from '@/lib/utils'
import { createGoal, updateGoal, deleteGoal, addGoalContribution } from '@/actions/goals'
import type { Goal, GoalMilestone } from '@/generated/prisma/client'

type GoalWithMilestones = Goal & { milestones: GoalMilestone[] }

const GOAL_TYPES = [
  { value: 'emergency_fund', label: '🛡️ Emergency Fund' },
  { value: 'h1b_renewal', label: '🛂 H1B Renewal Fund' },
  { value: 'green_card', label: '🟩 Green Card Fund' },
  { value: 'debt_payoff', label: '💳 Debt Payoff' },
  { value: 'home_down_payment', label: '🏠 Home Down Payment' },
  { value: 'vehicle', label: '🚗 Vehicle' },
  { value: 'wedding', label: '💍 Wedding' },
  { value: 'travel', label: '✈️ Travel' },
  { value: 'family_support', label: '👨‍👩‍👧 Family Support' },
  { value: 'education', label: '📚 Education' },
  { value: 'retirement', label: '🏖️ Retirement' },
  { value: 'fire', label: '🔥 FIRE' },
  { value: 'custom', label: '⭐ Custom' },
]

const schema = z.object({
  name: z.string().min(1, 'Name required'),
  type: z.string().min(1),
  targetAmount: z.coerce.number().min(1),
  currentAmount: z.coerce.number().min(0).default(0),
  targetDate: z.string().optional(),
  priority: z.coerce.number().min(1).max(10).default(5),
  monthlyContrib: z.coerce.number().min(0).default(0),
  whyItMatters: z.string().optional(),
  isInflationAdjusted: z.boolean().default(true),
  icon: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Props {
  goals: GoalWithMilestones[]
  freeCashFlow: number
  returnRate: number
  inflationRate: number
}

const GOAL_PALETTE = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899', '#84CC16']
const STATUS_ICONS: Record<string, React.ReactNode> = {
  active: <Target className="w-4 h-4 text-indigo-400" />,
  paused: <PauseCircle className="w-4 h-4 text-amber-400" />,
  completed: <CheckCircle className="w-4 h-4 text-emerald-400" />,
}

export function GoalsClient({ goals, freeCashFlow, returnRate, inflationRate }: Props) {
  const [items, setItems] = useState(goals)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [contribGoalId, setContribGoalId] = useState<string | null>(null)
  const [contribAmount, setContribAmount] = useState('')
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { priority: 5, isInflationAdjusted: true, monthlyContrib: 0 },
  })

  const totalAllocated = items.reduce((s, g) => s + g.monthlyContrib, 0)
  const unallocated = freeCashFlow - totalAllocated
  const activeGoals = items.filter((g) => g.status === 'active').length
  const onTrack = items.filter((g) => g.confidenceScore >= 70).length

  async function onSubmit(data: FormData) {
    setLoading(true)
    try {
      if (editId) {
        const updated = await updateGoal(editId, data)
        setItems((prev) => prev.map((g) => (g.id === editId ? { ...g, ...updated } : g)))
      } else {
        const created = await createGoal(data)
        setItems((prev) => [...prev, { ...created, milestones: [] }])
      }
      reset()
      setShowForm(false)
      setEditId(null)
    } finally {
      setLoading(false)
    }
  }

  function startEdit(goal: GoalWithMilestones) {
    setEditId(goal.id)
    setValue('name', goal.name)
    setValue('type', goal.type)
    setValue('targetAmount', goal.targetAmount)
    setValue('currentAmount', goal.currentAmount)
    setValue('targetDate', goal.targetDate ? new Date(goal.targetDate).toISOString().split('T')[0] : '')
    setValue('priority', goal.priority)
    setValue('monthlyContrib', goal.monthlyContrib)
    setValue('whyItMatters', goal.whyItMatters ?? '')
    setValue('isInflationAdjusted', goal.isInflationAdjusted)
    setShowForm(true)
  }

  async function handleDelete(id: string) {
    await deleteGoal(id)
    setItems((prev) => prev.filter((g) => g.id !== id))
  }

  async function handleContrib() {
    if (!contribGoalId) return
    const amount = parseFloat(contribAmount)
    if (isNaN(amount) || amount <= 0) return
    const updated = await addGoalContribution(contribGoalId, amount)
    setItems((prev) => prev.map((g) => (g.id === contribGoalId ? { ...g, currentAmount: updated.currentAmount } : g)))
    setContribGoalId(null)
    setContribAmount('')
  }

  return (
    <div className="space-y-8 p-6">
      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Active Goals" value={activeGoals.toString()} subtitle={`${onTrack} on track`} icon={<Target className="w-5 h-5" />} color="indigo" />
        <MetricCard title="Allocated Monthly" value={formatCurrency(totalAllocated)} subtitle="Across all goals" icon={<Target className="w-5 h-5" />} color="emerald" />
        <MetricCard title="Unallocated" value={formatCurrency(unallocated)} subtitle="Free cash flow left" icon={<Target className="w-5 h-5" />} color={unallocated >= 0 ? 'violet' : 'red'} />
        <MetricCard title="On Track" value={`${activeGoals > 0 ? Math.round((onTrack / items.length) * 100) : 0}%`} subtitle="Goals ≥70% confidence" icon={<CheckCircle className="w-5 h-5" />} color="amber" />
      </div>

      {/* Goal cards */}
      <div>
        <div className="mb-4">
          <SectionHeader
            title="Goals"
            subtitle="Your financial milestones"
            action={
              <button onClick={() => { setShowForm(true); setEditId(null); reset() }} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-2 rounded-xl transition-colors font-medium">
                <Plus className="w-4 h-4" />New Goal
              </button>
            }
          />
        </div>

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
          {items.length === 0 && <div className="card col-span-2 text-center py-12 text-slate-500">No goals yet. Create your first financial goal.</div>}
          {items.map((goal) => {
            const progress = goal.targetAmount > 0 ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100) : 0
            const remaining = goal.targetAmount - goal.currentAmount
            const monthsLeft = goal.targetDate ? monthsUntil(new Date(goal.targetDate)) : null
            const color = goal.color ?? GOAL_PALETTE[0]
            return (
              <motion.div key={goal.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card p-6 flex flex-col gap-0">
                {/* Header */}
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{goal.icon ?? '🎯'}</span>
                    <div>
                      <p className="font-semibold text-white text-base">{goal.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {STATUS_ICONS[goal.status]}
                        <span className="text-xs text-[#94A3B8] capitalize">{goal.type.replace(/_/g, ' ')}</span>
                        {goal.confidenceScore > 0 && (
                          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${goal.confidenceScore >= 70 ? 'bg-emerald-500/15 text-emerald-400' : goal.confidenceScore >= 40 ? 'bg-amber-500/15 text-amber-400' : 'bg-red-500/15 text-red-400'}`}>
                            {Math.round(goal.confidenceScore)}% conf
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <ProgressRing value={progress} size={56} strokeWidth={5} color={color} />
                </div>

                {/* Progress */}
                <div className="space-y-2 mb-5">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#94A3B8]">Progress</span>
                    <span className="text-white font-medium">{formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}</span>
                  </div>
                  <div className="h-2.5 bg-[#334155] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }} animate={{ width: `${progress}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: color }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-[#64748B]">
                    <span>{progress.toFixed(0)}% complete</span>
                    <span>{formatCurrency(remaining)} to go</span>
                  </div>
                </div>

                {/* Stats row */}
                <div className="flex items-center justify-between text-sm mb-4">
                  <span className="text-[#CBD5E1] font-medium">{formatCurrency(goal.monthlyContrib)}<span className="text-[#64748B] font-normal">/mo</span></span>
                  {monthsLeft !== null && (
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${monthsLeft > 0 ? 'bg-indigo-500/10 text-indigo-400' : 'bg-red-500/10 text-red-400'}`}>
                      {monthsLeft > 0 ? `${monthsLeft} mo left` : 'Overdue'}
                    </span>
                  )}
                </div>

                {/* Why it matters */}
                {goal.whyItMatters && (
                  <div className="border-t border-[#334155] pt-4 pb-1 mb-4">
                    <p className="text-xs text-[#94A3B8] italic">"{goal.whyItMatters}"</p>
                  </div>
                )}

                {/* Action buttons — always visible */}
                <div className="flex gap-2 mt-auto pt-1">
                  <button
                    onClick={() => { setContribGoalId(goal.id); setContribAmount('') }}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs bg-emerald-600/15 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-600/20 py-2 rounded-xl transition-colors font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" />Add Funds
                  </button>
                  <button onClick={() => startEdit(goal)} className="flex items-center gap-1.5 px-3 py-2 text-xs bg-[#1E293B] hover:bg-[#334155] text-[#94A3B8] rounded-xl transition-colors">
                    <Edit2 className="w-3.5 h-3.5" />Edit
                  </button>
                  <button onClick={() => handleDelete(goal.id)} className="flex items-center gap-1.5 px-3 py-2 text-xs bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-600/15 rounded-xl transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Add/Edit Drawer */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-40" onClick={() => { setShowForm(false); setEditId(null) }} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed right-0 top-0 h-full w-full max-w-md bg-[#0B1120] border-l border-[#1E293B] z-50 overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-white">{editId ? 'Edit Goal' : 'New Goal'}</h2>
                  <button onClick={() => { setShowForm(false); setEditId(null) }} className="p-2 hover:bg-[#1E293B] rounded-xl"><X className="w-5 h-5 text-[#64748B]" /></button>
                </div>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <label className="text-xs text-[#94A3B8] mb-1.5 block font-medium">Goal Name *</label>
                    <input {...register('name')} className="w-full bg-[#1E293B] border border-[#334155] rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500 text-sm placeholder:text-[#475569]" placeholder="e.g. Green Card Legal Fund" />
                    {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
                  </div>
                  <div>
                    <label className="text-xs text-[#94A3B8] mb-1.5 block font-medium">Type</label>
                    <select {...register('type')} className="w-full bg-[#1E293B] border border-[#334155] rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500 text-sm">
                      {GOAL_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-[#94A3B8] mb-1.5 block font-medium">Target ($) *</label>
                      <input {...register('targetAmount')} type="number" step="100" className="w-full bg-[#1E293B] border border-[#334155] rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500 text-sm" />
                      {errors.targetAmount && <p className="text-red-400 text-xs mt-1">{errors.targetAmount.message}</p>}
                    </div>
                    <div>
                      <label className="text-xs text-[#94A3B8] mb-1.5 block font-medium">Current ($)</label>
                      <input {...register('currentAmount')} type="number" step="100" className="w-full bg-[#1E293B] border border-[#334155] rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500 text-sm" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-[#94A3B8] mb-1.5 block font-medium">Target Date</label>
                      <input {...register('targetDate')} type="date" className="w-full bg-[#1E293B] border border-[#334155] rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500 text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-[#94A3B8] mb-1.5 block font-medium">Monthly Contrib ($)</label>
                      <input {...register('monthlyContrib')} type="number" step="50" className="w-full bg-[#1E293B] border border-[#334155] rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500 text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-[#94A3B8] mb-1.5 block font-medium">Why It Matters</label>
                    <textarea {...register('whyItMatters')} rows={2} className="w-full bg-[#1E293B] border border-[#334155] rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500 text-sm placeholder:text-[#475569] resize-none" placeholder="This gives me peace of mind because..." />
                  </div>
                  <div>
                    <label className="text-xs text-[#94A3B8] mb-1.5 block font-medium">Priority (1-10)</label>
                    <input {...register('priority')} type="number" min="1" max="10" className="w-full bg-[#1E293B] border border-[#334155] rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500 text-sm" />
                  </div>
                  <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors text-sm">
                    {loading ? 'Saving...' : editId ? 'Update Goal' : 'Create Goal'}
                  </button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Contribution Modal */}
      <AnimatePresence>
        {contribGoalId && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-40" onClick={() => setContribGoalId(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="fixed inset-0 flex items-center justify-center z-50 p-4">
              <div className="bg-[#0B1120] border border-[#1E293B] rounded-2xl p-6 w-full max-w-sm">
                <h3 className="text-white font-semibold mb-4">Add Contribution</h3>
                <input
                  type="number"
                  value={contribAmount}
                  onChange={(e) => setContribAmount(e.target.value)}
                  className="w-full bg-[#1E293B] border border-[#334155] rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500 text-sm mb-4 placeholder:text-[#475569]"
                  placeholder="Amount ($)"
                />
                <div className="flex gap-3">
                  <button onClick={() => setContribGoalId(null)} className="flex-1 bg-[#1E293B] hover:bg-[#334155] text-[#94A3B8] py-2.5 rounded-xl text-sm transition-colors">Cancel</button>
                  <button onClick={handleContrib} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl text-sm font-medium transition-colors">Add Funds</button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
