import { getFinancialSummary } from '@/actions/finance'
import { prisma } from '@/lib/db'
import { IncomeClient } from '@/components/income/IncomeClient'
import { calcAnnualNetIncome } from '@/lib/calculations/income'

export default async function IncomePage() {
  const [summary, incomeSources, preTaxDeductions] = await Promise.all([
    getFinancialSummary(),
    prisma.incomeSource.findMany({ where: { isActive: true }, orderBy: { createdAt: 'asc' } }),
    prisma.preTaxDeduction.findMany({ where: { isActive: true }, orderBy: { createdAt: 'asc' } }),
  ])

  const assumptions = summary?.assumptions
  const profile = summary?.profile
  const grossAnnual = (summary?.grossMonthly ?? 0) * 12
  const preTaxAnnualTotal = (assumptions as any)?.preTaxDeductions ?? 0

  const taxBreakdown = grossAnnual > 0
    ? calcAnnualNetIncome(
        grossAnnual,
        assumptions?.filingStatus ?? 'single',
        assumptions?.stateTaxRate ?? 0.093,
        preTaxAnnualTotal,
        profile?.state ?? 'California',
      )
    : null

  return (
    <IncomeClient
      incomeSources={incomeSources}
      preTaxItems={preTaxDeductions}
      grossMonthly={summary?.grossMonthly ?? 0}
      netMonthly={summary?.netMonthly ?? 0}
      stateTaxRate={assumptions?.stateTaxRate ?? 0.093}
      filingStatus={assumptions?.filingStatus ?? 'single'}
      preTaxDeductions={preTaxAnnualTotal}
      state={profile?.state ?? 'California'}
      taxBreakdown={taxBreakdown}
    />
  )
}
