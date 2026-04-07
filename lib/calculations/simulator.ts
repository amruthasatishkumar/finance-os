import { calcFutureValue } from './investments'
import { calcGoal, GoalCalcInputs } from './goals'

export interface FinancialState {
  monthlyNetIncome: number
  monthlyExpenses: number
  totalAssets: number
  totalLiabilities: number
  monthlyInvestmentContrib: number
  goals: Array<GoalCalcInputs & { id: string; name: string }>
  annualReturnRate: number
  inflationRate: number
}

export interface ScenarioParams {
  key: string
  overrides: Partial<{
    monthlyNetIncomeDelta: number
    monthlyExpensesDelta: number
    onceOffAssetDelta: number
    onceOffLiabilityDelta: number
    investmentContribDelta: number
    newMonthlyDebt: number
    years: number
  }>
}

export interface ScenarioResult {
  key: string
  name: string
  // Monthly impact
  monthlyIncomeNew: number
  monthlyExpensesNew: number
  freeCashFlowDelta: number
  // Net worth impact
  netWorthNow: number
  netWorthIn5Years: number
  netWorthIn10Years: number
  netWorthIn5YearsBaseline: number
  netWorthIn10YearsBaseline: number
  // Goal impacts
  goalImpacts: Array<{
    id: string
    name: string
    confidenceBefore: number
    confidenceAfter: number
    monthsDelayed: number
  }>
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  summary: string
}

export function runScenario(
  state: FinancialState,
  params: ScenarioParams,
): ScenarioResult {
  const o = params.overrides
  const baseline = state

  const netIncomeNew = baseline.monthlyNetIncome + (o.monthlyNetIncomeDelta ?? 0)
  const expensesNew = baseline.monthlyExpenses + (o.monthlyExpensesDelta ?? 0)
  const fcfDelta = (netIncomeNew - expensesNew) - (baseline.monthlyNetIncome - baseline.monthlyExpenses)

  const assetsNew = baseline.totalAssets + (o.onceOffAssetDelta ?? 0)
  const liabilitiesNew = baseline.totalLiabilities + (o.onceOffLiabilityDelta ?? 0)
  const netWorthNow = assetsNew - liabilitiesNew

  const investNew = baseline.monthlyInvestmentContrib + (o.investmentContribDelta ?? 0)
  const fcfNew = netIncomeNew - expensesNew

  // For portfolio projection, use free cash as savings
  const monthlySavingsBaseline = baseline.monthlyNetIncome - baseline.monthlyExpenses
  const monthlySavingsNew = fcfNew

  const nw5Base = netWorthNow + calcFutureValue(Math.max(0, netWorthNow * 0.6), Math.max(0, monthlySavingsBaseline * 0.6), baseline.annualReturnRate, 5)
  const nw10Base = netWorthNow + calcFutureValue(Math.max(0, netWorthNow * 0.6), Math.max(0, monthlySavingsBaseline * 0.6), baseline.annualReturnRate, 10)
  const nw5New = netWorthNow + calcFutureValue(Math.max(0, netWorthNow * 0.6), Math.max(0, monthlySavingsNew * 0.6), baseline.annualReturnRate, 5)
  const nw10New = netWorthNow + calcFutureValue(Math.max(0, netWorthNow * 0.6), Math.max(0, monthlySavingsNew * 0.6), baseline.annualReturnRate, 10)

  // Goal impacts
  const goalImpacts = baseline.goals.map((g) => {
    const before = calcGoal(g)
    const after = calcGoal({
      ...g,
      monthlyContrib: Math.max(0, g.monthlyContrib + (o.monthlyNetIncomeDelta ?? 0) * 0.3),
    })

    return {
      id: g.id,
      name: g.name,
      confidenceBefore: before.confidenceScore,
      confidenceAfter: after.confidenceScore,
      monthsDelayed: Math.max(0, after.monthsRemaining - before.monthsRemaining),
    }
  })

  // Risk level
  let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low'
  if (fcfNew < 0) riskLevel = 'critical'
  else if (fcfNew < 500) riskLevel = 'high'
  else if (fcfDelta < -1000) riskLevel = 'medium'

  return {
    key: params.key,
    name: params.key,
    monthlyIncomeNew: netIncomeNew,
    monthlyExpensesNew: expensesNew,
    freeCashFlowDelta: fcfDelta,
    netWorthNow,
    netWorthIn5Years: nw5New,
    netWorthIn10Years: nw10New,
    netWorthIn5YearsBaseline: nw5Base,
    netWorthIn10YearsBaseline: nw10Base,
    goalImpacts,
    riskLevel,
    summary: `Free cash flow changes by ${fcfDelta >= 0 ? '+' : ''}$${Math.abs(fcfDelta).toFixed(0)}/month.`,
  }
}

// ─── Preset scenario helpers ───────────────────────────────────────────────────

export function getPresetOverrides(
  key: string,
  state: FinancialState,
): Partial<ScenarioParams['overrides']> {
  const currentFCF = state.monthlyNetIncome - state.monthlyExpenses

  const presets: Record<string, Partial<ScenarioParams['overrides']>> = {
    salary_increase_20: { monthlyNetIncomeDelta: state.monthlyNetIncome * 0.2 },
    salary_drop: { monthlyNetIncomeDelta: -(state.monthlyNetIncome - 5500) },
    job_loss: { monthlyNetIncomeDelta: -state.monthlyNetIncome },
    relocate_tx: { monthlyNetIncomeDelta: state.monthlyNetIncome * 0.093 }, // CA state tax savings
    buy_home: { onceOffAssetDelta: 700000, onceOffLiabilityDelta: 560000, monthlyExpensesDelta: 2200 },
    buy_car: { onceOffAssetDelta: 40000, onceOffLiabilityDelta: 32000, monthlyExpensesDelta: 450 },
    prepay_loan: { monthlyExpensesDelta: 500 },
    increase_remittance: { monthlyExpensesDelta: 500 },
    pause_401k: { investmentContribDelta: -1958, monthlyNetIncomeDelta: 1000 }, // approx post-tax benefit
    sabbatical: { monthlyNetIncomeDelta: -state.monthlyNetIncome, monthlyExpensesDelta: -500 },
    have_child: { monthlyExpensesDelta: 1500, monthlyNetIncomeDelta: -2000 }, // year-1 income drop
    market_crash: { onceOffAssetDelta: -(state.totalAssets * 0.3) },
  }

  return presets[key] ?? {}
}
