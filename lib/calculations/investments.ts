import { clamp } from '@/lib/utils'

// ─── Future value projection ───────────────────────────────────────────────────

export function calcFutureValue(
  presentValue: number,
  monthlyContrib: number,
  annualReturnRate: number,
  years: number,
): number {
  const monthlyRate = annualReturnRate / 12
  const months = years * 12

  if (monthlyRate === 0) {
    return presentValue + monthlyContrib * months
  }

  const growthFactor = Math.pow(1 + monthlyRate, months)
  const pvGrowth = presentValue * growthFactor
  const contribGrowth = monthlyContrib * ((growthFactor - 1) / monthlyRate)
  return pvGrowth + contribGrowth
}

export interface ProjectionPoint {
  year: number
  conservative: number
  base: number
  optimistic: number
  contributions: number
}

export function calcPortfolioProjection(
  currentValue: number,
  monthlyContrib: number,
  years: number,
  conservativeRate: number = 0.06,
  baseRate: number = 0.08,
  optimisticRate: number = 0.10,
): ProjectionPoint[] {
  const points: ProjectionPoint[] = []
  let totalContrib = currentValue

  for (let y = 0; y <= years; y++) {
    totalContrib = currentValue + monthlyContrib * 12 * y
    points.push({
      year: new Date().getFullYear() + y,
      conservative: Math.round(calcFutureValue(currentValue, monthlyContrib, conservativeRate, y)),
      base: Math.round(calcFutureValue(currentValue, monthlyContrib, baseRate, y)),
      optimistic: Math.round(calcFutureValue(currentValue, monthlyContrib, optimisticRate, y)),
      contributions: Math.round(totalContrib),
    })
  }

  return points
}

// ─── Retirement corpus calculation ────────────────────────────────────────────

export interface RetirementInputs {
  currentAge: number
  retirementAge: number
  currentAnnualExpenses: number
  inflationRate: number
  safeWithdrawalRate: number
  includeSocialSecurity: boolean
  estimatedSsBenefit: number       // monthly
  currentPortfolioValue: number
  monthlyContrib: number
  annualReturnRate: number
}

export interface RetirementResult {
  corpusNeeded: number
  projectedCorpus: number
  confidenceScore: number
  yearsToRetirement: number
  annualExpensesAtRetirement: number
  shortfall: number
  monthlyContribRequired: number
  fireNumber: number   // 25x current expenses
}

export function calcRetirement(inputs: RetirementInputs): RetirementResult {
  const {
    currentAge,
    retirementAge,
    currentAnnualExpenses,
    inflationRate,
    safeWithdrawalRate,
    includeSocialSecurity,
    estimatedSsBenefit,
    currentPortfolioValue,
    monthlyContrib,
    annualReturnRate,
  } = inputs

  const yearsToRetirement = Math.max(0, retirementAge - currentAge)

  // Expenses at retirement (inflation-adjusted)
  const annualExpensesAtRetirement = currentAnnualExpenses * Math.pow(1 + inflationRate, yearsToRetirement)

  // SS offset (monthly → annual)
  const annualSSOffset = includeSocialSecurity ? estimatedSsBenefit * 12 : 0
  const netAnnualExpenses = Math.max(0, annualExpensesAtRetirement - annualSSOffset)

  // Corpus needed (4% SWR)
  const corpusNeeded = netAnnualExpenses / safeWithdrawalRate

  // FIRE number (25x current expenses, un-inflated)
  const fireNumber = currentAnnualExpenses * 25

  // Projected corpus at retirement
  const projectedCorpus = calcFutureValue(
    currentPortfolioValue,
    monthlyContrib,
    annualReturnRate,
    yearsToRetirement,
  )

  // Confidence score
  const confidenceScore = clamp((projectedCorpus / corpusNeeded) * 100, 0, 100)

  // Required monthly contribution to hit corpus
  const growthFactor = Math.pow(1 + annualReturnRate / 12, yearsToRetirement * 12)
  const pvGrowth = currentPortfolioValue * growthFactor
  const remaining = Math.max(0, corpusNeeded - pvGrowth)
  const monthlyRate = annualReturnRate / 12
  const monthlyContribRequired =
    monthlyRate > 0 && growthFactor > 1
      ? (remaining * monthlyRate) / (growthFactor - 1)
      : remaining / (yearsToRetirement * 12)

  return {
    corpusNeeded: Math.round(corpusNeeded),
    projectedCorpus: Math.round(projectedCorpus),
    confidenceScore: Math.round(confidenceScore),
    yearsToRetirement,
    annualExpensesAtRetirement: Math.round(annualExpensesAtRetirement),
    shortfall: Math.round(Math.max(0, corpusNeeded - projectedCorpus)),
    monthlyContribRequired: Math.round(monthlyContribRequired),
    fireNumber: Math.round(fireNumber),
  }
}

// ─── Investment rate ───────────────────────────────────────────────────────────

export function calcInvestmentRate(
  monthlyInvestmentContrib: number,
  monthlyNetIncome: number,
): number {
  if (monthlyNetIncome <= 0) return 0
  return clamp((monthlyInvestmentContrib / monthlyNetIncome) * 100, 0, 100)
}
