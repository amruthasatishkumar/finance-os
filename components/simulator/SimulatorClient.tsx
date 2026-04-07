'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Zap, TrendingUp, TrendingDown, RefreshCw, ArrowRight, ArrowUp, ArrowDown, Minus, ChevronDown, ChevronUp, Pencil, X } from 'lucide-react'
import { MetricCard } from '@/components/shared/MetricCard'
import { formatCurrency } from '@/lib/utils'
import { runScenario } from '@/lib/calculations/simulator'
import type { FinancialState, ScenarioResult } from '@/lib/calculations/simulator'

const PRESET_SCENARIOS: Array<{ key: string; name: string; description: string; icon: string; params: any }> = [
  { key: 'job_loss',           name: 'Job Loss',              description: 'Lose income for 6 months then recover',   icon: '📉', params: { monthlyNetIncomeDelta: -8000 } },
  { key: 'salary_bump_30',     name: '30% Raise',             description: 'Negotiate a 30% salary increase',          icon: '🚀', params: { monthlyNetIncomeDelta: 2400 } },
  { key: 'buy_home',           name: 'Buy a Home',            description: '$600k home, 20% down, $1,800 PITI',        icon: '🏠', params: { onceOffAssetDelta: 120000, onceOffLiabilityDelta: 480000, monthlyExpensesDelta: 1800 } },
  { key: 'baby',               name: 'Have a Child',          description: '+$1,500/mo in expenses',                   icon: '👶', params: { monthlyExpensesDelta: 1500 } },
  { key: 'move_to_texas',      name: 'Move to Texas',         description: 'No state income tax (+~$700/mo net)',      icon: '🤠', params: { monthlyNetIncomeDelta: 700 } },
  { key: 'max_401k',           name: 'Max 401(k)',            description: 'Max to $23,500/yr ($1,958/mo)',            icon: '💼', params: { investmentContribDelta: 1000, monthlyNetIncomeDelta: -1000 } },
  { key: 'pay_off_student_loan', name: 'Pay Off Student Loan', description: 'Eliminate $18k student loan',             icon: '🎓', params: { onceOffLiabilityDelta: -18000, monthlyExpensesDelta: -350 } },
  { key: 'startup_equity',     name: 'Join Startup',          description: '-30% salary, +$200k equity (5yr vest)',   icon: '🏗️', params: { monthlyNetIncomeDelta: -2500 } },
  { key: 'rent_spike',         name: 'Rent Spike',            description: '$500/mo rent increase',                    icon: '🏢', params: { monthlyExpensesDelta: 500 } },
  { key: 'emergency',          name: 'Medical Emergency',     description: '$15k unexpected expense',                  icon: '🏥', params: { onceOffAssetDelta: -15000 } },
  { key: 'gc_costs',           name: 'Green Card Costs',      description: '$25k legal & filing fees',                 icon: '🟩', params: { onceOffAssetDelta: -25000 } },
  { key: 'remote_india',       name: 'Remote from India',     description: 'Work from India 3mo, -60% cost of living', icon: '✈️', params: { monthlyExpensesDelta: -2500 } },
]

interface Props {
  summary: any
  simulations: any[]
  assumptions: any
}

// ─── Editable field configs per scenario ─────────────────────────────────────

type FieldDef = { key: string; label: string; default: number; min?: number; max?: number; prefix?: string; suffix?: string; step?: number }

const SCENARIO_FIELDS: Record<string, FieldDef[]> = {
  buy_home: [
    { key: 'homePrice',           label: 'Home Price',                  default: 600000, min: 50000,  max: 5000000, prefix: '$', step: 10000 },
    { key: 'downPct',             label: 'Down Payment',                default: 20,     min: 3,      max: 100,     suffix: '%', step: 1 },
    { key: 'apr',                 label: 'Mortgage APR',                default: 7.0,    min: 1,      max: 20,      suffix: '%', step: 0.1 },
    { key: 'monthlyTaxInsurance', label: 'Monthly Tax + Insurance',     default: 400,    min: 0,      max: 5000,    prefix: '$', step: 50 },
  ],
  salary_bump_30: [
    { key: 'monthlyDelta', label: 'Monthly Income Increase', default: 2400, min: 0, max: 50000, prefix: '$' },
  ],
  job_loss: [
    { key: 'monthlyLoss', label: 'Monthly Income Loss', default: 8000, min: 0, max: 50000, prefix: '$' },
  ],
  baby: [
    { key: 'monthlyExtra', label: 'Monthly Extra Expenses', default: 1500, min: 0, max: 10000, prefix: '$' },
  ],
  move_to_texas: [
    { key: 'monthlySavings', label: 'Monthly Tax Savings', default: 700, min: 0, max: 5000, prefix: '$' },
  ],
  max_401k: [
    { key: 'annualContrib', label: 'Annual 401(k) Contribution', default: 23500, min: 1000, max: 69000, prefix: '$', step: 500 },
  ],
  pay_off_student_loan: [
    { key: 'loanAmount',    label: 'Loan Amount',             default: 18000, min: 0, max: 500000, prefix: '$' },
    { key: 'monthlyPayment', label: 'Monthly Payment Saved',  default: 350,   min: 0, max: 5000,   prefix: '$' },
  ],
  startup_equity: [
    { key: 'salaryCut',    label: 'Monthly Salary Reduction',   default: 2500,   min: 0, max: 20000,   prefix: '$' },
    { key: 'equityValue',  label: 'Estimated Equity Value',     default: 200000, min: 0, max: 5000000, prefix: '$' },
  ],
  rent_spike: [
    { key: 'monthlyIncrease', label: 'Monthly Rent Increase', default: 500, min: 0, max: 10000, prefix: '$' },
  ],
  emergency: [
    { key: 'totalCost', label: 'Emergency Cost', default: 15000, min: 0, max: 500000, prefix: '$' },
  ],
  gc_costs: [
    { key: 'totalFees', label: 'Total Legal & Filing Fees', default: 25000, min: 0, max: 100000, prefix: '$' },
  ],
  remote_india: [
    { key: 'monthlySavings', label: 'Monthly Cost of Living Savings', default: 2500, min: 0, max: 20000, prefix: '$' },
  ],
}

function computeParamsFromFields(key: string, vals: Record<string, number>): any {
  switch (key) {
    case 'buy_home': {
      const loanAmt = vals.homePrice * (1 - vals.downPct / 100)
      const r = vals.apr / 100 / 12
      const n = 360
      const pAndI = r > 0 ? Math.round(loanAmt * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)) : Math.round(loanAmt / n)
      return {
        onceOffAssetDelta:      vals.homePrice * vals.downPct / 100,
        onceOffLiabilityDelta:  loanAmt,
        monthlyExpensesDelta:   pAndI + (vals.monthlyTaxInsurance ?? 400),
      }
    }
    case 'salary_bump_30':      return { monthlyNetIncomeDelta: vals.monthlyDelta }
    case 'job_loss':            return { monthlyNetIncomeDelta: -vals.monthlyLoss }
    case 'baby':                return { monthlyExpensesDelta: vals.monthlyExtra }
    case 'move_to_texas':       return { monthlyNetIncomeDelta: vals.monthlySavings }
    case 'max_401k': {
      const mo = Math.round(vals.annualContrib / 12)
      return { investmentContribDelta: mo, monthlyNetIncomeDelta: -mo }
    }
    case 'pay_off_student_loan': return { onceOffLiabilityDelta: -vals.loanAmount, monthlyExpensesDelta: -vals.monthlyPayment }
    case 'startup_equity':       return { monthlyNetIncomeDelta: -vals.salaryCut }
    case 'rent_spike':           return { monthlyExpensesDelta: vals.monthlyIncrease }
    case 'emergency':            return { onceOffAssetDelta: -vals.totalCost }
    case 'gc_costs':             return { onceOffAssetDelta: -vals.totalFees }
    case 'remote_india':         return { monthlyExpensesDelta: -vals.monthlySavings }
    default: return {}
  }
}

const RISK_CONFIG = {
  low:      { label: 'Low Risk',      bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  medium:   { label: 'Moderate',      bg: 'bg-amber-500/10',   border: 'border-amber-500/30',   text: 'text-amber-400',   dot: 'bg-amber-400' },
  high:     { label: 'High Risk',     bg: 'bg-orange-500/10',  border: 'border-orange-500/30',  text: 'text-orange-400',  dot: 'bg-orange-400' },
  critical: { label: 'Critical',      bg: 'bg-red-500/10',     border: 'border-red-500/30',     text: 'text-red-400',     dot: 'bg-red-400' },
}

function DeltaRow({ label, before, after }: { label: string; before: number; after: number }) {
  const delta = after - before
  const pct = before !== 0 ? (delta / Math.abs(before)) * 100 : 0
  const isPos = delta >= 0
  const isFlat = Math.abs(delta) < 1
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-[#1E293B] last:border-0">
      <span className="text-sm text-[#94A3B8]">{label}</span>
      <div className="flex items-center gap-3">
        <span className="text-sm text-[#64748B] line-through">{formatCurrency(before)}</span>
        <ArrowRight className="w-3.5 h-3.5 text-[#475569]" />
        <span className="text-sm font-semibold text-[#F8FAFC]">{formatCurrency(after)}</span>
        {!isFlat && (
          <span className={`flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded-lg ${isPos ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
            {isPos ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
            {Math.abs(pct).toFixed(1)}%
          </span>
        )}
        {isFlat && <span className="flex items-center gap-0.5 text-xs text-[#475569]"><Minus className="w-3 h-3" />—</span>}
      </div>
    </div>
  )
}

function WealthRow({ label, baseline, scenario }: { label: string; baseline: number; scenario: number }) {
  const delta = scenario - baseline
  const isPos = delta >= 0
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-xs text-[#94A3B8]">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-xs text-[#64748B]">{formatCurrency(baseline, 'USD', true)}</span>
        <ArrowRight className="w-3 h-3 text-[#475569]" />
        <span className="text-xs font-semibold text-[#F8FAFC]">{formatCurrency(scenario, 'USD', true)}</span>
        <span className={`text-xs font-medium ${isPos ? 'text-emerald-400' : 'text-red-400'}`}>
          ({isPos ? '+' : ''}{formatCurrency(delta, 'USD', true)})
        </span>
      </div>
    </div>
  )
}

export function SimulatorClient({ summary, simulations, assumptions }: Props) {
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const [result, setResult]       = useState<ScenarioResult | null>(null)
  const [custom, setCustom]       = useState({ name: '', incomeDelta: 0, expenseDelta: 0, contribDelta: 0 })
  const [showCustom, setShowCustom] = useState(false)
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [fieldValues, setFieldValues] = useState<Record<string, Record<string, number>>>({})
  const [hiddenKeys, setHiddenKeys] = useState<Set<string>>(new Set())

  function deleteScenario(key: string) {
    setHiddenKeys((prev) => new Set([...prev, key]))
    if (activeKey === key) { setActiveKey(null); setResult(null) }
  }
  // Get field values for a scenario, falling back to defaults
  function getVals(key: string): Record<string, number> {
    const fields = SCENARIO_FIELDS[key] ?? []
    const defaults = Object.fromEntries(fields.map((f) => [f.key, f.default]))
    return { ...defaults, ...(fieldValues[key] ?? {}) }
  }

  function setFieldVal(scenarioKey: string, fieldKey: string, val: number) {
    setFieldValues((prev) => ({
      ...prev,
      [scenarioKey]: { ...getVals(scenarioKey), [fieldKey]: val },
    }))
  }

  const financialState: FinancialState = {
    monthlyNetIncome:        summary?.netMonthly ?? 0,
    monthlyExpenses:         summary?.totalExpenses ?? 0,
    totalAssets:             summary?.totalAssets ?? 0,
    totalLiabilities:        summary?.totalLiabilities ?? 0,
    monthlyInvestmentContrib: Math.max(0, summary?.freeCashFlow ?? 0),
    goals: (summary?.goals ?? []).map((g: any) => ({
      id: g.id,
      name: g.name,
      targetAmount: g.targetAmount,
      currentAmount: g.currentAmount,
      targetDate: g.targetDate ? new Date(g.targetDate) : undefined,
      monthlyContrib: g.monthlyContrib,
      annualReturnRate: assumptions?.investmentReturnRate ?? 0.08,
      inflationRate:    assumptions?.inflationRate ?? 0.035,
      isInflationAdjusted: g.isInflationAdjusted,
    })),
    annualReturnRate: assumptions?.investmentReturnRate ?? 0.08,
    inflationRate:    assumptions?.inflationRate ?? 0.035,
  }

  const baselineFCF = financialState.monthlyNetIncome - financialState.monthlyExpenses
  const baselineNW  = financialState.totalAssets - financialState.totalLiabilities

  function selectScenario(key: string) {
    const fields  = SCENARIO_FIELDS[key]
    const params  = fields ? computeParamsFromFields(key, getVals(key)) : (PRESET_SCENARIOS.find((p) => p.key === key)?.params ?? {})
    const r = runScenario(financialState, { key, overrides: params })
    setActiveKey(key)
    setResult(r)
    setShowCustom(false)
  }

  const [customResultName, setCustomResultName] = useState('Custom')

  function runCustom() {
    const r = runScenario(financialState, {
      key: 'custom',
      overrides: {
        monthlyNetIncomeDelta:  custom.incomeDelta,
        monthlyExpensesDelta:   custom.expenseDelta,
        investmentContribDelta: custom.contribDelta,
      },
    })
    setCustomResultName(custom.name.trim() || 'Custom Scenario')
    setActiveKey('custom')
    setResult(r)
  }

  const preset = PRESET_SCENARIOS.find((p) => p.key === activeKey)
  const risk   = result ? RISK_CONFIG[result.riskLevel] : null

  return (
    <div className="space-y-6 p-6">
      {/* Baseline metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Monthly Net"   value={formatCurrency(financialState.monthlyNetIncome)}  icon={<TrendingUp   className="w-5 h-5" />} color="emerald" />
        <MetricCard title="Monthly Spend" value={formatCurrency(financialState.monthlyExpenses)}   icon={<TrendingDown className="w-5 h-5" />} color="amber" />
        <MetricCard title="Free Cash Flow" value={formatCurrency(baselineFCF)}                     icon={<Zap          className="w-5 h-5" />} color="indigo" />
        <MetricCard title="Net Worth"      value={formatCurrency(baselineNW, 'USD', true)}         icon={<TrendingUp   className="w-5 h-5" />} color="violet" />
      </div>

      {/* Two-panel layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">

        {/* LEFT — scenario picker */}
        <div className="lg:col-span-3 space-y-4">
          <p className="text-xs text-[#64748B] font-medium uppercase tracking-wider">Click a scenario to instantly see its impact →</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {PRESET_SCENARIOS.filter((s) => !hiddenKeys.has(s.key)).map((s) => {
              const hasFields = !!SCENARIO_FIELDS[s.key]
              const isEdited  = !!fieldValues[s.key]
              return (
                <div key={s.key} className="relative group/card">
                  <button
                    onClick={() => selectScenario(s.key)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                      activeKey === s.key
                        ? 'border-indigo-500 bg-indigo-600/15 shadow-lg shadow-indigo-900/20'
                        : 'border-[#1E293B] bg-[#1E293B] hover:border-[#334155] hover:bg-[#243044]'
                    }`}
                  >
                    <span className="text-xl block mb-1.5">{s.icon}</span>
                    <p className="text-sm font-medium text-[#F8FAFC] leading-tight pr-5">{s.name}</p>
                    <p className="text-xs text-[#64748B] mt-0.5 leading-tight">{s.description}</p>
                    {isEdited && <span className="mt-1.5 inline-block text-[10px] text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded-full">Edited</span>}
                  </button>
                  {/* Delete button — top-right on hover */}
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteScenario(s.key) }}
                    className="absolute top-2 right-2 opacity-0 group-hover/card:opacity-100 p-1.5 rounded-lg bg-red-900/40 hover:bg-red-800/60 transition-all"
                    title="Remove scenario"
                  >
                    <X className="w-3 h-3 text-red-400" />
                  </button>
                  {/* Edit button — top-right only if also has fields, shift left when shown */}
                  {hasFields && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingKey(s.key) }}
                      className="absolute top-2 right-8 opacity-0 group-hover/card:opacity-100 p-1.5 rounded-lg bg-[#334155]/80 hover:bg-[#475569] transition-all"
                      title="Edit parameters"
                    >
                      <Pencil className="w-3 h-3 text-[#94A3B8]" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
          {hiddenKeys.size > 0 && (
            <button
              onClick={() => setHiddenKeys(new Set())}
              className="text-xs text-[#64748B] hover:text-[#94A3B8] transition-colors underline underline-offset-2"
            >
              Restore {hiddenKeys.size} removed scenario{hiddenKeys.size > 1 ? 's' : ''}
            </button>
          )}

          {/* Custom scenario accordion */}
          <div className="border border-[#1E293B] rounded-xl overflow-hidden">
            <button
              onClick={() => setShowCustom((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3 bg-[#1E293B] hover:bg-[#243044] transition-colors"
            >
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-violet-400" />
                <span className="text-sm font-medium text-[#F8FAFC]">Custom Scenario</span>
              </div>
              {showCustom ? <ChevronUp className="w-4 h-4 text-[#64748B]" /> : <ChevronDown className="w-4 h-4 text-[#64748B]" />}
            </button>
            <AnimatePresence>
              {showCustom && (
                <motion.div
                  initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 space-y-3 bg-[#0F172A]">
                    <div>
                      <label className="text-xs text-[#94A3B8] mb-1.5 block font-medium">Scenario Name</label>
                      <input
                        type="text"
                        value={custom.name}
                        onChange={(e) => setCustom((c) => ({ ...c, name: e.target.value }))}
                        className="w-full bg-[#1E293B] border border-[#334155] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-violet-500 text-sm placeholder:text-[#475569]"
                        placeholder="e.g. Buy Tesla, Side hustle income…"
                      />
                    </div>
                    {[
                      { key: 'incomeDelta',  label: 'Monthly Income Change ($)',          placeholder: '+2000 or -3000' },
                      { key: 'expenseDelta', label: 'Monthly Expense Change ($)',         placeholder: '+500 or -1000' },
                      { key: 'contribDelta', label: 'Investment Contribution Change ($)', placeholder: '+500 or -200' },
                    ].map(({ key, label, placeholder }) => (
                      <div key={key}>
                        <label className="text-xs text-[#94A3B8] mb-1.5 block font-medium">{label}</label>
                        <input
                          type="number"
                          value={(custom as any)[key]}
                          onChange={(e) => setCustom((c) => ({ ...c, [key]: Number(e.target.value) }))}
                          className="w-full bg-[#1E293B] border border-[#334155] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-violet-500 text-sm placeholder:text-[#475569]"
                          placeholder={placeholder}
                        />
                      </div>
                    ))}
                    <button
                      onClick={runCustom}
                      className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm px-4 py-2.5 rounded-xl font-medium transition-colors mt-1"
                    >
                      <Play className="w-4 h-4" />Run Custom Scenario
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* RIGHT — result panel (sticky) */}
        <div className="lg:col-span-2 lg:sticky lg:top-6">
          <AnimatePresence mode="wait">
            {!result ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="border border-dashed border-[#334155] rounded-2xl flex flex-col items-center justify-center py-16 px-6 text-center"
              >
                <div className="w-12 h-12 rounded-full bg-[#1E293B] flex items-center justify-center mb-3">
                  <Play className="w-5 h-5 text-[#475569]" />
                </div>
                <p className="text-[#94A3B8] font-medium text-sm">Select any scenario</p>
                <p className="text-[#475569] text-xs mt-1">Results appear here instantly</p>
              </motion.div>
            ) : (
              <motion.div
                key={result.key}
                initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className={`rounded-2xl border ${risk!.border} overflow-hidden`}
              >
                {/* Result header */}
                <div className={`p-4 ${risk!.bg} border-b ${risk!.border}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{preset?.icon ?? '⚡'}</span>
                      <div>
                        <p className="font-semibold text-white">{preset?.name ?? customResultName}</p>
                        <p className="text-xs text-[#94A3B8] mt-0.5">{preset?.description ?? 'Your custom scenario'}</p>
                      </div>
                    </div>
                    <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-medium ${risk!.text} ${risk!.border} bg-[#0F172A]`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${risk!.dot}`} />
                      {risk!.label}
                    </span>
                  </div>
                  <p className="text-sm text-[#CBD5E1] leading-relaxed">{result.summary}</p>
                </div>

                <div className="p-4 bg-[#0B1120] space-y-4">
                  {/* Monthly impact */}
                  <div>
                    <p className="text-xs font-semibold text-[#475569] uppercase tracking-wider mb-2">Monthly Impact</p>
                    <div className="bg-[#0F172A] rounded-xl px-4">
                      <DeltaRow label="Net Income"    before={financialState.monthlyNetIncome} after={result.monthlyIncomeNew} />
                      <DeltaRow label="Expenses"      before={financialState.monthlyExpenses}  after={result.monthlyExpensesNew} />
                      <DeltaRow
                        label="Free Cash Flow"
                        before={baselineFCF}
                        after={result.monthlyIncomeNew - result.monthlyExpensesNew}
                      />
                    </div>
                  </div>

                  {/* Net worth forecast */}
                  <div>
                    <p className="text-xs font-semibold text-[#475569] uppercase tracking-wider mb-2">Wealth Forecast</p>
                    <div className="bg-[#0F172A] rounded-xl px-4 py-1">
                      <WealthRow label="Net Worth today" baseline={baselineNW}                    scenario={result.netWorthNow} />
                      <WealthRow label="In 5 years"      baseline={result.netWorthIn5YearsBaseline}  scenario={result.netWorthIn5Years} />
                      <WealthRow label="In 10 years"     baseline={result.netWorthIn10YearsBaseline} scenario={result.netWorthIn10Years} />
                    </div>
                  </div>

                  {/* Goal impacts */}
                  {result.goalImpacts.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-[#475569] uppercase tracking-wider mb-2">Goal Impact</p>
                      <div className="space-y-2">
                        {result.goalImpacts.map((gi) => {
                          const improved  = gi.confidenceAfter > gi.confidenceBefore
                          const unchanged = Math.abs(gi.confidenceAfter - gi.confidenceBefore) < 1
                          const delayed   = gi.monthsDelayed > 0
                          return (
                            <div key={gi.id} className="flex items-center justify-between bg-[#0F172A] rounded-xl px-3 py-2.5">
                              <span className="text-sm text-[#CBD5E1] truncate max-w-[55%]">{gi.name}</span>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-xs text-[#64748B]">{gi.confidenceBefore.toFixed(0)}%</span>
                                <ArrowRight className="w-3 h-3 text-[#475569]" />
                                <span className={`text-xs font-semibold ${improved ? 'text-emerald-400' : unchanged ? 'text-[#94A3B8]' : 'text-red-400'}`}>
                                  {gi.confidenceAfter.toFixed(0)}%
                                </span>
                                {delayed && (
                                  <span className="text-xs text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-lg">+{gi.monthsDelayed}mo</span>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Edit Scenario Modal ─────────────────────────────────────────── */}
      <AnimatePresence>
        {editingKey && (() => {
          const scenario = PRESET_SCENARIOS.find((p) => p.key === editingKey)!
          const fields   = SCENARIO_FIELDS[editingKey] ?? []
          const vals     = getVals(editingKey)

          // Live preview for buy_home
          let preview: React.ReactNode = null
          if (editingKey === 'buy_home') {
            const loanAmt = vals.homePrice * (1 - vals.downPct / 100)
            const r = vals.apr / 100 / 12
            const n = 360
            const pAndI = r > 0 ? Math.round(loanAmt * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)) : Math.round(loanAmt / n)
            const totalPITI = pAndI + (vals.monthlyTaxInsurance ?? 400)
            preview = (
              <div className="mt-1 bg-[#0B1120] rounded-xl p-3 border border-[#1E293B] space-y-1.5">
                <p className="text-xs text-[#64748B] uppercase tracking-wide font-medium mb-2">Live estimates</p>
                <div className="flex justify-between text-xs"><span className="text-[#94A3B8]">Down Payment</span><span className="text-white font-medium">{formatCurrency(vals.homePrice * vals.downPct / 100)}</span></div>
                <div className="flex justify-between text-xs"><span className="text-[#94A3B8]">Loan Amount</span><span className="text-white font-medium">{formatCurrency(loanAmt)}</span></div>
                <div className="flex justify-between text-xs"><span className="text-[#94A3B8]">Monthly P&I</span><span className="text-white font-medium">{formatCurrency(pAndI)}</span></div>
                <div className="flex justify-between text-xs border-t border-[#1E293B] pt-1.5 mt-1"><span className="text-[#94A3B8]">Total Monthly PITI</span><span className="text-emerald-400 font-semibold">{formatCurrency(totalPITI)}</span></div>
              </div>
            )
          }

          return (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 z-40" onClick={() => setEditingKey(null)} />
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                className="fixed inset-0 flex items-center justify-center z-50 p-4">
                <div className="bg-[#0B1120] border border-[#1E293B] rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{scenario.icon}</span>
                      <div>
                        <h3 className="text-white font-semibold">{scenario.name}</h3>
                        <p className="text-xs text-[#64748B]">Edit scenario parameters</p>
                      </div>
                    </div>
                    <button onClick={() => setEditingKey(null)} className="p-1.5 rounded-lg hover:bg-[#1E293B] transition-colors">
                      <X className="w-4 h-4 text-[#64748B]" />
                    </button>
                  </div>

                  {/* Fields */}
                  <div className="space-y-3">
                    {fields.map((f) => (
                      <div key={f.key}>
                        <label className="text-xs text-[#94A3B8] mb-1.5 block font-medium">
                          {f.label}{f.prefix ? ` (${f.prefix})` : ''}{f.suffix ? ` (${f.suffix})` : ''}
                        </label>
                        <div className="relative">
                          {f.prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#64748B]">{f.prefix}</span>}
                          <input
                            type="number"
                            step={f.step ?? 1}
                            min={f.min}
                            max={f.max}
                            value={vals[f.key]}
                            onChange={(e) => setFieldVal(editingKey, f.key, Number(e.target.value))}
                            className={`w-full bg-[#1E293B] border border-[#334155] rounded-xl py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 ${f.prefix ? 'pl-7 pr-3' : 'px-3'}`}
                          />
                          {f.suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#64748B]">{f.suffix}</span>}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Live preview */}
                  {preview}

                  {/* Actions */}
                  <div className="flex gap-3 mt-5">
                    <button
                      onClick={() => {
                        setFieldValues((prev) => { const n = { ...prev }; delete n[editingKey]; return n })
                      }}
                      className="flex-1 bg-[#1E293B] hover:bg-[#334155] text-[#94A3B8] py-2.5 rounded-xl text-sm transition-colors"
                    >
                      Reset
                    </button>
                    <button
                      onClick={() => { selectScenario(editingKey); setEditingKey(null) }}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      <Play className="w-4 h-4" />Run Scenario
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )
        })()}
      </AnimatePresence>
    </div>
  )
}
