'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Flag, Calendar } from 'lucide-react'
import { FinanceAreaChart } from '@/components/charts/index'
import { formatCurrency, monthsUntil } from '@/lib/utils'
import { calcPortfolioProjection } from '@/lib/calculations/investments'
import type { ProjectionPoint } from '@/lib/calculations/investments'

interface Props {
  summary: any
  snapshots: any[]
  goals: any[]
  assumptions: any
  lifeEvents: any[]
}

export function RoadmapClient({ summary, snapshots, goals, assumptions, lifeEvents }: Props) {
  const currentYear = new Date().getFullYear()
  const retirementAge = assumptions?.retirementAge ?? 60
  const currentAge = summary?.profile?.age ?? 29
  const yearsToRetirement = retirementAge - currentAge

  const projectionPoints = useMemo(() => {
    const returnRate = assumptions?.investmentReturnRate ?? 0.08
    return calcPortfolioProjection(
      summary?.totalAssets ?? 100000,
      2500,
      Math.max(10, yearsToRetirement),
      returnRate - 0.02,
      returnRate,
      returnRate + 0.02,
    )
  }, [summary, assumptions, yearsToRetirement])

  const chartData = projectionPoints.map((p: ProjectionPoint) => ({
    label: `${p.year}`,
    conservative: p.conservative,
    base: p.base,
    optimistic: p.optimistic,
    contributions: p.contributions,
  }))

  // Historical net worth from snapshots
  const historyData = snapshots.slice().reverse().map((s: any) => ({
    label: s.month,
    netWorth: Math.round(s.netWorth),
  }))

  // Group goals by year
  const goalsByYear: Record<number, any[]> = {}
  goals.forEach((g) => {
    if (!g.targetDate) return
    const year = new Date(g.targetDate).getFullYear()
    if (!goalsByYear[year]) goalsByYear[year] = []
    goalsByYear[year].push(g)
  })

  const milestoneYears = Object.keys(goalsByYear).map(Number).sort()

  const FIRE_NUMBER = summary ? summary.totalExpenses * 12 * 25 : 0

  return (
    <div className="space-y-8 p-6">
      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5 text-center">
          <p className="text-3xl font-bold text-white">{currentAge}</p>
          <p className="text-sm text-[#64748B] mt-1">Current Age</p>
        </div>
        <div className="card p-5 text-center">
          <p className="text-3xl font-bold text-indigo-400">{retirementAge}</p>
          <p className="text-sm text-[#64748B] mt-1">Target Retirement Age</p>
        </div>
        <div className="card p-5 text-center">
          <p className="text-3xl font-bold text-emerald-400">{yearsToRetirement}</p>
          <p className="text-sm text-[#64748B] mt-1">Years to Retirement</p>
        </div>
        <div className="card p-5 text-center">
          <p className="text-xl font-bold text-amber-400">{formatCurrency(FIRE_NUMBER, 'USD', true)}</p>
          <p className="text-sm text-[#64748B] mt-1">FIRE Number (25× rule)</p>
        </div>
      </div>

      {/* Net worth projection */}
      <div className="card p-5">
        <h3 className="font-semibold text-white mb-1">Net Worth Projection</h3>
        <p className="text-xs text-[#475569] mb-4">
          Age {currentAge} → {retirementAge} · assumes {formatCurrency(2500)}/mo investable savings
        </p>
        <FinanceAreaChart
          data={chartData as any}
          lines={[
            { key: 'optimistic', label: 'Optimistic', color: '#10B981' },
            { key: 'base', label: 'Base Case', color: '#6366F1' },
            { key: 'conservative', label: 'Conservative', color: '#F59E0B' },
            { key: 'contributions', label: 'Contributions Only', color: '#64748B' },
          ]}
          height={320}
        />
      </div>

      {/* Goal timeline */}
      {milestoneYears.length > 0 && (
        <div className="card p-5">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Flag className="w-4 h-4 text-indigo-400" />
            Goal Milestones on the Roadmap
          </h3>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-[#1E293B]" />
            <div className="space-y-4 pl-12">
              {milestoneYears.map((year) => (
                <div key={year}>
                  <div className="absolute left-0 flex items-center justify-center w-8 h-8 rounded-full bg-[#1E293B] border border-[#334155]">
                    <span className="text-xs text-indigo-400 font-medium">{year - currentYear + currentAge}</span>
                  </div>
                  <div className="mb-1">
                    <span className="text-xs font-semibold text-[#94A3B8]">{year} · Age {year - currentYear + currentAge}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {goalsByYear[year].map((g) => (
                      <div key={g.id} className="bg-[#1E293B] border border-[#334155] rounded-xl px-3 py-2 flex items-center gap-2">
                        <span>{g.icon ?? '🎯'}</span>
                        <div>
                          <p className="text-sm text-[#F8FAFC]">{g.name}</p>
                          <p className="text-xs text-[#64748B]">{formatCurrency(g.targetAmount)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Retirement marker */}
              <div>
                <div className="absolute left-0 flex items-center justify-center w-8 h-8 rounded-full bg-emerald-600">
                  <span className="text-xs text-white font-bold">{retirementAge}</span>
                </div>
                <div className="mb-1">
                  <span className="text-xs font-semibold text-emerald-400">{currentYear + yearsToRetirement} · Age {retirementAge} · RETIREMENT</span>
                </div>
                <div className="bg-emerald-600/10 border border-emerald-500/30 rounded-xl px-3 py-2">
                  <p className="text-sm text-emerald-300">Target corpus: {formatCurrency(FIRE_NUMBER, 'USD', true)}</p>
                  <p className="text-xs text-emerald-500 mt-0.5">4% safe withdrawal = {formatCurrency(FIRE_NUMBER * 0.04)} / year</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Historical net worth */}
      {historyData.length > 1 && (
        <div className="card p-5">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-400" />
            Historical Net Worth
          </h3>
          <FinanceAreaChart
            data={historyData as any}
            lines={[{ key: 'netWorth', label: 'Net Worth', color: '#6366F1' }]}
            height={200}
          />
        </div>
      )}

      {/* Life events */}
      {lifeEvents.length > 0 && (
        <div className="card p-5">
          <h3 className="font-semibold text-white mb-4">Life Events</h3>
          <div className="space-y-2">
            {lifeEvents.map((event: any) => (
              <div key={event.id} className="flex items-center justify-between py-2 border-b border-[#1E293B] last:border-0">
                <p className="text-sm text-[#F8FAFC]">{event.name}</p>
                <p className="text-xs text-[#64748B]">{new Date(event.eventDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
