import { prisma } from '@/lib/db'
import { getFinancialSummary } from '@/actions/finance'
import { InvestmentsClient } from '@/components/investments/InvestmentsClient'

export default async function InvestmentsPage() {
  const [summary, assets, investments, assumptions] = await Promise.all([
    getFinancialSummary(),
    prisma.asset.findMany({ where: { isActive: true }, orderBy: { type: 'asc' } }),
    prisma.investment.findMany({
      where: { isActive: true },
      include: { contributions: { orderBy: { date: 'desc' }, take: 5 } },
      orderBy: { currentValue: 'desc' },
    }),
    prisma.financialAssumptions.findFirst(),
  ])

  return (
    <InvestmentsClient
      assets={assets}
      investments={investments}
      totalAssets={summary?.totalAssets ?? 0}
      netWorth={summary?.netWorth ?? 0}
      foreignTotal={summary?.foreignTotal ?? 0}
      usdToInr={assumptions?.usdToInrRate ?? 83.5}
      returnRate={assumptions?.investmentReturnRate ?? 0.08}
      retirementAge={assumptions?.retirementAge ?? 60}
    />
  )
}
