'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Edit2, Trash2, X, ShoppingCart, Zap, TrendingDown, DollarSign, Check } from 'lucide-react'
import { MetricCard } from '@/components/shared/MetricCard'
import { SectionHeader, AlertBanner } from '@/components/shared/index'
import { formatCurrency, normalizeToMonthly } from '@/lib/utils'
import { createExpense, updateExpense, deleteExpense } from '@/actions/expenses'
import { setBudget, deleteBudget } from '@/actions/budget'
import type { Expense, ExpenseCategory, Budget } from '@/generated/prisma/client'

const schema = z.object({
  name: z.string().min(1, 'Name required'),
  categoryId: z.string().min(1, 'Category required'),
  amount: z.coerce.number().min(0),
  frequency: z.enum(['monthly', 'annual', 'quarterly', 'weekly', 'one_time']).default('monthly'),
  isFixed: z.boolean().default(false),
  isEssential: z.boolean().default(true),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface ExpenseWithCategory extends Expense {
  category: ExpenseCategory
}

interface Props {
  categories: ExpenseCategory[]
  expenses: ExpenseWithCategory[]
  budgets: Budget[]
  totalMonthly: number
  fixedMonthly: number
  netMonthly: number
}

export function ExpensesClient({ categories, expenses, budgets: initialBudgets, totalMonthly, fixedMonthly, netMonthly }: Props) {
  const [items, setItems] = useState(expenses)
  const [budgetMap, setBudgetMap] = useState<Record<string, number>>(
    Object.fromEntries(initialBudgets.map((b) => [b.categoryId, b.monthlyLimit]))
  )
  const [budgetEditing, setBudgetEditing] = useState<string | null>(null)
  const [budgetInput, setBudgetInput] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string>('all')

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { frequency: 'monthly', isFixed: false, isEssential: true },
  })

  const variableMonthly = totalMonthly - fixedMonthly
  const expenseRatio = netMonthly > 0 ? (totalMonthly / netMonthly) * 100 : 0

  const filtered = activeCategory === 'all' ? items : items.filter((e) => e.categoryId === activeCategory)

  async function onSubmit(data: FormData) {
    setLoading(true)
    try {
      if (editId) {
        const updated = await updateExpense(editId, data)
        setItems((prev) => prev.map((e) => (e.id === editId ? { ...e, ...updated, category: e.category } : e)))
      } else {
        const created = await createExpense(data)
        const cat = categories.find((c) => c.id === data.categoryId)!
        setItems((prev) => [...prev, { ...created, category: cat }])
      }
      reset()
      setShowForm(false)
      setEditId(null)
    } finally {
      setLoading(false)
    }
  }

  function startEdit(expense: ExpenseWithCategory) {
    setEditId(expense.id)
    setValue('name', expense.name)
    setValue('categoryId', expense.categoryId)
    setValue('amount', expense.amount)
    setValue('frequency', expense.frequency as any)
    setValue('isFixed', expense.isFixed)
    setValue('isEssential', expense.isEssential)
    setValue('notes', expense.notes ?? '')
    setShowForm(true)
  }

  async function handleDelete(id: string) {
    await deleteExpense(id)
    setItems((prev) => prev.filter((e) => e.id !== id))
  }

  async function saveBudget(categoryId: string) {
    const limit = parseFloat(budgetInput)
    if (isNaN(limit) || limit < 0) { setBudgetEditing(null); return }
    if (limit === 0) {
      await deleteBudget(categoryId)
      setBudgetMap((prev) => { const next = { ...prev }; delete next[categoryId]; return next })
    } else {
      await setBudget(categoryId, limit)
      setBudgetMap((prev) => ({ ...prev, [categoryId]: limit }))
    }
    setBudgetEditing(null)
  }

  return (
    <div className="space-y-8 p-6">
      {expenseRatio > 80 && (
        <AlertBanner type="warning" title={`Your expenses consume ${expenseRatio.toFixed(0)}% of net income. Target under 70%.`} />
      )}

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total Monthly" value={formatCurrency(totalMonthly)} subtitle={`${expenseRatio.toFixed(0)}% of net income`} icon={<ShoppingCart className="w-5 h-5" />} color="amber" />
        <MetricCard title="Fixed Costs" value={formatCurrency(fixedMonthly)} subtitle="Recurring commitments" icon={<Zap className="w-5 h-5" />} color="red" />
        <MetricCard title="Variable Costs" value={formatCurrency(variableMonthly)} subtitle="Flexible spending" icon={<TrendingDown className="w-5 h-5" />} color="violet" />
        <MetricCard title="Remaining" value={formatCurrency(netMonthly - totalMonthly)} subtitle="Free cash flow" icon={<TrendingDown className="w-5 h-5" />} color={netMonthly - totalMonthly >= 0 ? 'emerald' : 'red'} />
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-3 py-1.5 rounded-full text-sm transition-colors ${activeCategory === 'all' ? 'bg-indigo-600 text-white' : 'bg-[#1E293B] text-[#94A3B8] hover:text-white'}`}
        >
          All ({items.length})
        </button>
        {categories.map((cat) => {
          const count = items.filter((e) => e.categoryId === cat.id).length
          if (count === 0) return null
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-full text-sm transition-colors ${activeCategory === cat.id ? 'bg-indigo-600 text-white' : 'bg-[#1E293B] text-[#94A3B8] hover:text-white'}`}
            >
              {cat.icon} {cat.name} ({count})
            </button>
          )
        })}
      </div>

      {/* Budget Overview */}
      {categories.filter((cat) => items.filter((e) => e.categoryId === cat.id).length > 0).length > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Budget vs Actuals</h3>
            <span className="text-xs text-[#64748B]">Click to set limits</span>
          </div>
          <div className="space-y-3">
            {categories.map((cat) => {
              const catExpenses = items.filter((e) => e.categoryId === cat.id)
              if (catExpenses.length === 0) return null
              const actual = catExpenses.reduce((s, e) => s + normalizeToMonthly(e.amount, e.frequency), 0)
              const limit = budgetMap[cat.id]
              const pct = limit ? Math.min(100, (actual / limit) * 100) : null
              const isEditing = budgetEditing === cat.id
              const isOver = limit ? actual > limit : false
              return (
                <div key={cat.id} className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm">{cat.icon}</span>
                      <span className="text-sm text-[#CBD5E1] truncate">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-sm font-medium tabular-nums ${isOver ? 'text-red-400' : 'text-white'}`}>{formatCurrency(actual)}</span>
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-[#64748B]">/</span>
                          <input
                            type="number"
                            value={budgetInput}
                            onChange={(e) => setBudgetInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') saveBudget(cat.id); if (e.key === 'Escape') setBudgetEditing(null) }}
                            autoFocus
                            className="w-20 bg-[#0B1120] border border-indigo-500 rounded-lg px-2 py-0.5 text-white text-xs text-center focus:outline-none"
                            placeholder="0"
                          />
                          <button onClick={() => saveBudget(cat.id)} className="p-0.5 hover:text-emerald-400 text-[#94A3B8]"><Check className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setBudgetEditing(null)} className="p-0.5 hover:text-red-400 text-[#94A3B8]"><X className="w-3.5 h-3.5" /></button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setBudgetEditing(cat.id); setBudgetInput(limit ? String(limit) : '') }}
                          className="text-xs text-[#475569] hover:text-[#94A3B8] transition-colors tabular-nums"
                        >
                          {limit ? `/ ${formatCurrency(limit)}` : '+ set limit'}
                        </button>
                      )}
                    </div>
                  </div>
                  {pct !== null && (
                    <div className="h-1.5 bg-[#334155] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${isOver ? 'bg-red-500' : pct > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Expense list */}
      <div>
        <div className="mb-4">
          <SectionHeader
            title="Expenses"
            subtitle={`${filtered.length} items`}
            action={
              <button onClick={() => { setShowForm(true); setEditId(null); reset() }} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-2 rounded-xl transition-colors font-medium">
                <Plus className="w-4 h-4" />Add Expense
              </button>
            }
          />
        </div>

        <div className="mt-4 grid gap-3">
          {filtered.length === 0 && <div className="card text-center py-12 text-slate-500">No expenses yet.</div>}
          {filtered.map((expense) => {
            const monthly = normalizeToMonthly(expense.amount, expense.frequency)
            return (
              <motion.div key={expense.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-[#0B1120] flex items-center justify-center flex-shrink-0 text-lg">
                    {expense.category.icon ?? '💸'}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-[#F8FAFC] truncate">{expense.name}</p>
                    <div className="flex gap-1.5 mt-0.5 flex-wrap">
                      <span className="text-xs text-[#64748B]">{expense.category.name}</span>
                      {expense.isFixed && <span className="badge-emerald">Fixed</span>}
                      {!expense.isEssential && <span className="badge-amber">Discretionary</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right mr-2">
                    <p className="font-semibold text-[#F8FAFC] tabular-nums">{formatCurrency(expense.amount)}</p>
                    <p className="text-xs text-[#64748B] tabular-nums">{expense.frequency !== 'monthly' ? `${formatCurrency(monthly)}/mo` : ''}</p>
                  </div>
                  <button onClick={() => startEdit(expense)} className="p-1.5 hover:bg-[#334155] rounded-lg transition-colors"><Edit2 className="w-3.5 h-3.5 text-[#64748B]" /></button>
                  <button onClick={() => handleDelete(expense.id)} className="p-1.5 hover:bg-red-900/30 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
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
                  <h2 className="text-lg font-semibold text-white">{editId ? 'Edit Expense' : 'Add Expense'}</h2>
                  <button onClick={() => { setShowForm(false); setEditId(null) }} className="p-2 hover:bg-[#1E293B] rounded-xl"><X className="w-5 h-5 text-[#64748B]" /></button>
                </div>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <label className="text-xs text-[#94A3B8] mb-1.5 block font-medium">Name *</label>
                    <input {...register('name')} className="w-full bg-[#1E293B] border border-[#334155] rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500 text-sm placeholder:text-[#475569]" placeholder="e.g. Rent" />
                    {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
                  </div>
                  <div>
                    <label className="text-xs text-[#94A3B8] mb-1.5 block font-medium">Category</label>
                    <select {...register('categoryId')} className="w-full bg-[#1E293B] border border-[#334155] rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500 text-sm">
                      <option value="">Select category</option>
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                    </select>
                    {errors.categoryId && <p className="text-red-400 text-xs mt-1">{errors.categoryId.message}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-[#94A3B8] mb-1.5 block font-medium">Amount ($)</label>
                      <input {...register('amount')} type="number" step="10" className="w-full bg-[#1E293B] border border-[#334155] rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500 text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-[#94A3B8] mb-1.5 block font-medium">Frequency</label>
                      <select {...register('frequency')} className="w-full bg-[#1E293B] border border-[#334155] rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500 text-sm">
                        <option value="monthly">Monthly</option>
                        <option value="annual">Annual</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="weekly">Weekly</option>
                        <option value="one_time">One-time</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-6 p-3 bg-[#1E293B] rounded-xl">
                    <label className="flex items-center gap-2 text-sm text-[#94A3B8] cursor-pointer">
                      <input {...register('isFixed')} type="checkbox" className="w-4 h-4 accent-indigo-500" />
                      Fixed cost
                    </label>
                    <label className="flex items-center gap-2 text-sm text-[#94A3B8] cursor-pointer">
                      <input {...register('isEssential')} type="checkbox" className="w-4 h-4 accent-indigo-500" />
                      Essential
                    </label>
                  </div>
                  <div>
                    <label className="text-xs text-[#94A3B8] mb-1.5 block font-medium">Notes</label>
                    <textarea {...register('notes')} rows={2} className="w-full bg-[#1E293B] border border-[#334155] rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500 text-sm placeholder:text-[#475569] resize-none" />
                  </div>
                  <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors text-sm">
                    {loading ? 'Saving...' : editId ? 'Update' : 'Add Expense'}
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
