'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { MetricCard } from '@/components/shared/MetricCard'
import { ProgressRing, ProgressBar } from '@/components/shared/ProgressRing'
import { AlertBanner, Badge, CurrencyDisplay, InfoTooltip } from '@/components/shared'
import { FinanceAreaChart, DonutChart } from '@/components/charts'
import {
  TrendingUp, TrendingDown, Shield, Target, AlertTriangle,
  Clock, ArrowRight, Calendar, Zap, ChevronRight, Pencil, Check, X
} from 'lucide-react'
import Link from 'next/link'
import { formatCurrency, formatPercent, daysUntil, getScoreColor, getScoreLabel } from '@/lib/utils'
import { H1B_CONSTANTS } from '@/lib/constants'
import { updateEmergencyFundMonths } from '@/actions/profile'
import type { getFinancialSummary, getSnapshotHistory } from '@/actions/finance'

type Summary = NonNullable<Awaited<ReturnType<typeof getFinancialSummary>>>
type Snapshots = Awaited<ReturnType<typeof getSnapshotHistory>>

interface DashboardClientProps {
  summary: Summary
  history: Snapshots
}

export function DashboardClient({ summary, history }: DashboardClientProps) {
  const [efEditing, setEfEditing] = useState(false)
  const [efMonthsInput, setEfMonthsInput] = useState(String(summary.assumptions?.emergencyFundMonths ?? 12))
  const [efSaving, setEfSaving] = useState(false)

  async function saveEfMonths() {
    const val = parseInt(efMonthsInput)
    if (!val || val < 1 || val > 36) return
    setEfSaving(true)
    await updateEmergencyFundMonths(val)
    setEfEditing(false)
    setEfSaving(false)
  }

  const {
    profile, visaInfo, netWorth, grossMonthly, netMonthly, totalExpenses,
    freeCashFlow, savingsRate, healthScore, healthBreakdown,
    totalAssets, totalLiabilities, liquidAssets, efCoverage, efTarget,
    debtBurdenRatio, goals, fbarStatus, foreignTotal, liabilities,
    investmentRate,
  } = summary

  // Net worth spark data from history
  const nwSparkData = history.map((h) => ({ label: h.month.slice(5), netWorth: h.netWorth }))

  // Top goals
  const topGoals = goals.slice(0, 3)

  // Visa expiry
  const visaExpiryDays = visaInfo?.expiryDate ? daysUntil(new Date(visaInfo.expiryDate)) : null
  const visaAlertType = visaExpiryDays !== null
    ? visaExpiryDays <= 90 ? 'danger'
      : visaExpiryDays <= 180 ? 'warning'
        : null
    : null

  // Cash flow donut
  const cashFlowData = [
    { name: 'Fixed', value: Math.round(summary.fixedExpenses / netMonthly * 100), color: '#6366F1' },
    { name: 'Variable', value: Math.round(summary.variableExpenses / netMonthly * 100), color: '#8B5CF6' },
    { name: 'Savings', value: Math.round(Math.max(0, freeCashFlow) / netMonthly * 100), color: '#10B981' },
  ]

  // Score ring color
  const scoreColor = healthScore >= 80 ? '#10B981' : healthScore >= 60 ? '#F59E0B' : '#EF4444'

  return (
    <div className="space-y-6">
      {/* Visa Alert Banner */}
      {visaAlertType && visaInfo?.expiryDate && (
        <AlertBanner
          type={visaAlertType}
          title={`H1B Visa expires ${visaAlertType === 'danger' ? 'very soon' : 'soon'} — ${visaExpiryDays} days remaining`}
          description={`Your H1B expires ${new Date(visaInfo.expiryDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}. Start the renewal process immediately.`}
          action={
            <Link href="/h1b" className="text-xs font-medium underline">
              Open H1B Command Center →
            </Link>
          }
        />
      )}

      {/* FBAR Alert */}
      {fbarStatus !== 'safe' && (
        <AlertBanner
          type={fbarStatus === 'exceeded' ? 'danger' : 'warning'}
          title={fbarStatus === 'exceeded'
            ? `FBAR required — Foreign accounts total $${foreignTotal.toLocaleString()}, above $10,000 threshold`
            : `FBAR threshold approaching — Foreign accounts at $${foreignTotal.toLocaleString()} (threshold: $10,000)`}
          description="FinCEN 114 (FBAR) must be filed by June 15. Consult a tax professional."
          action={
            <Link href="/h1b" className="text-xs font-medium underline">
              View H1B Center →
            </Link>
          }
        />
      )}

      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-2xl font-bold text-[#F8FAFC]">
            Good morning, {profile.name.split(' ')[0]} 👋
          </h2>
          <p className="text-[#64748B] text-sm mt-0.5">
            April 2026 · Your financial health score is{' '}
            <span className={getScoreColor(healthScore)}>{getScoreLabel(healthScore)}</span>
          </p>
        </div>
        <Link
          href="/assistant"
          className="flex items-center gap-2 px-3 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400 text-sm hover:bg-indigo-500/20 transition-colors"
        >
          <Zap className="w-3.5 h-3.5" />
          Ask AI Assistant
        </Link>
      </motion.div>

      {/* Top metric row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Net Worth"
          tooltip="Total value of all assets minus all debts. Your single most important financial number."
          value={netWorth}
          isCurrency
          delay={0}
          accent="primary"
          subtitle="Total assets minus liabilities"
        />
        <MetricCard
          title="Monthly Income (Net)"
          tooltip="Take-home pay after federal & state income tax, FICA (Social Security + Medicare), and pre-tax deductions like 401k and HSA."
          value={netMonthly}
          isCurrency
          delay={0.05}
          accent="success"
          subtitle={`$${Math.round(grossMonthly).toLocaleString()} gross`}
        />
        <MetricCard
          title="Free Cash Flow"
          tooltip="Money left every month after paying all fixed and variable expenses. This is what you can invest, save, or allocate to goals."
          value={freeCashFlow}
          isCurrency
          delay={0.1}
          accent={freeCashFlow >= 0 ? 'success' : 'danger'}
          subtitle="After all expenses"
        />
        <MetricCard
          title="Savings Rate"
          tooltip="Percentage of net income saved or invested. Target 20%+ for steady wealth building. FIRE (financial independence) typically requires 50%+."
          value={savingsRate}
          isPercent
          delay={0.15}
          accent={savingsRate >= 20 ? 'success' : savingsRate >= 10 ? 'warning' : 'danger'}
          subtitle="Target: 20%+"
        />
      </div>

      {/* Health Score + Emergency Fund + Cash Flow */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Health Score Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-5"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-xs text-[#64748B] uppercase tracking-wider font-medium">Financial Health</p>
                <InfoTooltip text="Composite score (0–100) across 5 pillars: savings rate (25pts), debt burden (20pts), emergency fund (20pts), goal progress (20pts), investment rate (15pts)." />
              </div>
              <p className={`text-2xl font-bold mt-1 ${getScoreColor(healthScore)}`}>{getScoreLabel(healthScore)}</p>
            </div>
            <Link href="/reports" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5">
              Details <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="flex items-center justify-center my-2">
            <ProgressRing
              value={healthScore}
              size={110}
              strokeWidth={10}
              color={scoreColor}
              label={`${healthScore}`}
              sublabel="/ 100"
            />
          </div>
          <div className="space-y-2 mt-3">
            {[
              { label: 'Savings', val: healthBreakdown.savings, max: 25 },
              { label: 'Debt', val: healthBreakdown.debt, max: 20 },
              { label: 'Emergency', val: healthBreakdown.emergency, max: 20 },
              { label: 'Goals', val: healthBreakdown.goals, max: 20 },
              { label: 'Investing', val: healthBreakdown.investment, max: 15 },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <span className="text-[10px] text-[#64748B] w-20">{item.label}</span>
                <ProgressBar
                  value={(item.val / item.max) * 100}
                  height={4}
                  color={scoreColor}
                  className="flex-1"
                />
                <span className="text-[10px] text-[#94A3B8] tabular-nums w-10 text-right">{item.val}/{item.max}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Emergency Fund */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="card p-5"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-xs text-[#64748B] uppercase tracking-wider font-medium">Emergency Fund</p>
                <InfoTooltip text="Months of expenses covered by liquid savings. H1B holders need 12 months (vs 6 standard) — a job loss triggers a 60-day grace period to find a new employer or leave the US." />
              </div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-bold text-[#F8FAFC] tabular-nums">{efCoverage.toFixed(1)}</span>
                <span className="text-sm text-[#64748B]">
                  /{' '}
                  {efEditing ? (
                    <span className="inline-flex items-center gap-1">
                      <input
                        type="number"
                        min={1}
                        max={36}
                        value={efMonthsInput}
                        onChange={(e) => setEfMonthsInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') saveEfMonths(); if (e.key === 'Escape') setEfEditing(false) }}
                        autoFocus
                        className="w-12 bg-[#1E293B] border border-indigo-500 rounded-lg px-1.5 py-0.5 text-white text-sm text-center focus:outline-none"
                      />
                      <button onClick={saveEfMonths} disabled={efSaving} className="p-0.5 hover:text-emerald-400 text-[#94A3B8] transition-colors">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setEfEditing(false)} className="p-0.5 hover:text-red-400 text-[#94A3B8] transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1">
                      {summary.assumptions?.emergencyFundMonths ?? 12} months
                      <button
                        onClick={() => { setEfMonthsInput(String(summary.assumptions?.emergencyFundMonths ?? 12)); setEfEditing(true) }}
                        className="p-0.5 hover:text-[#94A3B8] text-[#475569] transition-colors"
                        title="Change target months"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                </span>
              </div>
            </div>
            <Shield className={`w-5 h-5 ${efCoverage >= (summary.assumptions?.emergencyFundMonths ?? 12) ? 'text-emerald-400' : efCoverage >= 6 ? 'text-amber-400' : 'text-red-400'}`} />
          </div>
          <ProgressBar
            value={(efCoverage / (summary.assumptions?.emergencyFundMonths ?? 12)) * 100}
            color={efCoverage >= 12 ? '#10B981' : efCoverage >= 6 ? '#F59E0B' : '#EF4444'}
            height={8}
            className="mb-4"
          />
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-[#64748B]">Liquid savings</span>
              <span className="text-[#F8FAFC] tabular-nums">{formatCurrency(liquidAssets)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#64748B]">Target ({summary.assumptions?.emergencyFundMonths ?? 12} months)</span>
              <span className="text-[#F8FAFC] tabular-nums">{formatCurrency(efTarget)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#64748B]">Still needed</span>
              <span className={`tabular-nums ${efTarget - liquidAssets > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {efTarget - liquidAssets > 0 ? '-' : '+'}{formatCurrency(Math.abs(efTarget - liquidAssets))}
              </span>
            </div>
          </div>
          <div className="mt-4 p-2.5 rounded-lg bg-[#0B1120] border border-[#1E293B]">
            <p className="text-[10px] text-[#64748B]">
              💡 H1B holders need 12 months (vs 6 standard) — 60-day grace period requires longer runway
            </p>
          </div>
        </motion.div>

        {/* Cash Flow Donut */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card p-5"
        >
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-xs text-[#64748B] uppercase tracking-wider font-medium">Monthly Cash Flow</p>
                <InfoTooltip text="How your monthly net income is divided. Aim for total expenses under 70% of net income, leaving 30%+ as free cash flow to save and invest." />
              </div>
              <p className="text-2xl font-bold text-[#F8FAFC] tabular-nums mt-1">{formatCurrency(netMonthly)}</p>
            </div>
          </div>
          <div className="flex items-center justify-center my-1">
            <DonutChart
              data={cashFlowData}
              size={140}
              innerRadius={47}
              outerRadius={65}
              centerLabel={formatCurrency(freeCashFlow, 'USD', true)}
              centerSubLabel="free cash"
            />
          </div>
          <div className="space-y-1.5 mt-2">
            {[
              { label: 'Fixed expenses', value: summary.fixedExpenses, color: '#6366F1' },
              { label: 'Variable expenses', value: summary.variableExpenses, color: '#8B5CF6' },
              { label: 'Free cash flow', value: Math.max(0, freeCashFlow), color: '#10B981' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-[#64748B] flex-1">{item.label}</span>
                <span className="text-[#F8FAFC] tabular-nums">{formatCurrency(item.value)}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Goals preview */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="card p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-xs text-[#64748B] uppercase tracking-wider font-medium">Top Goals</p>
              <InfoTooltip text="Your highest-priority financial goals. Confidence % shows the likelihood of hitting the target by the deadline based on current monthly contributions." />
            </div>
            <p className="text-sm text-[#94A3B8] mt-0.5">{goals.filter((g) => g.confidenceScore >= 70).length}/{goals.length} goals on track</p>
          </div>
          <Link href="/goals" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5">
            View all <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="space-y-3">
          {topGoals.map((goal, i) => {
            const progress = (goal.currentAmount / goal.inflationAdjTarget) * 100
            const confColor = goal.confidenceScore >= 70 ? '#10B981' : goal.confidenceScore >= 40 ? '#F59E0B' : '#EF4444'
            return (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 + i * 0.05 }}
              >
                <Link href={`/goals/${goal.id}`} className="block group">
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className="text-base w-6">{goal.icon ?? '🎯'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-[#F8FAFC] truncate group-hover:text-indigo-400 transition-colors">
                          {goal.name}
                        </span>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <Badge
                            label={`${goal.confidenceScore}% confident`}
                            color={goal.confidenceScore >= 70 ? 'success' : goal.confidenceScore >= 40 ? 'warning' : 'danger'}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-[#64748B] mt-0.5">
                        <span className="tabular-nums">{formatCurrency(goal.currentAmount)}</span>
                        <span>/</span>
                        <span className="tabular-nums">{formatCurrency(goal.inflationAdjTarget)}</span>
                        {goal.targetDate && (
                          <span className="ml-1 text-[#475569]">· {new Date(goal.targetDate).getFullYear()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <ProgressBar
                    value={Math.min(100, progress)}
                    color={goal.color ?? '#6366F1'}
                    height={4}
                  />
                </Link>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* Net Worth History Chart */}
      {nwSparkData.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-[#64748B] uppercase tracking-wider font-medium">Net Worth Trend</p>
              <p className="text-2xl font-bold text-[#F8FAFC] tabular-nums mt-1">{formatCurrency(netWorth)}</p>
            </div>
            <Link href="/reports" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5">
              Full report <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <FinanceAreaChart
            data={nwSparkData}
            lines={[{ key: 'netWorth', label: 'Net Worth', color: '#6366F1' }]}
            height={180}
          />
        </motion.div>
      )}

      {/* Debt quick view + Upcoming reminders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Debt */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="card p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-[#64748B] uppercase tracking-wider font-medium">Active Debt</p>
            <Link href="/debt" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5">
              Manage <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {liabilities.length === 0 ? (
            <p className="text-sm text-emerald-400 font-medium">🎉 Debt free!</p>
          ) : (
            <div className="space-y-3">
              {liabilities.map((l) => (
                <div key={l.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-[#F8FAFC]">{l.name}</span>
                    <span className="text-xs text-[#64748B] tabular-nums">{formatCurrency(l.principalBalance)}</span>
                  </div>
                  <ProgressBar
                    value={((l.originalBalance - l.principalBalance) / l.originalBalance) * 100}
                    color="#EF4444"
                    height={4}
                  />
                  <div className="flex justify-between text-[10px] text-[#475569] mt-0.5">
                    <span>{((l.originalBalance - l.principalBalance) / l.originalBalance * 100).toFixed(0)}% paid</span>
                    <span>{(l.interestRate * 100).toFixed(1)}% APR</span>
                  </div>
                </div>
              ))}
              <div className="pt-2 border-t border-[#1E293B]">
                <div className="flex justify-between text-xs">
                  <span className="text-[#64748B]">Total debt</span>
                  <span className="text-red-400 tabular-nums">{formatCurrency(totalLiabilities)}</span>
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span className="text-[#64748B]">Monthly minimums</span>
                  <span className="text-[#94A3B8] tabular-nums">{formatCurrency(summary.totalMinimumPayments)}/mo</span>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card p-5"
        >
          <p className="text-xs text-[#64748B] uppercase tracking-wider font-medium mb-4">Quick Actions</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { href: '/simulator', label: 'Run Scenario', icon: '⚡', desc: 'What-if analysis', color: 'hover:border-amber-500/30 hover:bg-amber-500/5' },
              { href: '/goals', label: 'Update Goals', icon: '🎯', desc: 'Review progress', color: 'hover:border-indigo-500/30 hover:bg-indigo-500/5' },
              { href: '/h1b', label: 'H1B Center', icon: '🛡️', desc: 'Visa & compliance', color: 'hover:border-cyan-500/30 hover:bg-cyan-500/5' },
              { href: '/assistant', label: 'Ask AI CFO', icon: '🤖', desc: 'Get insights', color: 'hover:border-violet-500/30 hover:bg-violet-500/5' },
            ].map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className={`p-3 rounded-xl border border-[#1E293B] transition-all group ${action.color}`}
              >
                <div className="text-xl mb-1.5">{action.icon}</div>
                <p className="text-xs font-semibold text-[#F8FAFC] group-hover:text-white">{action.label}</p>
                <p className="text-[10px] text-[#64748B]">{action.desc}</p>
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
