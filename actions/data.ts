'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'

/**
 * Clears ALL data in the database — every table, completely.
 */
export async function clearFinancialData() {
  // Delete child records first (foreign key order)
  await prisma.goalAllocation.deleteMany()
  await prisma.goalMilestone.deleteMany()
  await prisma.goal.deleteMany()
  await prisma.debtPayment.deleteMany()
  await prisma.liability.deleteMany()
  await prisma.investmentContribution.deleteMany()
  await prisma.investment.deleteMany()
  await prisma.asset.deleteMany()
  await prisma.expense.deleteMany()
  await prisma.expenseCategory.deleteMany()
  await prisma.incomeSource.deleteMany()
  await prisma.preTaxDeduction.deleteMany()
  await prisma.remittanceLog.deleteMany()
  await prisma.financialSnapshot.deleteMany()
  await prisma.simulation.deleteMany()
  await prisma.aiSummary.deleteMany()
  await prisma.note.deleteMany()
  await prisma.reflection.deleteMany()
  await prisma.lifeEvent.deleteMany()
  await prisma.reminder.deleteMany()
  await prisma.document.deleteMany()
  // Delete profile-linked records (cascade will handle FinancialAssumptions and VisaInfo)
  await prisma.userProfile.deleteMany()
  revalidatePath('/', 'layout')
}
