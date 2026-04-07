import { prisma } from '@/lib/db'
import { getFinancialSummary } from '@/actions/finance'
import { getRemittanceLogs } from '@/actions/h1b'
import { H1BClient } from '@/components/h1b/H1BClient'

export default async function H1BPage() {
  const [summary, visaInfo, remittances, assets, assumptions] = await Promise.all([
    getFinancialSummary(),
    prisma.visaInfo.findFirst(),
    getRemittanceLogs(),
    prisma.asset.findMany({ where: { isActive: true, isForeignAccount: true } }),
    prisma.financialAssumptions.findFirst(),
  ])

  return (
    <H1BClient
      visaInfo={visaInfo}
      remittances={remittances}
      foreignAssets={assets}
      foreignTotal={summary?.foreignTotal ?? 0}
      fbarStatus={summary?.fbarStatus ?? 'safe'}
      usdToInr={assumptions?.usdToInrRate ?? 83.5}
      includeSocialSecurity={assumptions?.includeSocialSecurity ?? false}
    />
  )
}
