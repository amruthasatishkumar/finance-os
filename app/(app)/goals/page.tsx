import { prisma } from '@/lib/db'
import { getFinancialSummary } from '@/actions/finance'
import { GoalsClient } from '@/components/goals/GoalsClient'

export default async function GoalsPage() {
  const [summary, goals, assumptions] = await Promise.all([
    getFinancialSummary(),
    prisma.goal.findMany({
      where: { status: { in: ['active', 'paused'] } },
      include: { milestones: true },
      orderBy: { priority: 'desc' },
    }),
    prisma.financialAssumptions.findFirst(),
  ])

  return (
    <GoalsClient
      goals={goals}
      freeCashFlow={summary?.freeCashFlow ?? 0}
      returnRate={assumptions?.investmentReturnRate ?? 0.08}
      inflationRate={assumptions?.inflationRate ?? 0.035}
    />
  )
}
