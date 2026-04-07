import { prisma } from '@/lib/db'
import { getFinancialSummary } from '@/actions/finance'
import { DebtClient } from '@/components/debt/DebtClient'

export default async function DebtPage() {
  const [summary, liabilities, payments] = await Promise.all([
    getFinancialSummary(),
    prisma.liability.findMany({
      where: { isActive: true },
      include: { payments: { orderBy: { date: 'desc' }, take: 6 } },
      orderBy: { interestRate: 'desc' },
    }),
    prisma.debtPayment.findMany({ orderBy: { date: 'desc' }, take: 20 }),
  ])

  return (
    <DebtClient
      liabilities={liabilities}
      totalDebt={summary?.totalLiabilities ?? 0}
      netMonthly={summary?.netMonthly ?? 0}
      debtBurdenRatio={summary?.debtBurdenRatio ?? 0}
      freeCashFlow={summary?.freeCashFlow ?? 0}
    />
  )
}
