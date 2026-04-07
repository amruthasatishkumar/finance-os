'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { calcMonthlyGrossIncome, calcMonthlyNetIncome } from '@/lib/calculations/income'
import { calcMonthlyExpenses, calcFreeCashFlow, calcSavingsRate, calcDebtBurdenRatio, calcHealthScore, calcEmergencyFundCoverage, calcNetWorth } from '@/lib/calculations/cashflow'
import { calcGoal, calcAvgGoalConfidence } from '@/lib/calculations/goals'
import { H1B_CONSTANTS } from '@/lib/constants'
import { getMonthKey, normalizeToMonthly } from '@/lib/utils'

// ─── Full financial summary (used by dashboard + AI context) ──────────────────

export async function getFinancialSummary() {
  const [profile, assumptions, visaInfo, incomeSources, expenses, assets, liabilities, goals, snapshot] = await Promise.all([
    prisma.userProfile.findFirst(),
    prisma.financialAssumptions.findFirst(),
    prisma.visaInfo.findFirst(),
    prisma.incomeSource.findMany({ where: { isActive: true } }),
    prisma.expense.findMany({ where: { isActive: true } }),
    prisma.asset.findMany({ where: { isActive: true } }),
    prisma.liability.findMany({ where: { isActive: true } }),
    prisma.goal.findMany({ where: { status: { in: ['active', 'paused'] } }, orderBy: { priority: 'desc' } }),
    prisma.financialSnapshot.findFirst({ orderBy: { month: 'desc' } }),
  ])

  if (!profile || !assumptions) {
    return null
  }

  // Income calculations
  const grossMonthly = calcMonthlyGrossIncome(incomeSources)
  const netMonthly = calcMonthlyNetIncome(
    incomeSources,
    assumptions.filingStatus,
    assumptions.stateTaxRate,
    (assumptions as any).preTaxDeductions ?? 0,
    profile.state,
  )

  // Expense calculations
  const totalExpenses = calcMonthlyExpenses(expenses)
  const fixedExpenses = expenses
    .filter((e) => e.isFixed)
    .reduce((s, e) => s + normalizeToMonthly(e.amount, e.frequency), 0)

  // Cash flow
  const freeCashFlow = calcFreeCashFlow(netMonthly, totalExpenses)
  const savingsRate = calcSavingsRate(freeCashFlow, netMonthly)

  // Net worth
  const totalAssets = assets.reduce((s, a) => s + a.balance, 0)
  const totalLiabilities = liabilities.reduce((s, l) => s + l.principalBalance, 0)
  const netWorth = calcNetWorth({ totalAssets, totalLiabilities })

  // Debt
  const totalMinimumPayments = liabilities.reduce((s, l) => s + l.minimumPayment, 0)
  const debtBurdenRatio = calcDebtBurdenRatio(totalMinimumPayments, grossMonthly)

  // Emergency fund
  const liquidAssets = assets
    .filter((a) => ['checking', 'savings'].includes(a.type))
    .reduce((s, a) => s + a.balance, 0)
  const efCoverage = calcEmergencyFundCoverage(liquidAssets, totalExpenses)

  // Goals with confidence
  const goalsWithConf = goals.map((g) => {
    const result = calcGoal({
      targetAmount: g.targetAmount,
      currentAmount: g.currentAmount,
      targetDate: g.targetDate ?? undefined,
      monthlyContrib: g.monthlyContrib,
      annualReturnRate: assumptions.investmentReturnRate,
      inflationRate: assumptions.inflationRate,
      isInflationAdjusted: g.isInflationAdjusted,
    })
    return { ...g, ...result }
  })

  const avgGoalConfidence = calcAvgGoalConfidence(goalsWithConf)

  // Investment contributions
  const investmentContribMonthly = incomeSources
    .filter((s) => s.type === 'salary')
    .reduce((s) => s, 0) * 0
  // Actually look at 401k/IRA contributions from assets
  const investmentRate = totalAssets > 0 ? 23.8 : 0 // simplification for now

  // Health score
  const healthResult = calcHealthScore({
    savingsRate,
    debtBurdenRatio,
    emergencyCoverageMonths: efCoverage,
    emergencyFundTargetMonths: assumptions.emergencyFundMonths,
    avgGoalConfidence,
    investmentRate,
  })

  // FBAR check
  const foreignAssets = assets.filter((a) => a.isForeignAccount)
  const foreignTotal = foreignAssets.reduce((s, a) => {
    const usdBalance = a.currency === 'USD' ? a.balance : a.balance / (assumptions.usdToInrRate || 83.5)
    return s + usdBalance
  }, 0)
  const fbarStatus = foreignTotal >= H1B_CONSTANTS.fbarThreshold
    ? 'exceeded'
    : foreignTotal >= H1B_CONSTANTS.fbarWarningThreshold
      ? 'warning'
      : 'safe'

  return {
    profile,
    assumptions,
    visaInfo,
    // Income
    grossMonthly,
    netMonthly,
    // Expenses
    totalExpenses,
    fixedExpenses,
    variableExpenses: totalExpenses - fixedExpenses,
    // Cash flow
    freeCashFlow,
    savingsRate,
    investmentRate,
    // Balance sheet
    totalAssets,
    totalLiabilities,
    netWorth,
    // Debt
    totalMinimumPayments,
    debtBurdenRatio,
    liabilities,
    // Emergency fund
    liquidAssets,
    efCoverage,
    efTarget: totalExpenses * assumptions.emergencyFundMonths,
    // Goals
    goals: goalsWithConf,
    avgGoalConfidence,
    // Scores
    healthScore: healthResult.total,
    healthBreakdown: healthResult.breakdown,
    // H1B
    foreignTotal,
    fbarStatus,
    // Raw data (for AI context)
    incomeSources,
    expenses,
    assets,
    snapshot,
  }
}

// ─── Update snapshot ──────────────────────────────────────────────────────────

export async function refreshSnapshot() {
  const summary = await getFinancialSummary()
  if (!summary) return

  const month = getMonthKey()

  await prisma.financialSnapshot.upsert({
    where: { month },
    create: {
      month,
      totalIncomeGross: summary.grossMonthly,
      totalIncomeNet: summary.netMonthly,
      totalExpenses: summary.totalExpenses,
      freeCashFlow: summary.freeCashFlow,
      totalAssets: summary.totalAssets,
      totalLiabilities: summary.totalLiabilities,
      netWorth: summary.netWorth,
      savingsRate: summary.savingsRate,
      investmentRate: summary.investmentRate,
      debtBurdenRatio: summary.debtBurdenRatio,
      fixedExpenseRatio: summary.fixedExpenses / summary.netMonthly * 100,
      liquidAssets: summary.liquidAssets,
      emergencyFundMonths: summary.efCoverage,
      emergencyFundTarget: summary.efTarget,
      healthScore: summary.healthScore,
      avgGoalConfidence: summary.avgGoalConfidence,
      goalsOnTrack: summary.goals.filter((g) => g.confidenceScore >= 70).length,
      goalsOffTrack: summary.goals.filter((g) => g.confidenceScore < 70).length,
      fbarThresholdStatus: summary.fbarStatus,
      foreignAccountsTotal: summary.foreignTotal,
    },
    update: {
      totalIncomeGross: summary.grossMonthly,
      totalIncomeNet: summary.netMonthly,
      totalExpenses: summary.totalExpenses,
      freeCashFlow: summary.freeCashFlow,
      totalAssets: summary.totalAssets,
      totalLiabilities: summary.totalLiabilities,
      netWorth: summary.netWorth,
      savingsRate: summary.savingsRate,
      investmentRate: summary.investmentRate,
      debtBurdenRatio: summary.debtBurdenRatio,
      liquidAssets: summary.liquidAssets,
      emergencyFundMonths: summary.efCoverage,
      healthScore: summary.healthScore,
      avgGoalConfidence: summary.avgGoalConfidence,
      fbarThresholdStatus: summary.fbarStatus,
      foreignAccountsTotal: summary.foreignTotal,
    },
  })
}

// ─── Income CRUD ──────────────────────────────────────────────────────────────

export async function createIncomeSource(data: {
  name: string
  type: string
  amount: number
  frequency: string
  taxable: boolean
  growthRate?: number
  scenario?: string
  notes?: string
}) {
  const result = await prisma.incomeSource.create({ data })
  revalidatePath('/')
  return result
}

export async function updateIncomeSource(id: string, data: Partial<{
  name: string; type: string; amount: number; frequency: string;
  taxable: boolean; growthRate: number; isActive: boolean; notes: string
}>) {
  const result = await prisma.incomeSource.update({ where: { id }, data })
  revalidatePath('/')
  return result
}

export async function deleteIncomeSource(id: string) {
  await prisma.incomeSource.update({ where: { id }, data: { isActive: false } })
  revalidatePath('/')
}

// ─── Expense CRUD ─────────────────────────────────────────────────────────────

export async function createExpense(data: {
  name: string; categoryId: string; amount: number; frequency: string;
  isFixed: boolean; isEssential?: boolean; notes?: string
}) {
  const result = await prisma.expense.create({ data })
  revalidatePath('/')
  return result
}

export async function updateExpense(id: string, data: Partial<{
  name: string; amount: number; frequency: string; isFixed: boolean; isActive: boolean; notes: string
}>) {
  const result = await prisma.expense.update({ where: { id }, data })
  revalidatePath('/')
  return result
}

export async function deleteExpense(id: string) {
  await prisma.expense.update({ where: { id }, data: { isActive: false } })
  revalidatePath('/')
}

// ─── Asset CRUD ───────────────────────────────────────────────────────────────

export async function upsertAsset(data: {
  id?: string; name: string; type: string; balance: number;
  currency?: string; institution?: string; isForeignAccount?: boolean;
  contributionYTD?: number; notes?: string
}) {
  const { id, ...rest } = data
  if (id) {
    const result = await prisma.asset.update({ where: { id }, data: rest })
    revalidatePath('/')
    return result
  }
  const result = await prisma.asset.create({ data: rest })
  revalidatePath('/')
  return result
}

// ─── Liability CRUD ───────────────────────────────────────────────────────────

export async function upsertLiability(data: {
  id?: string; name: string; type: string; principalBalance: number;
  originalBalance?: number; interestRate: number; minimumPayment: number;
  extraPayment?: number; lender?: string; notes?: string
}) {
  const { id, ...rest } = data
  if (id) {
    const result = await prisma.liability.update({ where: { id }, data: rest })
    revalidatePath('/')
    return result
  }
  const result = await prisma.liability.create({
    data: { ...rest, originalBalance: rest.originalBalance ?? rest.principalBalance }
  })
  revalidatePath('/')
  return result
}

// ─── Goal CRUD ────────────────────────────────────────────────────────────────

export async function upsertGoal(data: {
  id?: string; name: string; type: string; targetAmount: number;
  currentAmount?: number; targetDate?: Date; priority?: number;
  monthlyContrib?: number; whyItMatters?: string; notes?: string; color?: string; icon?: string
}) {
  const { id, ...rest } = data
  if (id) {
    const result = await prisma.goal.update({ where: { id }, data: rest })
    revalidatePath('/')
    return result
  }
  const result = await prisma.goal.create({ data: rest })
  revalidatePath('/')
  return result
}

export async function updateGoalContrib(id: string, amount: number) {
  const result = await prisma.goal.update({ where: { id }, data: { currentAmount: { increment: amount } } })
  revalidatePath('/')
  return result
}

export async function updateGoalStatus(id: string, status: 'active' | 'paused' | 'completed' | 'cancelled') {
  const result = await prisma.goal.update({ where: { id }, data: { status } })
  revalidatePath('/')
  return result
}

// ─── Note CRUD ────────────────────────────────────────────────────────────────

export async function createNote(data: { title: string; content: string; tags?: string; isPinned?: boolean; goalId?: string }) {
  const result = await prisma.note.create({ data })
  revalidatePath('/notes')
  return result
}

export async function updateNote(id: string, data: Partial<{ title: string; content: string; tags: string; isPinned: boolean }>) {
  const result = await prisma.note.update({ where: { id }, data })
  revalidatePath('/notes')
  return result
}

export async function deleteNote(id: string) {
  await prisma.note.delete({ where: { id } })
  revalidatePath('/notes')
}

// ─── Reflection ───────────────────────────────────────────────────────────────

export async function upsertReflection(data: {
  month: string; mood?: string; wins?: string; challenges?: string;
  nextMonthFocus?: string; gratitude?: string; moneyLesson?: string
}) {
  const result = await prisma.reflection.upsert({
    where: { month: data.month },
    create: data,
    update: data,
  })
  revalidatePath('/notes')
  return result
}

// ─── Remittance CRUD ──────────────────────────────────────────────────────────

export async function createRemittance(data: {
  date: Date; amountUSD: number; amountINR?: number; exchangeRate?: number;
  fee?: number; method?: string; recipient?: string; purpose?: string; notes?: string
}) {
  const result = await prisma.remittanceLog.create({ data })
  revalidatePath('/h1b')
  return result
}

// ─── Reminder ────────────────────────────────────────────────────────────────

export async function completeReminder(id: string) {
  const result = await prisma.reminder.update({
    where: { id },
    data: { isCompleted: true, completedAt: new Date() }
  })
  revalidatePath('/')
  return result
}

// ─── Life Event ───────────────────────────────────────────────────────────────

export async function createLifeEvent(data: {
  title: string; type: string; date: Date; amount?: number; notes?: string; icon?: string
}) {
  const result = await prisma.lifeEvent.create({ data })
  revalidatePath('/notes')
  return result
}

// ─── Simulation ───────────────────────────────────────────────────────────────

export async function saveSimulation(data: {
  name: string; type: string; presetKey?: string;
  parameters: object; results: object; notes?: string
}) {
  const result = await prisma.simulation.create({
    data: {
      ...data,
      parameters: JSON.stringify(data.parameters),
      results: JSON.stringify(data.results),
    }
  })
  revalidatePath('/simulator')
  return result
}

// ─── Historical snapshots (for charts) ───────────────────────────────────────

export async function getSnapshotHistory(months = 12) {
  return prisma.financialSnapshot.findMany({
    orderBy: { month: 'asc' },
    take: months,
  })
}
