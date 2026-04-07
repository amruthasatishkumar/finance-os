'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { ChevronRight, ChevronLeft, Check, Plus, X } from 'lucide-react'
import { updateProfile, updateAssumptions, completeOnboarding } from '@/actions/profile'
import { createIncomeSource } from '@/actions/income'
import { createExpense, getOrCreateExpenseCategory } from '@/actions/expenses'
import { createLiability } from '@/actions/debt'
import { createAsset } from '@/actions/investments'
import { createGoal } from '@/actions/goals'
import { updateVisaInfo } from '@/actions/h1b'

// Types
interface IncomeRow { name: string; type: string; amount: string; frequency: string }
interface ExpenseRow { name: string; category: string; amount: string; isFixed: boolean; isEssential: boolean }
interface DebtRow { name: string; type: string; balance: string; rate: string; minPayment: string }
interface AssetRow { name: string; type: string; balance: string; currency: string; institution: string }
interface GoalRow {
  id: string; name: string; type: string; icon: string
  target: string; current: string; monthlyContrib: string
  targetDate: string; enabled: boolean
}
interface WizardData {
  name: string; age: string; state: string; homeCountry: string
  visaStatus: string; gcStage: string; visaExpiry: string; sponsorEmployer: string
  income: IncomeRow[]; filingStatus: string
  expenses: ExpenseRow[]
  hasDebts: boolean; debts: DebtRow[]
  assets: AssetRow[]
  goals: GoalRow[]
  riskAppetite: string; planningStyle: string; retirementAge: string
}

const US_STATES = ['Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming']
const STATE_TAX: Record<string, number> = {
  California: 0.093, 'New York': 0.0685, 'New Jersey': 0.0897, Massachusetts: 0.05,
  Washington: 0, Texas: 0, Florida: 0, Nevada: 0, 'South Dakota': 0, Wyoming: 0,
  Illinois: 0.0495, Virginia: 0.0575, Georgia: 0.055, Colorado: 0.044,
}
const INCOME_TYPES = [
  { v: 'salary', l: 'Salary' }, { v: 'bonus', l: 'Bonus' },
  { v: 'rsu', l: 'RSU / Stock' }, { v: 'freelance', l: 'Freelance' }, { v: 'other', l: 'Other' },
]
const DEBT_TYPES = [
  { v: 'student_loan', l: 'Student Loan' }, { v: 'credit_card', l: 'Credit Card' },
  { v: 'auto_loan', l: 'Auto Loan' }, { v: 'personal_loan', l: 'Personal Loan' },
  { v: 'h1b_legal_fee', l: 'H1B / Legal Fee' }, { v: 'mortgage', l: 'Mortgage' }, { v: 'other', l: 'Other' },
]
const ASSET_TYPES = [
  { v: 'checking', l: 'Checking', cur: 'USD' }, { v: 'savings', l: 'Savings', cur: 'USD' },
  { v: '401k', l: '401(k)', cur: 'USD' }, { v: 'roth_ira', l: 'Roth IRA', cur: 'USD' },
  { v: 'hsa', l: 'HSA', cur: 'USD' }, { v: 'brokerage', l: 'Brokerage', cur: 'USD' },
  { v: 'nre_account', l: 'NRE Account', cur: 'INR' }, { v: 'nro_account', l: 'NRO Account', cur: 'INR' },
  { v: 'crypto', l: 'Crypto', cur: 'USD' },
]
const ASSET_ICONS: Record<string, string> = {
  checking: 'bank', savings: 'piggy-bank', '401k': 'building', roth_ira: 'shield-check',
  hsa: 'heart', brokerage: 'trending-up', nre_account: 'flag', nro_account: 'flag',
  crypto: 'bitcoin',
}
const DEFAULT_GOALS: GoalRow[] = [
  { id: '1', name: 'Emergency Fund (12 months)', type: 'emergency_fund', icon: '🛡️', target: '60000', current: '0', monthlyContrib: '1500', targetDate: '', enabled: true },
  { id: '2', name: 'Green Card Legal Fund', type: 'green_card', icon: '🟩', target: '25000', current: '0', monthlyContrib: '500', targetDate: '', enabled: true },
  { id: '3', name: 'Retirement', type: 'retirement', icon: '🏖️', target: '3500000', current: '0', monthlyContrib: '2000', targetDate: '', enabled: true },
  { id: '4', name: 'Debt Payoff', type: 'debt_payoff', icon: '💳', target: '20000', current: '0', monthlyContrib: '800', targetDate: '', enabled: false },
  { id: '5', name: 'Home Down Payment', type: 'home_down_payment', icon: '🏠', target: '120000', current: '0', monthlyContrib: '1000', targetDate: '', enabled: false },
  { id: '6', name: 'Wedding / Life Event', type: 'wedding', icon: '💍', target: '30000', current: '0', monthlyContrib: '500', targetDate: '', enabled: false },
]
const EXPENSE_PRESETS: ExpenseRow[] = [
  { name: 'Rent / Mortgage', category: 'Housing', amount: '', isFixed: true, isEssential: true },
  { name: 'Groceries', category: 'Groceries', amount: '', isFixed: false, isEssential: true },
  { name: 'Dining Out', category: 'Dining Out', amount: '', isFixed: false, isEssential: false },
  { name: 'Car EMI', category: 'Transport', amount: '', isFixed: true, isEssential: true },
  { name: 'Car Insurance', category: 'Transport', amount: '', isFixed: true, isEssential: true },
  { name: 'Electricity', category: 'Utilities', amount: '', isFixed: true, isEssential: true },
  { name: 'Mobile', category: 'Utilities', amount: '', isFixed: true, isEssential: true },
  { name: 'Internet', category: 'Utilities', amount: '', isFixed: true, isEssential: true },
  { name: 'Subscriptions', category: 'Subscriptions', amount: '', isFixed: true, isEssential: false },
  { name: 'Health & Insurance', category: 'Health & Insurance', amount: '', isFixed: true, isEssential: true },
  { name: 'Family Remittance', category: 'Family Remittance', amount: '', isFixed: false, isEssential: false },
  { name: 'Misc / Other', category: 'Misc / Other', amount: '', isFixed: false, isEssential: false },
]
const STEPS = [
  { id: 'welcome',     title: 'Welcome to FinanceOS',    subtitle: 'Your personal financial command center' },
  { id: 'profile',     title: 'About You',                subtitle: 'Basic profile information' },
  { id: 'visa',        title: 'Visa & Immigration',       subtitle: 'H1B-specific tracking' },
  { id: 'income',      title: 'Income',                   subtitle: 'What you earn' },
  { id: 'expenses',    title: 'Monthly Expenses',         subtitle: 'What you spend each month' },
  { id: 'debts',       title: 'Debts',                    subtitle: 'Outstanding loans & liabilities' },
  { id: 'investments', title: 'Savings & Investments',    subtitle: 'Accounts and balances' },
  { id: 'goals',       title: 'Financial Goals',          subtitle: 'What you are working toward' },
  { id: 'risk',        title: 'Risk & Planning Style',    subtitle: 'How you invest and plan' },
  { id: 'done',        title: "You are all set!",         subtitle: 'FinanceOS is ready' },
]
const ic = 'w-full bg-[#1E293B] border border-[#334155] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-500'
const lc = 'text-xs text-slate-400 mb-1.5 block font-medium'

export function OnboardingWizard() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<WizardData>({
    name: '', age: '29', state: 'California', homeCountry: 'India',
    visaStatus: 'h1b', gcStage: 'none', visaExpiry: '', sponsorEmployer: '',
    income: [{ name: 'Primary Salary', type: 'salary', amount: '', frequency: 'annual' }],
    filingStatus: 'single',
    expenses: EXPENSE_PRESETS,
    hasDebts: false, debts: [],
    assets: [],
    goals: DEFAULT_GOALS,
    riskAppetite: 'moderate', planningStyle: 'balanced', retirementAge: '60',
  })

  function set<K extends keyof WizardData>(key: K, val: WizardData[K]) {
    setData((d) => ({ ...d, [key]: val }))
  }
  function addIncome() { set('income', [...data.income, { name: '', type: 'salary', amount: '', frequency: 'annual' }]) }
  function removeIncome(i: number) { if (data.income.length > 1) set('income', data.income.filter((_, idx) => idx !== i)) }
  function updateIncome(i: number, field: keyof IncomeRow, val: string) {
    set('income', data.income.map((r, idx) => idx === i ? { ...r, [field]: val } : r))
  }
  function addDebt() { set('debts', [...data.debts, { name: '', type: 'student_loan', balance: '', rate: '', minPayment: '' }]) }
  function removeDebt(i: number) { set('debts', data.debts.filter((_, idx) => idx !== i)) }
  function updateDebt(i: number, field: keyof DebtRow, val: string) {
    set('debts', data.debts.map((r, idx) => idx === i ? { ...r, [field]: val } : r))
  }
  function addAsset(type: string) {
    const meta = ASSET_TYPES.find((a) => a.v === type)
    set('assets', [...data.assets, { name: meta?.l ?? type, type, balance: '', currency: meta?.cur ?? 'USD', institution: '' }])
  }
  function removeAsset(i: number) { set('assets', data.assets.filter((_, idx) => idx !== i)) }
  function updateAsset(i: number, field: keyof AssetRow, val: string) {
    set('assets', data.assets.map((r, idx) => idx === i ? { ...r, [field]: val } : r))
  }
  function toggleGoal(id: string) { set('goals', data.goals.map((g) => g.id === id ? { ...g, enabled: !g.enabled } : g)) }
  function updateGoal(id: string, field: keyof GoalRow, val: string) {
    set('goals', data.goals.map((g) => g.id === id ? { ...g, [field]: val } : g))
  }
  function removeGoal(id: string) { set('goals', data.goals.filter((g) => g.id !== id)) }
  function addCustomGoal() {
    set('goals', [...data.goals, { id: Math.random().toString(36).slice(2), name: '', type: 'custom', icon: '⭐', target: '', current: '0', monthlyContrib: '', targetDate: '', enabled: true }])
  }
  function updateExpense(i: number, field: keyof ExpenseRow, val: string | boolean) {
    set('expenses', data.expenses.map((r, idx) => idx === i ? { ...r, [field]: val } : r))
  }

  function canProceed(): boolean {
    const id = STEPS[step].id
    if (id === 'profile') return data.name.trim().length > 0
    if (id === 'income') return data.income.some((r) => parseFloat(r.amount) > 0)
    return true
  }

  async function finish() {
    setLoading(true); setError(null)
    try {
      const stateTaxRate = STATE_TAX[data.state] ?? 0.05
      await updateProfile({
        name: data.name || 'User', age: parseInt(data.age) || 29,
        state: data.state, homeCountry: data.homeCountry,
        visaStatus: data.visaStatus, taxFilingStatus: data.filingStatus,
        riskAppetite: data.riskAppetite as any, planningStyle: data.planningStyle as any,
        dependents: 0, avatarColor: '#6366F1',
      })
      await updateAssumptions({
        stateTaxRate, filingStatus: data.filingStatus,
        retirementAge: parseInt(data.retirementAge) || 60,
        emergencyFundMonths: data.visaStatus === 'h1b' ? 12 : 6,
        inflationRate: 0.035, salaryGrowthRate: 0.05,
        investmentReturnRate: data.riskAppetite === 'aggressive' ? 0.10 : data.riskAppetite === 'conservative' ? 0.06 : 0.08,
        lifeExpectancy: 85,
        includeSocialSecurity: data.visaStatus === 'citizen' || data.visaStatus === 'gc',
        safeWithdrawalRate: 0.04, usdToInrRate: 83.5,
      })
      if (data.visaStatus === 'h1b' || data.visaStatus === 'gc_pending') {
        await updateVisaInfo({
          visaType: 'H1B', gcPetitionStage: data.gcStage,
          expiryDate: data.visaExpiry || undefined,
          sponsorEmployer: data.sponsorEmployer || undefined,
          estimatedGcCost: 25000, gcCostSaved: 0,
        })
      }
      for (const inc of data.income) {
        const amt = parseFloat(inc.amount)
        if (!amt || amt <= 0) continue
        await createIncomeSource({
          name: inc.name || 'Income', type: inc.type as any,
          amount: inc.frequency === 'annual' ? amt / 12 : amt,
          frequency: 'monthly', taxable: true, growthRate: 0.05,
        })
      }
      for (const exp of data.expenses) {
        const amt = parseFloat(exp.amount)
        if (!amt || amt <= 0) continue
        const categoryId = await getOrCreateExpenseCategory(exp.category)
        await createExpense({ name: exp.name, categoryId, amount: amt, frequency: 'monthly', isFixed: exp.isFixed, isEssential: exp.isEssential })
      }
      if (data.hasDebts) {
        for (const debt of data.debts) {
          const balance = parseFloat(debt.balance)
          if (!balance || balance <= 0) continue
          await createLiability({
            name: debt.name || 'Debt', type: debt.type as any,
            principalBalance: balance, originalBalance: balance,
            interestRate: parseFloat(debt.rate) / 100 || 0.05,
            minimumPayment: parseFloat(debt.minPayment) || 0,
            extraPayment: 0,
          })
        }
      }
      for (const asset of data.assets) {
        const balance = parseFloat(asset.balance)
        if (isNaN(balance) || balance < 0) continue
        await createAsset({
          name: asset.name || asset.type, type: asset.type,
          balance, currency: asset.currency,
          institution: asset.institution || undefined,
          isForeignAccount: asset.currency !== 'USD',
          contributionYTD: 0,
        })
      }
      for (const goal of data.goals) {
        if (!goal.enabled) continue
        const target = parseFloat(goal.target)
        if (!target || target <= 0) continue
        await createGoal({
          name: goal.name || 'Goal', type: goal.type,
          targetAmount: target, currentAmount: parseFloat(goal.current) || 0,
          monthlyContrib: parseFloat(goal.monthlyContrib) || 0,
          priority: 5, icon: goal.icon,
          targetDate: goal.targetDate || undefined,
          isInflationAdjusted: true,
        })
      }
      await completeOnboarding()
      router.push('/dashboard')
    } catch (e: any) {
      setError(e?.message ?? 'Something went wrong. Please try again.')
    } finally { setLoading(false) }
  }

  const stepContent: Record<string, React.ReactNode> = {
    welcome: (
      <div className="text-center space-y-6">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 12 }} className="text-6xl mb-2">💎</motion.div>
        <p className="text-slate-300 text-base max-w-md mx-auto leading-relaxed">
          FinanceOS is your personal finance operating system — built specifically for H1B visa holders navigating US finances with India ties.
        </p>
        <div className="grid grid-cols-2 gap-2 text-left max-w-md mx-auto">
          {['💼 Income & tax calc','🛡️ Emergency fund tracker','🟩 Green card pipeline','📋 FBAR compliance alerts','🎯 Goal confidence score','💳 Debt payoff strategies','📈 Portfolio projection','🤖 AI financial advisor'].map((f) => (
            <div key={f} className="flex items-center gap-2 text-sm text-slate-300 bg-[#1E293B] rounded-lg px-3 py-2">{f}</div>
          ))}
        </div>
        <p className="text-xs text-slate-500">Takes ~5 minutes · Everything stored locally · No cloud sync</p>
      </div>
    ),
    profile: (
      <div className="space-y-4 max-w-md mx-auto">
        <div>
          <label className={lc}>Your Name *</label>
          <input value={data.name} onChange={(e) => set('name', e.target.value)} className={ic} placeholder="Alex Sharma" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={lc}>Age</label>
            <input type="number" value={data.age} onChange={(e) => set('age', e.target.value)} className={ic} />
          </div>
          <div>
            <label className={lc}>Home Country</label>
            <input value={data.homeCountry} onChange={(e) => set('homeCountry', e.target.value)} className={ic} placeholder="India" />
          </div>
        </div>
        <div>
          <label className={lc}>US State of Residence</label>
          <select value={data.state} onChange={(e) => set('state', e.target.value)} className={ic}>
            {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          {STATE_TAX[data.state] === 0
            ? <p className="text-xs text-emerald-400 mt-1.5">✅ No state income tax in {data.state}!</p>
            : <p className="text-xs text-slate-500 mt-1.5">State tax rate: {((STATE_TAX[data.state] ?? 0.05) * 100).toFixed(1)}%</p>}
        </div>
      </div>
    ),
    visa: (
      <div className="space-y-4 max-w-md mx-auto">
        <div>
          <label className={lc}>Visa Status</label>
          <div className="grid grid-cols-2 gap-2">
            {[{ v: 'h1b', l: '🛂 H1B' },{ v: 'gc_pending', l: '⏳ GC Pending' },{ v: 'gc', l: '🟩 Green Card' },{ v: 'citizen', l: '🇺🇸 Citizen' }].map(({ v, l }) => (
              <button key={v} type="button" onClick={() => set('visaStatus', v)}
                className={`py-3 rounded-xl text-sm font-medium border transition-all ${data.visaStatus === v ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-[#1E293B] border-[#334155] text-slate-400 hover:border-slate-400'}`}>{l}</button>
            ))}
          </div>
        </div>
        {(data.visaStatus === 'h1b' || data.visaStatus === 'gc_pending') && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lc}>H1B Expiry Date</label>
                <input type="date" value={data.visaExpiry} onChange={(e) => set('visaExpiry', e.target.value)} className={ic} />
              </div>
              <div>
                <label className={lc}>Current Employer</label>
                <input value={data.sponsorEmployer} onChange={(e) => set('sponsorEmployer', e.target.value)} className={ic} placeholder="Company Inc." />
              </div>
            </div>
            <div>
              <label className={lc}>GC Petition Stage</label>
              <select value={data.gcStage} onChange={(e) => set('gcStage', e.target.value)} className={ic}>
                <option value="none">Not started</option>
                <option value="perm_in_progress">PERM in progress</option>
                <option value="i140_filed">I-140 filed</option>
                <option value="i140_approved">I-140 approved</option>
                <option value="waiting_priority">Waiting on priority date</option>
                <option value="i485_filed">I-485 filed</option>
                <option value="approved">Approved 🎉</option>
              </select>
            </div>
            <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-xl p-4 text-sm text-indigo-300">
              <p className="font-medium mb-1">H1B Financial Defaults Applied</p>
              <p className="text-xs text-indigo-200/70">Emergency fund = 12 months · Social Security excluded · FBAR monitoring enabled</p>
            </div>
          </>
        )}
      </div>
    ),
    income: (
      <div className="space-y-4 max-w-lg mx-auto">
        <div>
          <label className={lc}>Filing Status</label>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {[{ v: 'single', l: '👤 Single' },{ v: 'married_jointly', l: '👫 Married (Joint)' }].map(({ v, l }) => (
              <button key={v} type="button" onClick={() => set('filingStatus', v)}
                className={`py-2.5 rounded-xl text-xs font-medium border transition-all ${data.filingStatus === v ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-[#1E293B] border-[#334155] text-slate-400 hover:border-slate-400'}`}>{l}</button>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          {data.income.map((row, i) => (
            <div key={i} className="bg-[#1E293B] border border-[#334155] rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white">Income Source {i + 1}</span>
                {data.income.length > 1 && <button onClick={() => removeIncome(i)} className="text-slate-500 hover:text-red-400 transition-colors"><X className="w-4 h-4" /></button>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lc}>Name</label>
                  <input value={row.name} onChange={(e) => updateIncome(i, 'name', e.target.value)} className={ic} placeholder="Primary Salary" />
                </div>
                <div>
                  <label className={lc}>Type</label>
                  <select value={row.type} onChange={(e) => updateIncome(i, 'type', e.target.value)} className={ic}>
                    {INCOME_TYPES.map((t) => <option key={t.v} value={t.v}>{t.l}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lc}>Amount ($)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                    <input type="number" value={row.amount} onChange={(e) => updateIncome(i, 'amount', e.target.value)} className={`${ic} pl-7`} placeholder="165000" />
                  </div>
                </div>
                <div>
                  <label className={lc}>Frequency</label>
                  <select value={row.frequency} onChange={(e) => updateIncome(i, 'frequency', e.target.value)} className={ic}>
                    <option value="annual">Annual</option><option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option><option value="biweekly">Bi-weekly</option>
                  </select>
                </div>
              </div>
              {row.amount && parseFloat(row.amount) > 0 && (
                <p className="text-xs text-emerald-400">≈ ${Math.round(row.frequency === 'annual' ? parseFloat(row.amount) / 12 : parseFloat(row.amount)).toLocaleString()}/mo gross</p>
              )}
            </div>
          ))}
        </div>
        <button onClick={addIncome} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-[#334155] text-slate-400 hover:border-indigo-500 hover:text-indigo-400 transition-all text-sm">
          <Plus className="w-4 h-4" />Add Another Income Source
        </button>
      </div>
    ),
    expenses: (
      <div className="space-y-3 max-w-lg mx-auto">
        <p className="text-xs text-slate-500 mb-3">Enter monthly amounts. Leave blank to skip.</p>
        {data.expenses.map((row, i) => (
          <div key={i} className="bg-[#1E293B] border border-[#334155] rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="flex-1">
              <p className="text-sm text-white font-medium">{row.name}</p>
              <p className="text-xs text-slate-500">{row.isFixed ? 'Fixed' : 'Variable'} · {row.isEssential ? 'Essential' : 'Discretionary'}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-slate-400 text-sm">$</span>
              <input type="number" value={row.amount} onChange={(e) => updateExpense(i, 'amount', e.target.value)}
                className="w-28 bg-[#0B1120] border border-[#475569] rounded-lg px-3 py-1.5 text-white text-sm text-right focus:outline-none focus:border-indigo-500" placeholder="0" />
              <span className="text-xs text-slate-500 w-7">/mo</span>
            </div>
          </div>
        ))}
        <div className="flex justify-between text-sm pt-2 px-1">
          <span className="text-slate-400">Total</span>
          <span className="text-white font-semibold">${data.expenses.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0).toLocaleString()}/mo</span>
        </div>
      </div>
    ),
    debts: (
      <div className="space-y-4 max-w-lg mx-auto">
        <p className="text-sm text-slate-300 mb-3">Do you have any outstanding debts or loans?</p>
        <div className="grid grid-cols-2 gap-3 mb-2">
          {[{ v: false, l: "✅ No debt!" }, { v: true, l: "💳 Yes, I have debts" }].map(({ v, l }) => (
            <button key={String(v)} type="button" onClick={() => { set('hasDebts', v); if (v && data.debts.length === 0) addDebt() }}
              className={`py-3 rounded-xl text-sm font-medium border transition-all ${data.hasDebts === v ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-[#1E293B] border-[#334155] text-slate-400 hover:border-slate-400'}`}>{l}</button>
          ))}
        </div>
        {data.hasDebts && (
          <div className="space-y-3">
            {data.debts.map((row, i) => (
              <div key={i} className="bg-[#1E293B] border border-[#334155] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white">Debt {i + 1}</span>
                  <button onClick={() => removeDebt(i)} className="text-slate-500 hover:text-red-400 transition-colors"><X className="w-4 h-4" /></button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={lc}>Name</label>
                    <input value={row.name} onChange={(e) => updateDebt(i, 'name', e.target.value)} className={ic} placeholder="Student Loan" />
                  </div>
                  <div>
                    <label className={lc}>Type</label>
                    <select value={row.type} onChange={(e) => updateDebt(i, 'type', e.target.value)} className={ic}>
                      {DEBT_TYPES.map((t) => <option key={t.v} value={t.v}>{t.l}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className={lc}>Balance ($)</label>
                    <input type="number" value={row.balance} onChange={(e) => updateDebt(i, 'balance', e.target.value)} className={ic} placeholder="25000" />
                  </div>
                  <div>
                    <label className={lc}>Rate (%/yr)</label>
                    <input type="number" value={row.rate} onChange={(e) => updateDebt(i, 'rate', e.target.value)} className={ic} placeholder="6.5" step="0.1" />
                  </div>
                  <div>
                    <label className={lc}>Min. Payment</label>
                    <input type="number" value={row.minPayment} onChange={(e) => updateDebt(i, 'minPayment', e.target.value)} className={ic} placeholder="350" />
                  </div>
                </div>
              </div>
            ))}
            <button onClick={addDebt} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-[#334155] text-slate-400 hover:border-red-500/50 hover:text-red-400 transition-all text-sm">
              <Plus className="w-4 h-4" />Add Another Debt
            </button>
          </div>
        )}
      </div>
    ),
    investments: (
      <div className="space-y-4 max-w-lg mx-auto">
        <p className="text-xs text-slate-500 mb-1">Click to add accounts. NRE/NRO balances in INR.</p>
        <div className="flex flex-wrap gap-2 mb-2">
          {ASSET_TYPES.filter((t) => !data.assets.some((a) => a.type === t.v)).map((type) => (
            <button key={type.v} onClick={() => addAsset(type.v)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-[#1E293B] border border-[#334155] text-slate-300 hover:border-indigo-500 hover:text-indigo-400 transition-all">
              <Plus className="w-3 h-3" />{type.l}
            </button>
          ))}
        </div>
        {data.assets.length === 0 && <div className="text-center py-6 text-slate-500 text-sm">Click account types above to add balances</div>}
        <div className="space-y-2">
          {data.assets.map((row, i) => {
            const meta = ASSET_TYPES.find((t) => t.v === row.type)
            return (
              <div key={i} className="bg-[#1E293B] border border-[#334155] rounded-xl px-4 py-3 flex items-center gap-3">
                <span className="text-base shrink-0">{meta ? ASSET_TYPES.indexOf(meta) < 4 ? '🏦' : meta.v === '401k' ? '🏢' : meta.v === 'roth_ira' ? '🦺' : meta.v === 'hsa' ? '🏥' : meta.v.includes('nre') || meta.v.includes('nro') ? '🇮🇳' : meta.v === 'crypto' ? '₿' : '📈' : '📦'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{meta?.l ?? row.type}</p>
                  <input value={row.institution} onChange={(e) => updateAsset(i, 'institution', e.target.value)}
                    className="w-full mt-0.5 bg-transparent text-xs text-slate-400 focus:outline-none placeholder:text-slate-600" placeholder="Institution (optional)" />
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-slate-500">{row.currency}</span>
                  <input type="number" value={row.balance} onChange={(e) => updateAsset(i, 'balance', e.target.value)}
                    className="w-28 bg-[#0B1120] border border-[#475569] rounded-lg px-3 py-1.5 text-white text-sm text-right focus:outline-none focus:border-indigo-500" placeholder="0" />
                </div>
                <button onClick={() => removeAsset(i)} className="text-slate-600 hover:text-red-400 transition-colors shrink-0"><X className="w-4 h-4" /></button>
              </div>
            )
          })}
        </div>
        {data.assets.length > 0 && (
          <div className="flex justify-between text-sm pt-1 px-1">
            <span className="text-slate-400">Total (USD equiv)</span>
            <span className="text-emerald-400 font-semibold">${data.assets.reduce((s, a) => s + ((parseFloat(a.balance) || 0) / (a.currency === 'INR' ? 83.5 : 1)), 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          </div>
        )}
      </div>
    ),
    goals: (
      <div className="space-y-3 max-w-lg mx-auto">
        <p className="text-xs text-slate-500 mb-3">Toggle goals on/off · edit targets · add your own</p>
        {data.goals.map((goal) => (
          <div key={goal.id} className={`rounded-xl border transition-all ${goal.enabled ? 'border-indigo-500/40 bg-indigo-500/5' : 'border-[#334155] bg-[#1E293B]/50'}`}>
            <div className="flex items-center gap-3 px-4 py-3">
              <span className="text-xl shrink-0">{goal.icon}</span>
              <div className="flex-1 min-w-0">
                {goal.type === 'custom'
                  ? <input value={goal.name} onChange={(e) => updateGoal(goal.id, 'name', e.target.value)} className="w-full bg-transparent text-sm font-medium text-white focus:outline-none placeholder:text-slate-500" placeholder="Goal name..." />
                  : <p className="text-sm font-medium text-white truncate">{goal.name}</p>}
              </div>
              <button type="button" onClick={() => toggleGoal(goal.id)}
                className={`shrink-0 w-9 h-5 rounded-full transition-all relative ${goal.enabled ? 'bg-indigo-600' : 'bg-slate-700'}`}>
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${goal.enabled ? 'left-[18px]' : 'left-0.5'}`} />
              </button>
              <button onClick={() => removeGoal(goal.id)} className="shrink-0 text-slate-600 hover:text-red-400 transition-colors ml-1"><X className="w-3.5 h-3.5" /></button>
            </div>
            {goal.enabled && (
              <div className="grid grid-cols-3 gap-2 px-4 pb-3 border-t border-[#334155]/50 pt-3">
                <div>
                  <label className="text-[10px] text-slate-500 mb-1 block">Target ($)</label>
                  <input type="number" value={goal.target} onChange={(e) => updateGoal(goal.id, 'target', e.target.value)}
                    className="w-full bg-[#0B1120] border border-[#475569] rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 mb-1 block">Current ($)</label>
                  <input type="number" value={goal.current} onChange={(e) => updateGoal(goal.id, 'current', e.target.value)}
                    className="w-full bg-[#0B1120] border border-[#475569] rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 mb-1 block">/mo Contrib</label>
                  <input type="number" value={goal.monthlyContrib} onChange={(e) => updateGoal(goal.id, 'monthlyContrib', e.target.value)}
                    className="w-full bg-[#0B1120] border border-[#475569] rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-indigo-500" />
                </div>
              </div>
            )}
          </div>
        ))}
        <button onClick={addCustomGoal} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-[#334155] text-slate-400 hover:border-indigo-500 hover:text-indigo-400 transition-all text-sm">
          <Plus className="w-4 h-4" />Add Custom Goal
        </button>
        <div className="flex justify-between text-sm pt-1 px-1">
          <span className="text-slate-400">{data.goals.filter((g) => g.enabled).length} goals enabled</span>
          <span className="text-white font-semibold">${data.goals.filter((g) => g.enabled).reduce((s, g) => s + (parseFloat(g.monthlyContrib) || 0), 0).toLocaleString()}/mo total</span>
        </div>
      </div>
    ),
    risk: (
      <div className="space-y-6 max-w-md mx-auto">
        <div>
          <label className={lc}>Risk Appetite</label>
          <div className="space-y-2">
            {[
              { v: 'conservative', l: '🛡️ Conservative', d: '60% bonds/40% stocks · ~6% projected return' },
              { v: 'moderate', l: '⚖️ Moderate', d: '60% stocks/40% bonds · ~8% projected return' },
              { v: 'aggressive', l: '🚀 Aggressive', d: '90%+ stocks · ~10% projected return · high volatility' },
            ].map(({ v, l, d }) => (
              <button key={v} type="button" onClick={() => set('riskAppetite', v)}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${data.riskAppetite === v ? 'bg-indigo-600/20 border-indigo-500 text-white' : 'bg-[#1E293B] border-[#334155] text-slate-400 hover:border-slate-400'}`}>
                <p className="text-sm font-medium">{l}</p><p className="text-xs mt-0.5 opacity-70">{d}</p>
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className={lc}>Planning Style</label>
          <div className="space-y-2">
            {[
              { v: 'aggressive_saver', l: '💪 Aggressive Saver', d: 'Maximize savings, minimize lifestyle' },
              { v: 'balanced', l: '🌟 Balanced', d: 'Save consistently while enjoying life' },
              { v: 'lifestyle_optimizer', l: '✨ Lifestyle Optimizer', d: 'Enjoy now, still hit long-term targets' },
            ].map(({ v, l, d }) => (
              <button key={v} type="button" onClick={() => set('planningStyle', v)}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${data.planningStyle === v ? 'bg-indigo-600/20 border-indigo-500 text-white' : 'bg-[#1E293B] border-[#334155] text-slate-400 hover:border-slate-400'}`}>
                <p className="text-sm font-medium">{l}</p><p className="text-xs mt-0.5 opacity-70">{d}</p>
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className={lc}>Target Retirement Age</label>
          <input type="number" value={data.retirementAge} onChange={(e) => set('retirementAge', e.target.value)} className={ic} min="45" max="80" />
        </div>
      </div>
    ),
    done: (
      <div className="text-center space-y-6">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 10 }} className="text-7xl">🎉</motion.div>
        <div>
          <h2 className="text-2xl font-bold text-white">Welcome{data.name ? `, ${data.name.split(' ')[0]}` : ''}!</h2>
          <p className="text-slate-400 mt-2 text-sm">Here is what FinanceOS will create for you:</p>
        </div>
        <div className="text-left space-y-2 max-w-xs mx-auto">
          {[
            `${data.income.filter((r) => parseFloat(r.amount) > 0).length} income source(s)`,
            `${data.expenses.filter((r) => parseFloat(r.amount) > 0).length} expense categories`,
            data.hasDebts ? `${data.debts.filter((r) => parseFloat(r.balance) > 0).length} debt account(s)` : 'No debts recorded',
            `${data.assets.filter((r) => r.balance !== '').length} asset account(s)`,
            `${data.goals.filter((g) => g.enabled).length} financial goal(s)`,
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 text-sm text-slate-300">
              <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center shrink-0"><Check className="w-3.5 h-3.5 text-white" /></div>
              {item}
            </div>
          ))}
        </div>
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 text-xs text-amber-300 text-left">
          💡 You can edit any data later — each section (Income, Expenses, Goals, etc.) lets you add, update, or delete entries at any time.
        </div>
        {error && <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-xs text-red-300">{error}</div>}
      </div>
    ),
  }

  return (
    <div className="w-full max-w-xl">
      <div className="mb-8">
        <div className="flex justify-between text-xs text-slate-500 mb-2">
          <span>Step {step + 1} of {STEPS.length}</span>
          <span>{Math.round((step / (STEPS.length - 1)) * 100)}%</span>
        </div>
        <div className="h-1.5 bg-[#1E293B] rounded-full overflow-hidden">
          <motion.div animate={{ width: `${(step / (STEPS.length - 1)) * 100}%` }} transition={{ duration: 0.4 }}
            className="h-full bg-gradient-to-r from-indigo-600 to-emerald-500 rounded-full" />
        </div>
        <div className="flex gap-1.5 mt-3 justify-center">
          {STEPS.map((_, i) => (
            <div key={i} className={`rounded-full transition-all duration-300 ${i === step ? 'w-6 h-1.5 bg-indigo-500' : i < step ? 'w-1.5 h-1.5 bg-emerald-500' : 'w-1.5 h-1.5 bg-[#334155]'}`} />
          ))}
        </div>
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}
          className="bg-[#0F1A2E] border border-[#1E293B] rounded-2xl p-8">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-white">{STEPS[step].title}</h1>
            <p className="text-slate-400 text-sm mt-1">{STEPS[step].subtitle}</p>
          </div>
          <div className="max-h-[55vh] overflow-y-auto pr-1">
            {stepContent[STEPS[step].id]}
          </div>
          <div className="flex gap-3 mt-8">
            {step > 0 && (
              <button onClick={() => setStep((s) => s - 1)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#334155] text-slate-300 hover:border-slate-400 transition-colors text-sm">
                <ChevronLeft className="w-4 h-4" />Back
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button onClick={() => setStep((s) => s + 1)} disabled={!canProceed()}
                className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white py-2.5 rounded-xl font-medium transition-colors text-sm">
                Continue<ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={finish} disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-2.5 rounded-xl font-medium transition-colors text-sm">
                {loading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Setting up…</> : 'Go to Dashboard →'}
              </button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
