import { prisma } from '@/lib/db'
import { getFinancialSummary } from '@/actions/finance'
import { ExpensesClient } from '@/components/expenses/ExpensesClient'

export default async function ExpensesPage() {
  const [summary, categories, expenses] = await Promise.all([
    getFinancialSummary(),
    prisma.expenseCategory.findMany({ orderBy: { sortOrder: 'asc' } }),
    prisma.expense.findMany({
      where: { isActive: true },
      include: { category: true },
      orderBy: { category: { sortOrder: 'asc' } },
    }),
  ])

  return (
    <ExpensesClient
      categories={categories}
      expenses={expenses}
      totalMonthly={summary?.totalExpenses ?? 0}
      fixedMonthly={summary?.fixedExpenses ?? 0}
      netMonthly={summary?.netMonthly ?? 0}
    />
  )
}
