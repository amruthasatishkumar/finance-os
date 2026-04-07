import { getFinancialSummary, getSnapshotHistory } from '@/actions/finance'
import { ReportsClient } from '@/components/reports/ReportsClient'

export default async function ReportsPage() {
  const [summary, snapshots] = await Promise.all([
    getFinancialSummary(),
    getSnapshotHistory(12),
  ])

  return (
    <ReportsClient
      summary={summary}
      snapshots={snapshots}
    />
  )
}
