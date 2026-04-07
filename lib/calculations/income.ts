import {
  FEDERAL_TAX_BRACKETS_2025_SINGLE,
  FEDERAL_TAX_BRACKETS_2025_MFJ,
  STANDARD_DEDUCTION_2025,
  FICA_2025,
} from '@/lib/constants'
import { normalizeToMonthly } from '@/lib/utils'

// ─── Federal income tax (2025 brackets) ───────────────────────────────────────

export function calcFederalTax(
  grossIncome: number,
  filingStatus: string = 'single',
): number {
  const deduction =
    STANDARD_DEDUCTION_2025[filingStatus as keyof typeof STANDARD_DEDUCTION_2025] ??
    STANDARD_DEDUCTION_2025.single
  const taxableIncome = Math.max(0, grossIncome - deduction)

  const brackets =
    filingStatus === 'married_jointly'
      ? FEDERAL_TAX_BRACKETS_2025_MFJ
      : FEDERAL_TAX_BRACKETS_2025_SINGLE

  let tax = 0
  for (const bracket of brackets) {
    if (taxableIncome <= bracket.min) break
    const taxable = Math.min(taxableIncome, bracket.max) - bracket.min
    tax += taxable * bracket.rate
  }
  return tax
}

export function calcFICA(grossIncome: number): number {
  const { socialSecurityRate, socialSecurityCap, medicareRate, additionalMedicareRate, additionalMedicareThreshold } = FICA_2025
  const ss = Math.min(grossIncome, socialSecurityCap) * socialSecurityRate
  const medicare = grossIncome * medicareRate
  const additionalMedicare = Math.max(0, grossIncome - additionalMedicareThreshold) * additionalMedicareRate
  return ss + medicare + additionalMedicare
}

export function calcStateTax(grossIncome: number, stateTaxRate: number): number {
  return grossIncome * stateTaxRate
}

export function calcAnnualNetIncome(
  grossAnnualIncome: number,
  filingStatus: string = 'single',
  stateTaxRate: number = 0.093,
): {
  gross: number
  federalTax: number
  stateTax: number
  fica: number
  totalTax: number
  net: number
  effectiveFederalRate: number
  effectiveTotalRate: number
} {
  const federal = calcFederalTax(grossAnnualIncome, filingStatus)
  const state = calcStateTax(grossAnnualIncome, stateTaxRate)
  const fica = calcFICA(grossAnnualIncome)
  const total = federal + state + fica
  const net = grossAnnualIncome - total

  return {
    gross: grossAnnualIncome,
    federalTax: federal,
    stateTax: state,
    fica,
    totalTax: total,
    net,
    effectiveFederalRate: federal / grossAnnualIncome,
    effectiveTotalRate: total / grossAnnualIncome,
  }
}

// ─── Monthly income normalization ─────────────────────────────────────────────

export interface IncomeSourceRaw {
  amount: number
  frequency: string
  taxable: boolean
  type: string
}

export function calcMonthlyGrossIncome(sources: IncomeSourceRaw[]): number {
  return sources
    .filter((s) => s.taxable !== false)
    .reduce((sum, s) => sum + normalizeToMonthly(s.amount, s.frequency), 0)
}

export function calcMonthlyNetIncome(
  sources: IncomeSourceRaw[],
  filingStatus: string = 'single',
  stateTaxRate: number = 0.093,
): number {
  const grossAnnual = calcMonthlyGrossIncome(sources) * 12
  const { net } = calcAnnualNetIncome(grossAnnual, filingStatus, stateTaxRate)
  return net / 12
}
