import { normalizeToMonthly, clamp } from '@/lib/utils'
import { HEALTH_SCORE_WEIGHTS, HEALTH_SCORE_TARGETS } from '@/lib/constants'

export interface ExpenseRaw {
  amount: number
  frequency: string
  isFixed: boolean
}

export function calcMonthlyExpenses(expenses: ExpenseRaw[]): number {
  return expenses.reduce((sum, e) => sum + normalizeToMonthly(e.amount, e.frequency), 0)
}

export function calcFixedExpenses(expenses: ExpenseRaw[]): number {
  return expenses
    .filter((e) => e.isFixed)
    .reduce((sum, e) => sum + normalizeToMonthly(e.amount, e.frequency), 0)
}

export function calcVariableExpenses(expenses: ExpenseRaw[]): number {
  return expenses
    .filter((e) => !e.isFixed)
    .reduce((sum, e) => sum + normalizeToMonthly(e.amount, e.frequency), 0)
}

export function calcFreeCashFlow(monthlyNetIncome: number, monthlyExpenses: number): number {
  return monthlyNetIncome - monthlyExpenses
}

export function calcSavingsRate(freeCashFlow: number, monthlyNetIncome: number): number {
  if (monthlyNetIncome <= 0) return 0
  return clamp(freeCashFlow / monthlyNetIncome, 0, 1) * 100
}

export function calcDebtBurdenRatio(
  totalMinimumPayments: number,
  monthlyGrossIncome: number,
): number {
  if (monthlyGrossIncome <= 0) return 0
  return clamp(totalMinimumPayments / monthlyGrossIncome, 0, 1) * 100
}

export function calcFixedExpenseRatio(
  fixedExpenses: number,
  monthlyNetIncome: number,
): number {
  if (monthlyNetIncome <= 0) return 0
  return clamp(fixedExpenses / monthlyNetIncome, 0, 1) * 100
}

export interface NetWorthInputs {
  totalAssets: number
  totalLiabilities: number
}

export function calcNetWorth(inputs: NetWorthInputs): number {
  return inputs.totalAssets - inputs.totalLiabilities
}

export function calcEmergencyFundCoverage(
  liquidAssets: number,
  monthlyExpenses: number,
): number {
  if (monthlyExpenses <= 0) return 0
  return liquidAssets / monthlyExpenses
}

// ─── Health Score (0–100) ──────────────────────────────────────────────────────

export interface HealthScoreInputs {
  savingsRate: number           // percentage 0-100
  debtBurdenRatio: number       // percentage 0-100
  emergencyCoverageMonths: number
  emergencyFundTargetMonths: number
  avgGoalConfidence: number     // percentage 0-100
  investmentRate: number        // percentage 0-100
}

export function calcHealthScore(inputs: HealthScoreInputs): {
  total: number
  breakdown: {
    savings: number
    debt: number
    emergency: number
    goals: number
    investment: number
  }
} {
  const { savingsRate, debtBurdenRatio, emergencyCoverageMonths, emergencyFundTargetMonths, avgGoalConfidence, investmentRate } = inputs
  const { savingsRateTarget, debtBurdenTarget, investmentRateTarget } = HEALTH_SCORE_TARGETS

  const savingsScore = clamp(savingsRate / 100 / savingsRateTarget, 0, 1) * HEALTH_SCORE_WEIGHTS.savings
  const debtScore = clamp(1 - (debtBurdenRatio / 100) / debtBurdenTarget, 0, 1) * HEALTH_SCORE_WEIGHTS.debt
  const emergencyScore = clamp(emergencyCoverageMonths / emergencyFundTargetMonths, 0, 1) * HEALTH_SCORE_WEIGHTS.emergency
  const goalsScore = clamp(avgGoalConfidence / 100, 0, 1) * HEALTH_SCORE_WEIGHTS.goals
  const investmentScore = clamp(investmentRate / 100 / investmentRateTarget, 0, 1) * HEALTH_SCORE_WEIGHTS.investment

  const total = savingsScore + debtScore + emergencyScore + goalsScore + investmentScore

  return {
    total: Math.round(total),
    breakdown: {
      savings: Math.round(savingsScore),
      debt: Math.round(debtScore),
      emergency: Math.round(emergencyScore),
      goals: Math.round(goalsScore),
      investment: Math.round(investmentScore),
    },
  }
}

export function calcFutureReadinessScore(
  healthScore: number,
  retirementConfidence: number,
  debtFreeYears: number, // years until debt-free
  emergencyReady: boolean,
): number {
  const base = healthScore * 0.4
  const retirement = clamp(retirementConfidence / 100, 0, 1) * 30
  const debtFactor = clamp(1 - debtFreeYears / 30, 0, 1) * 20
  const emergency = (emergencyReady ? 1 : 0) * 10
  return Math.round(clamp(base + retirement + debtFactor + emergency, 0, 100))
}
