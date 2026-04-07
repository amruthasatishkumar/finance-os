import { prisma } from '@/lib/db'
import { getFinancialSummary } from '@/actions/finance'
import { SimulatorClient } from '@/components/simulator/SimulatorClient'

export default async function SimulatorPage() {
  const [summary, simulations, assumptions] = await Promise.all([
    getFinancialSummary(),
    prisma.simulation.findMany({ orderBy: { createdAt: 'desc' }, take: 10 }),
    prisma.financialAssumptions.findFirst(),
  ])

  return (
    <SimulatorClient
      summary={summary}
      simulations={simulations}
      assumptions={assumptions}
    />
  )
}
