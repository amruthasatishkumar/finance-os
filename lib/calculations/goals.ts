import { clamp, monthsUntil, inflationAdjust } from '@/lib/utils'

// ─── Goal confidence and contribution math ────────────────────────────────────

export interface GoalCalcInputs {
  targetAmount: number
  currentAmount: number
  targetDate?: Date
  monthlyContrib: number
  annualReturnRate?: number
  inflationRate?: number
  isInflationAdjusted?: boolean
}

export interface GoalCalcResult {
  inflationAdjTarget: number
  monthsRemaining: number
  requiredMonthlyContrib: number
  confidenceScore: number
  projectedAmount: number
  shortfall: number
  achievedByDate?: Date
}

export function calcGoal(inputs: GoalCalcInputs): GoalCalcResult {
  const {
    targetAmount,
    currentAmount,
    targetDate,
    monthlyContrib,
    annualReturnRate = 0.06,
    inflationRate = 0.035,
    isInflationAdjusted = true,
  } = inputs

  const monthlyRate = annualReturnRate / 12
  const monthsRemaining = targetDate ? Math.max(0, monthsUntil(targetDate)) : 60 // default 5 years

  // Inflation-adjust target
  const yearsRemaining = monthsRemaining / 12
  const inflationAdjTarget = isInflationAdjusted
    ? inflationAdjust(targetAmount, yearsRemaining, inflationRate)
    : targetAmount

  // Required monthly contribution using PMT formula
  // FV = PV*(1+r)^n + PMT*((1+r)^n - 1)/r
  const growthFactor = Math.pow(1 + monthlyRate, monthsRemaining)
  let requiredMonthlyContrib = 0
  if (monthsRemaining > 0) {
    const remainingAfterGrowth = inflationAdjTarget - currentAmount * growthFactor
    if (monthlyRate > 0) {
      requiredMonthlyContrib = Math.max(0, (remainingAfterGrowth * monthlyRate) / (growthFactor - 1))
    } else {
      requiredMonthlyContrib = Math.max(0, remainingAfterGrowth / monthsRemaining)
    }
  }

  // Projected amount given current monthly contribution
  let projectedAmount = currentAmount * growthFactor
  if (monthlyRate > 0 && monthsRemaining > 0) {
    projectedAmount += monthlyContrib * ((growthFactor - 1) / monthlyRate)
  } else {
    projectedAmount += monthlyContrib * monthsRemaining
  }

  // Confidence score
  let confidenceScore: number
  if (requiredMonthlyContrib <= 0) {
    confidenceScore = 100 // Already funded
  } else {
    confidenceScore = clamp((monthlyContrib / requiredMonthlyContrib) * 100, 0, 100)
  }

  // Shortfall
  const shortfall = Math.max(0, inflationAdjTarget - projectedAmount)

  return {
    inflationAdjTarget,
    monthsRemaining,
    requiredMonthlyContrib,
    confidenceScore: Math.round(confidenceScore),
    projectedAmount,
    shortfall,
  }
}

export function calcMonthsToGoal(
  targetAmount: number,
  currentAmount: number,
  monthlyContrib: number,
  annualReturnRate = 0.06,
): number {
  if (monthlyContrib <= 0) return Infinity
  const monthlyRate = annualReturnRate / 12
  const remaining = targetAmount - currentAmount

  if (monthlyRate === 0) {
    return Math.ceil(remaining / monthlyContrib)
  }

  // Solve n: FV = PMT * ((1+r)^n - 1) / r
  // Given current balance: FV = PV*(1+r)^n + PMT*((1+r)^n - 1)/r
  // This requires iterative solution
  let months = 0
  let balance = currentAmount
  while (balance < targetAmount && months < 1200) {
    balance = balance * (1 + monthlyRate) + monthlyContrib
    months++
  }
  return months >= 1200 ? Infinity : months
}

export function calcAvgGoalConfidence(goals: Array<{ confidenceScore: number }>): number {
  if (goals.length === 0) return 0
  return goals.reduce((sum, g) => sum + g.confidenceScore, 0) / goals.length
}
