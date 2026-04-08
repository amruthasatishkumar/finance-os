import { getFinancialSummary, getSnapshotHistory, refreshSnapshot } from '@/actions/finance'
import { DashboardClient } from '@/components/dashboard/DashboardClient'
import { EmptyState } from '@/components/shared'
import Link from 'next/link'

export default async function DashboardPage() {
  const [summary, history] = await Promise.all([
    getFinancialSummary(),
    getSnapshotHistory(12),
  ])

  if (!summary) {
    return (
      <EmptyState
        icon="💫"
        title="Welcome to Finance OS"
        description="Set up your financial profile to get started."
        action={
          <Link href="/settings" className="px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm hover:bg-indigo-600 transition-colors">
            Complete Setup
          </Link>
        }
      />
    )
  }

  // Auto-save snapshot for the current month (runs silently in background)
  void refreshSnapshot()

  return <DashboardClient summary={summary} history={history} />
}
