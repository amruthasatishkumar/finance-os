'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'

/**
 * Clears all financial transaction data (income, expenses, debts, assets, goals).
 * Keeps the user profile, visa info, and financial assumptions.
 */
export async function clearFinancialData() {
  await prisma.goalAllocation.deleteMany()
  await prisma.goalMilestone.deleteMany()
  await prisma.goal.deleteMany()
  await prisma.debtPayment.deleteMany()
  await prisma.liability.deleteMany()
  await prisma.investmentContribution.deleteMany()
  await prisma.investment.deleteMany()
  await prisma.asset.deleteMany()
  await prisma.expense.deleteMany()
  await prisma.incomeSource.deleteMany()
  await prisma.financialSnapshot.deleteMany()
  revalidatePath('/', 'layout')
}
