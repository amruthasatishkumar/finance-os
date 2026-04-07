// ─── Debt payoff calculations ─────────────────────────────────────────────────

export interface DebtAccount {
  id: string
  name: string
  principalBalance: number
  interestRate: number    // annual, e.g. 0.065 = 6.5%
  minimumPayment: number
}

export interface AmortizationMonth {
  month: number
  payment: number
  principal: number
  interest: number
  balance: number
}

export interface DebtPayoffResult {
  strategyName: string
  monthsToPayoff: number
  totalInterestPaid: number
  totalPaid: number
  payoffOrder: string[]
  schedule: Record<string, AmortizationMonth[]>
}

function amortizeSingle(
  debt: DebtAccount,
  extraPayment: number = 0,
): AmortizationMonth[] {
  const monthlyRate = debt.interestRate / 12
  let balance = debt.principalBalance
  const schedule: AmortizationMonth[] = []
  let month = 0

  while (balance > 0.01 && month < 600) {
    month++
    const interest = balance * monthlyRate
    const totalPayment = Math.min(balance + interest, debt.minimumPayment + extraPayment)
    const principal = totalPayment - interest
    balance = Math.max(0, balance - principal)

    schedule.push({
      month,
      payment: totalPayment,
      principal,
      interest,
      balance,
    })
  }

  return schedule
}

// ─── Avalanche method (highest interest rate first) ───────────────────────────

export function calcDebtAvalanche(
  debts: DebtAccount[],
  extraMonthly: number = 0,
): DebtPayoffResult {
  const sorted = [...debts].sort((a, b) => b.interestRate - a.interestRate)
  return runDebSim('Debt Avalanche', sorted, extraMonthly)
}

// ─── Snowball method (smallest balance first) ─────────────────────────────────

export function calcDebtSnowball(
  debts: DebtAccount[],
  extraMonthly: number = 0,
): DebtPayoffResult {
  const sorted = [...debts].sort((a, b) => a.principalBalance - b.principalBalance)
  return runDebSim('Debt Snowball', sorted, extraMonthly)
}

function runDebSim(
  strategyName: string,
  ordered: DebtAccount[],
  extraMonthly: number,
): DebtPayoffResult {
  // Simulate full multi-debt payoff
  let month = 0
  const balances = ordered.map((d) => d.principalBalance)
  const rates = ordered.map((d) => d.interestRate / 12)
  const minimums = ordered.map((d) => d.minimumPayment)
  let totalInterest = 0
  let totalPaid = 0
  const payoffOrder: string[] = []
  const schedules: Record<string, AmortizationMonth[]> = {}
  ordered.forEach((d) => { schedules[d.id] = [] })

  while (balances.some((b) => b > 0.01) && month < 600) {
    month++
    let remainingExtra = extraMonthly

    for (let i = 0; i < ordered.length; i++) {
      if (balances[i] <= 0.01) {
        // Cascade minimum to extra
        remainingExtra += minimums[i]
        continue
      }

      const interest = balances[i] * rates[i]
      totalInterest += interest

      let payment = minimums[i]
      // Apply extra to the priority debt (first not yet paid)
      if (i === ordered.findIndex((_, j) => balances[j] > 0.01)) {
        payment += remainingExtra
        remainingExtra = 0
      }

      payment = Math.min(balances[i] + interest, payment)
      const principal = payment - interest
      balances[i] = Math.max(0, balances[i] - principal)
      totalPaid += payment

      schedules[ordered[i].id].push({
        month,
        payment,
        principal,
        interest,
        balance: balances[i],
      })

      if (balances[i] <= 0.01 && !payoffOrder.includes(ordered[i].id)) {
        payoffOrder.push(ordered[i].id)
      }
    }
  }

  return {
    strategyName,
    monthsToPayoff: month,
    totalInterestPaid: totalInterest,
    totalPaid,
    payoffOrder,
    schedule: schedules,
  }
}

export function calcPrepaymentSavings(
  debt: DebtAccount,
  extraMonthly: number,
): {
  monthsSaved: number
  interestSaved: number
  newPayoffDate: Date
} {
  const baseline = amortizeSingle(debt, 0)
  const accelerated = amortizeSingle(debt, extraMonthly)

  const monthsSaved = baseline.length - accelerated.length
  const baseInterest = baseline.reduce((s, m) => s + m.interest, 0)
  const accInterest = accelerated.reduce((s, m) => s + m.interest, 0)

  const newPayoffDate = new Date()
  newPayoffDate.setMonth(newPayoffDate.getMonth() + accelerated.length)

  return {
    monthsSaved,
    interestSaved: baseInterest - accInterest,
    newPayoffDate,
  }
}

export function calcTotalMinimumPayments(debts: DebtAccount[]): number {
  return debts.reduce((sum, d) => sum + d.minimumPayment, 0)
}

export function calcPayoffDate(debt: DebtAccount, extraPayment: number = 0): Date {
  const schedule = amortizeSingle(debt, extraPayment)
  const result = new Date()
  result.setMonth(result.getMonth() + schedule.length)
  return result
}
