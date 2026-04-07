import { getFinancialSummary } from '@/actions/finance'
import { prisma } from '@/lib/db'
import { IncomeClient } from '@/components/income/IncomeClient'

export default async function IncomePage() {
  const [summary, incomeSources] = await Promise.all([
    getFinancialSummary(),
    prisma.incomeSource.findMany({ where: { isActive: true }, orderBy: { createdAt: 'asc' } }),
  ])

  const assumptions = summary?.assumptions

  return (
    <IncomeClient
      incomeSources={incomeSources}
      grossMonthly={summary?.grossMonthly ?? 0}
      netMonthly={summary?.netMonthly ?? 0}
      stateTaxRate={assumptions?.stateTaxRate ?? 0.093}
      filingStatus={assumptions?.filingStatus ?? 'single'}
    />
  )
}
