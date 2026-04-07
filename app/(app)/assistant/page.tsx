import { getFinancialSummary } from '@/actions/finance'
import { AssistantClient } from '@/components/assistant/AssistantClient'

export default async function AssistantPage() {
  const summary = await getFinancialSummary()

  // Build a lean financial context string for the AI
  const context = summary ? `
Financial snapshot for ${summary.profile?.name ?? 'user'} (H1B, ${summary.profile?.state ?? 'CA'}):
- Monthly gross: $${Math.round(summary.grossMonthly).toLocaleString()} | Net: $${Math.round(summary.netMonthly).toLocaleString()}
- Monthly expenses: $${Math.round(summary.totalExpenses).toLocaleString()} | Free cash flow: $${Math.round(summary.freeCashFlow).toLocaleString()}
- Net worth: $${Math.round(summary.netWorth).toLocaleString()} | Assets: $${Math.round(summary.totalAssets).toLocaleString()} | Liabilities: $${Math.round(summary.totalLiabilities).toLocaleString()}
- Savings rate: ${summary.savingsRate.toFixed(1)}% | Health score: ${Math.round(summary.healthScore)}/100
- Emergency fund: ${summary.efCoverage.toFixed(1)} months | Target: ${summary.visaInfo ? 12 : 6} months
- Goals: ${summary.goals.length} active, avg confidence ${Math.round(summary.avgGoalConfidence)}%
- FBAR: ${summary.fbarStatus} (foreign accounts: $${Math.round(summary.foreignTotal).toLocaleString()})
- Visa expires: ${summary.visaInfo?.expiryDate ? new Date(summary.visaInfo.expiryDate).toLocaleDateString() : 'unknown'}
- GC stage: ${summary.visaInfo?.gcPetitionStage ?? 'none'}
`.trim() : 'Financial data not available.'

  return <AssistantClient initialContext={context} />
}
