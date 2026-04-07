import {
  FEDERAL_TAX_BRACKETS_2025_SINGLE,
  FEDERAL_TAX_BRACKETS_2025_MFJ,
  STANDARD_DEDUCTION_2025,
  CA_STATE_TAX_BRACKETS_2025_SINGLE,
  CA_STATE_TAX_BRACKETS_2025_MFJ,
  CA_STANDARD_DEDUCTION_2025,
  CA_SDI_RATE_2025,
  FICA_2025,
} from '@/lib/constants'
import { normalizeToMonthly } from '@/lib/utils'

// ─── Progressive bracket helper ───────────────────────────────────────────────

function applyBrackets(taxableIncome: number, brackets: { min: number; max: number; rate: number }[]): number {
  let tax = 0
  for (const bracket of brackets) {
    if (taxableIncome <= bracket.min) break
    const taxable = Math.min(taxableIncome, bracket.max) - bracket.min
    tax += taxable * bracket.rate
  }
  return tax
}

// ─── Federal income tax (2025 brackets) ───────────────────────────────────────

export function calcFederalTax(
  grossIncome: number,
  filingStatus: string = 'single',
  preTaxDeductions: number = 0,   // 401k traditional + HSA + FSA (reduce W-2 taxable income)
): number {
  const deduction =
    STANDARD_DEDUCTION_2025[filingStatus as keyof typeof STANDARD_DEDUCTION_2025] ??
    STANDARD_DEDUCTION_2025.single
  const taxableIncome = Math.max(0, grossIncome - preTaxDeductions - deduction)
  const brackets =
    filingStatus === 'married_jointly'
      ? FEDERAL_TAX_BRACKETS_2025_MFJ
      : FEDERAL_TAX_BRACKETS_2025_SINGLE
  return applyBrackets(taxableIncome, brackets)
}

export function calcFICA(grossIncome: number): number {
  const { socialSecurityRate, socialSecurityCap, medicareRate, additionalMedicareRate, additionalMedicareThreshold } = FICA_2025
  // Note: 401k traditional does NOT reduce FICA base — FICA is on gross wages
  const ss = Math.min(grossIncome, socialSecurityCap) * socialSecurityRate
  const medicare = grossIncome * medicareRate
  const additionalMedicare = Math.max(0, grossIncome - additionalMedicareThreshold) * additionalMedicareRate
  return ss + medicare + additionalMedicare
}

// ─── State tax ────────────────────────────────────────────────────────────────
// California uses progressive brackets; all other states use a flat rate fallback.
// preTaxDeductions reduce CA state taxable income too (CA conforms to federal pre-tax treatment
// for 401k traditional, HSA — though CA does NOT allow HSA deduction; we include for simplicity).

export function calcStateTax(
  grossIncome: number,
  stateTaxRate: number,
  filingStatus: string = 'single',
  preTaxDeductions: number = 0,
  state: string = '',
): number {
  if (state === 'California' || stateTaxRate === 0.093) {
    // Use CA progressive brackets
    const caDeduction =
      CA_STANDARD_DEDUCTION_2025[filingStatus as keyof typeof CA_STANDARD_DEDUCTION_2025] ??
      CA_STANDARD_DEDUCTION_2025.single
    const taxableIncome = Math.max(0, grossIncome - preTaxDeductions - caDeduction)
    const brackets =
      filingStatus === 'married_jointly'
        ? CA_STATE_TAX_BRACKETS_2025_MFJ
        : CA_STATE_TAX_BRACKETS_2025_SINGLE
    const stateTax = applyBrackets(taxableIncome, brackets)
    // CA SDI: 1.1% on ALL wages (no cap 2025), not reduced by pre-tax deductions
    const sdi = grossIncome * CA_SDI_RATE_2025
    return stateTax + sdi
  }
  // Flat rate for all other states
  return Math.max(0, grossIncome - preTaxDeductions) * stateTaxRate
}

// ─── Full annual net income breakdown ─────────────────────────────────────────

export function calcAnnualNetIncome(
  grossAnnualIncome: number,
  filingStatus: string = 'single',
  stateTaxRate: number = 0.093,
  preTaxDeductions: number = 0,
  state: string = 'California',
): {
  gross: number
  preTaxDeductions: number
  federalTax: number
  stateTax: number
  fica: number
  totalTax: number
  net: number
  effectiveFederalRate: number
  effectiveTotalRate: number
} {
  const federal = calcFederalTax(grossAnnualIncome, filingStatus, preTaxDeductions)
  const stateTaxAmt = calcStateTax(grossAnnualIncome, stateTaxRate, filingStatus, preTaxDeductions, state)
  const fica = calcFICA(grossAnnualIncome)
  const totalTax = federal + stateTaxAmt + fica
  // Net = gross - pre-tax deductions (go to 401k/HSA account, not pocket) - taxes
  const net = grossAnnualIncome - preTaxDeductions - totalTax

  return {
    gross: grossAnnualIncome,
    preTaxDeductions,
    federalTax: federal,
    stateTax: stateTaxAmt,
    fica,
    totalTax,
    net,
    effectiveFederalRate: grossAnnualIncome > 0 ? federal / grossAnnualIncome : 0,
    effectiveTotalRate: grossAnnualIncome > 0 ? (totalTax + preTaxDeductions) / grossAnnualIncome : 0,
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
    .reduce((sum, s) => sum + normalizeToMonthly(s.amount, s.frequency), 0)
}

export function calcMonthlyNetIncome(
  sources: IncomeSourceRaw[],
  filingStatus: string = 'single',
  stateTaxRate: number = 0.093,
  preTaxDeductions: number = 0,
  state: string = 'California',
): number {
  const grossAnnual = calcMonthlyGrossIncome(sources) * 12
  const { net } = calcAnnualNetIncome(grossAnnual, filingStatus, stateTaxRate, preTaxDeductions, state)
  return net / 12
}
