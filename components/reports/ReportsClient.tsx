'use client'

import { useMemo } from 'react'
import { MetricCard } from '@/components/shared/MetricCard'
import { SectionHeader } from '@/components/shared/index'
import { FinanceAreaChart, FinanceBarChart, FinanceLineChart } from '@/components/charts/index'
import { formatCurrency, formatPercent, getScoreLabel, getScoreColor } from '@/lib/utils'

interface Props {
  summary: any
  snapshots: any[]
}

export function ReportsClient({ summary, snapshots }: Props) {
  // ── Charts ──────────────────────────────────────────────────────────────
  const reversed = useMemo(() => [...snapshots].reverse(), [snapshots])

  const netWorthHistory = reversed.map((s: any) => ({
    label: s.month,
    netWorth: Math.round(s.netWorth),
    assets: Math.round(s.totalAssets),
    liabilities: Math.round(s.totalLiabilities),
  }))

  const cashFlowHistory = reversed.map((s: any) => ({
    label: s.month,
    income: Math.round(s.totalIncomeNet),
    expenses: Math.round(s.totalExpenses),
    fcf: Math.round(s.freeCashFlow),
  }))

  const scoreHistory = reversed.map((s: any) => ({
    label: s.month,
    health: Math.round(s.healthScore),
  }))

  const currentScore = summary?.healthScore ?? 0
  const scoreLabel = getScoreLabel(currentScore)
  const breakdown = summary?.healthBreakdown ?? {}

  // ────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">
      <div className="space-y-8 p-6 overflow-y-auto flex-1">
          {/* Top metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Health Score"
              value={`${Math.round(currentScore)}/100`}
              subtitle={scoreLabel}
              tooltip="Composite 0–100 score across savings rate, debt burden, emergency fund, goal progress, and investment diversity."
            />
            <MetricCard
              title="Savings Rate"
              value={formatPercent(summary?.savingsRate ?? 0)}
              subtitle="Of net income"
              tooltip="Percentage of your net (take-home) income that you save or invest. Target ≥ 20%."
            />
            <MetricCard
              title="Debt Burden"
              value={formatPercent((summary?.debtBurdenRatio ?? 0) * 100)}
              subtitle="Of gross income"
              tooltip="Total monthly debt payments as % of gross income. Keep below 36% (good) or 20% (excellent)."
            />
            <MetricCard
              title="Net Worth"
              value={formatCurrency(summary?.netWorth ?? 0, 'USD', true)}
              subtitle="Total balance sheet"
              tooltip="Total assets minus total liabilities. Your overall financial position."
            />
          </div>

          {/* Health score breakdown */}
          {Object.keys(breakdown).length > 0 && (
            <div className="card p-5">
              <SectionHeader title="Health Score Breakdown" subtitle="Component analysis" />
              <div className="mt-3 grid grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.entries(breakdown).map(([key, val]: any) => (
                  <div key={key} className="bg-[#1E293B] rounded-xl p-3">
                    <p className="text-xs text-[#94A3B8] capitalize mb-1">{key.replace(/_/g, ' ')}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-[#334155] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${(val.score||0) >= 70 ? 'bg-emerald-500' : (val.score||0) >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                          style={{ width: `${Math.min(100, val.score || 0)}%` }}
                        />
                      </div>
                      <span className={`text-sm font-medium ${getScoreColor(val.score || 0)}`}>{Math.round(val.score || 0)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Net worth trend */}
          {netWorthHistory.length > 1 && (
            <div className="card p-5">
              <SectionHeader title="Net Worth Trend" subtitle="Last 12 months" />
              <div className="mt-3">
                <FinanceAreaChart
                  data={netWorthHistory as any}
                  lines={[
                    { key: 'assets',      label: 'Assets',      color: '#10B981' },
                    { key: 'liabilities', label: 'Liabilities', color: '#EF4444' },
                    { key: 'netWorth',    label: 'Net Worth',   color: '#6366F1' },
                  ]}
                  height={250}
                />
              </div>
            </div>
          )}

          {/* Cash flow trend */}
          {cashFlowHistory.length > 1 && (
            <div className="card p-5">
              <SectionHeader title="Cash Flow Trend" subtitle="Income vs Expenses" />
              <div className="mt-3">
                <FinanceBarChart
                  data={cashFlowHistory as any}
                  bars={[
                    { key: 'income',   label: 'Net Income',      color: '#10B981' },
                    { key: 'expenses', label: 'Expenses',         color: '#EF4444' },
                    { key: 'fcf',      label: 'Free Cash Flow',   color: '#6366F1' },
                  ]}
                  height={220}
                />
              </div>
            </div>
          )}

          {/* Health score trend */}
          {scoreHistory.length > 1 && (
            <div className="card p-5">
              <SectionHeader title="Financial Health Over Time" />
              <div className="mt-3">
                <FinanceLineChart
                  data={scoreHistory as any}
                  lines={[{ key: 'health', label: 'Health Score', color: '#6366F1' }]}
                  height={200}
                />
              </div>
            </div>
          )}

          {/* Monthly summary text */}
          <div className="card p-5">
            <SectionHeader
              title="Monthly Summary"
              subtitle={new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            />
            <div className="mt-3 space-y-3 text-sm text-[#CBD5E1]">
              <p>
                <span className="text-white font-medium">Income: </span>
                Gross {formatCurrency(summary?.grossMonthly ?? 0)}/mo | Net {formatCurrency(summary?.netMonthly ?? 0)}/mo after taxes
              </p>
              <p>
                <span className="text-white font-medium">Expenses: </span>
                {formatCurrency(summary?.totalExpenses ?? 0)}/mo total — {formatCurrency(summary?.fixedExpenses ?? 0)} fixed,{' '}
                {formatCurrency(summary?.variableExpenses ?? 0)} variable
              </p>
              <p>
                <span className="text-white font-medium">Free Cash Flow: </span>
                <span className={summary?.freeCashFlow >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                  {formatCurrency(summary?.freeCashFlow ?? 0)}/mo
                </span>
              </p>
              <p>
                <span className="text-white font-medium">Savings Rate: </span>
                {formatPercent(summary?.savingsRate ?? 0)}{' '}
                {(summary?.savingsRate ?? 0) >= 20 ? '✅ On track' : '⚠️ Target ≥20%'}
              </p>
              <p>
                <span className="text-white font-medium">Emergency Fund: </span>
                {(summary?.efCoverage ?? 0).toFixed(1)} months covered
                {(summary?.efCoverage ?? 0) >= 12 ? ' ✅' : ' — building in progress'}
              </p>
              <p>
                <span className="text-white font-medium">Goals: </span>
                {(summary?.goals ?? []).length} active | {(summary?.goals ?? []).filter((g: any) => g.confidenceScore >= 70).length} on track
              </p>
              <p>
                <span className="text-white font-medium">FBAR Status: </span>
                <span className={
                  summary?.fbarStatus === 'exceeded' ? 'text-red-400' :
                  summary?.fbarStatus === 'warning' ? 'text-amber-400' : 'text-emerald-400'
                }>
                  {summary?.fbarStatus === 'exceeded' ? '🚨 Filing required' :
                   summary?.fbarStatus === 'warning'  ? '⚠️ Near threshold' : '✅ Safe'}
                </span>
              </p>
            </div>
          </div>

          {/* No data nudge */}
          {!summary?.grossMonthly && (
            <div className="card border-dashed border-indigo-500/30 text-center py-10">
              <p className="text-[#94A3B8] text-sm">No financial data yet. Add income sources and expenses to get started.</p>
            </div>
          )}
        </div>
    </div>
  )
}
