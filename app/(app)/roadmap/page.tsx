import { prisma } from '@/lib/db'
import { getFinancialSummary, getSnapshotHistory } from '@/actions/finance'
import { RoadmapClient } from '@/components/roadmap/RoadmapClient'

export default async function RoadmapPage() {
  const [summary, snapshots, goals, assumptions, lifeEvents] = await Promise.all([
    getFinancialSummary(),
    getSnapshotHistory(60),
    prisma.goal.findMany({ where: { status: { in: ['active', 'paused', 'completed'] } }, orderBy: { targetDate: 'asc' } }),
    prisma.financialAssumptions.findFirst(),
    prisma.lifeEvent.findMany({ orderBy: { eventDate: 'asc' } }).catch(() => []),
  ])

  return (
    <RoadmapClient
      summary={summary}
      snapshots={snapshots}
      goals={goals}
      assumptions={assumptions}
      lifeEvents={lifeEvents}
    />
  )
}
