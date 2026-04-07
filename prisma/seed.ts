/**
 * Seed file for Finance OS
 * Realistic H1B user profile: Alex Sharma, 29, Senior SWE, California
 * Run: pnpm db:seed
 */

import { PrismaClient } from '../generated/prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import path from 'node:path'

const DB_PATH = path.join(__dirname, '..', 'prisma', 'dev.db')
const adapter = new PrismaBetterSqlite3({ url: `file:${DB_PATH}` })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding Finance OS database...')

  // ─── Cleanup existing data ───────────────────────────────────────────────
  await prisma.remittanceLog.deleteMany()
  await prisma.document.deleteMany()
  await prisma.reminder.deleteMany()
  await prisma.lifeEvent.deleteMany()
  await prisma.reflection.deleteMany()
  await prisma.note.deleteMany()
  await prisma.aiSummary.deleteMany()
  await prisma.simulation.deleteMany()
  await prisma.financialSnapshot.deleteMany()
  await prisma.goalAllocation.deleteMany()
  await prisma.goalMilestone.deleteMany()
  await prisma.goal.deleteMany()
  await prisma.investmentContribution.deleteMany()
  await prisma.investment.deleteMany()
  await prisma.debtPayment.deleteMany()
  await prisma.liability.deleteMany()
  await prisma.asset.deleteMany()
  await prisma.expense.deleteMany()
  await prisma.expenseCategory.deleteMany()
  await prisma.incomeSource.deleteMany()
  await prisma.financialAssumptions.deleteMany()
  await prisma.visaInfo.deleteMany()
  await prisma.userProfile.deleteMany()

  // ─── User Profile ────────────────────────────────────────────────────────
  const user = await prisma.userProfile.create({
    data: {
      name: 'Alex Sharma',
      age: 29,
      state: 'California',
      city: 'San Jose',
      currency: 'USD',
      taxFilingStatus: 'single',
      dependents: 0,
      visaStatus: 'h1b',
      homeCountry: 'India',
      riskAppetite: 'moderate',
      planningStyle: 'balanced',
      avatarColor: '#6366F1',
      onboardingComplete: true,
    },
  })

  // ─── Financial Assumptions ───────────────────────────────────────────────
  await prisma.financialAssumptions.create({
    data: {
      userId: user.id,
      inflationRate: 0.035,
      salaryGrowthRate: 0.08,
      investmentReturnRate: 0.08,
      conservativeReturnRate: 0.06,
      optimisticReturnRate: 0.10,
      stateTaxRate: 0.093,
      effectiveFederalRate: 0.24,
      filingStatus: 'single',
      emergencyFundMonths: 12,
      retirementAge: 58,
      lifeExpectancy: 85,
      includeSocialSecurity: false,
      estimatedSSBenefit: 0,
      safeWithdrawalRate: 0.04,
      usdToInrRate: 83.5,
    },
  })

  // ─── Visa Info ───────────────────────────────────────────────────────────
  await prisma.visaInfo.create({
    data: {
      userId: user.id,
      visaType: 'H1B',
      expiryDate: new Date('2026-10-01'),
      sponsorEmployer: 'TechCorp Inc.',
      gcPetitionStage: 'perm_in_progress',
      estimatedGcCost: 25000,
      gcCostSaved: 4500,
      homeCountry: 'India',
      notes: 'PERM filed Jan 2026. Expecting I-140 filing by Q3 2026.',
    },
  })

  // ─── Income Sources ──────────────────────────────────────────────────────
  await prisma.incomeSource.createMany({
    data: [
      {
        name: 'TechCorp Salary',
        type: 'salary',
        amount: 165000,
        frequency: 'annual',
        taxable: true,
        growthRate: 0.08,
        scenario: 'base',
        isActive: true,
      },
      {
        name: 'Annual Performance Bonus',
        type: 'bonus',
        amount: 12000,
        frequency: 'annual',
        taxable: true,
        growthRate: 0.05,
        scenario: 'base',
        isActive: true,
      },
      {
        name: 'RSU Vesting — Q2 2026',
        type: 'rsu',
        amount: 15000,
        frequency: 'one_time',
        taxable: true,
        growthRate: 0,
        scenario: 'base',
        isActive: true,
        rsuVestingDate: new Date('2026-06-15'),
        rsuShareCount: 100,
        rsuFMVAtVest: 150,
      },
      {
        name: 'NRE Interest Income',
        type: 'interest',
        amount: 1800,
        frequency: 'annual',
        taxable: true,
        growthRate: 0,
        scenario: 'base',
        isActive: true,
      },
    ],
  })

  // ─── Expense Categories ──────────────────────────────────────────────────
  const categories = await prisma.$transaction([
    prisma.expenseCategory.create({ data: { name: 'Housing', icon: '🏠', color: '#6366F1', isFixed: true, sortOrder: 1 } }),
    prisma.expenseCategory.create({ data: { name: 'Transport', icon: '🚗', color: '#8B5CF6', isFixed: true, sortOrder: 2 } }),
    prisma.expenseCategory.create({ data: { name: 'Groceries', icon: '🛒', color: '#10B981', isFixed: false, sortOrder: 3 } }),
    prisma.expenseCategory.create({ data: { name: 'Dining Out', icon: '🍽️', color: '#F59E0B', isFixed: false, sortOrder: 4 } }),
    prisma.expenseCategory.create({ data: { name: 'Utilities', icon: '💡', color: '#06B6D4', isFixed: true, sortOrder: 5 } }),
    prisma.expenseCategory.create({ data: { name: 'Subscriptions', icon: '📱', color: '#EF4444', isFixed: true, sortOrder: 6 } }),
    prisma.expenseCategory.create({ data: { name: 'Health & Insurance', icon: '❤️', color: '#EC4899', isFixed: true, sortOrder: 7 } }),
    prisma.expenseCategory.create({ data: { name: 'Family Remittance', icon: '💸', color: '#84CC16', isFixed: false, isH1b: true, sortOrder: 8 } }),
    prisma.expenseCategory.create({ data: { name: 'Visa & Legal', icon: '📋', color: '#3B82F6', isFixed: false, isH1b: true, sortOrder: 9 } }),
    prisma.expenseCategory.create({ data: { name: 'Shopping', icon: '🛍️', color: '#A855F7', isFixed: false, sortOrder: 10 } }),
    prisma.expenseCategory.create({ data: { name: 'Travel', icon: '✈️', color: '#F97316', isFixed: false, sortOrder: 11 } }),
    prisma.expenseCategory.create({ data: { name: 'Entertainment', icon: '🎬', color: '#14B8A6', isFixed: false, sortOrder: 12 } }),
    prisma.expenseCategory.create({ data: { name: 'Personal Care', icon: '💆', color: '#FBBF24', isFixed: false, sortOrder: 13 } }),
    prisma.expenseCategory.create({ data: { name: 'Misc / Other', icon: '📦', color: '#94A3B8', isFixed: false, sortOrder: 14 } }),
  ])

  const [housing, transport, groceries, dining, utilities, subscriptions, health, remittance, visaLegal, shopping, travel, entertainment, personalCare, misc] = categories

  // ─── Expenses ────────────────────────────────────────────────────────────
  await prisma.expense.createMany({
    data: [
      // Housing
      { name: 'Rent (2BR)', categoryId: housing.id, amount: 2800, frequency: 'monthly', isFixed: true, isEssential: true },
      // Transport
      { name: 'Car Loan EMI', categoryId: transport.id, amount: 420, frequency: 'monthly', isFixed: true, isEssential: true },
      { name: 'Gas', categoryId: transport.id, amount: 150, frequency: 'monthly', isFixed: false, isEssential: true },
      { name: 'Car Insurance', categoryId: transport.id, amount: 1680, frequency: 'annual', isFixed: true, isEssential: true },
      // Groceries
      { name: 'Groceries & Household', categoryId: groceries.id, amount: 600, frequency: 'monthly', isFixed: false, isEssential: true },
      // Dining
      { name: 'Restaurants & Takeout', categoryId: dining.id, amount: 350, frequency: 'monthly', isFixed: false, isEssential: false },
      // Utilities
      { name: 'Electricity', categoryId: utilities.id, amount: 110, frequency: 'monthly', isFixed: false, isEssential: true },
      { name: 'Internet', categoryId: utilities.id, amount: 65, frequency: 'monthly', isFixed: true, isEssential: true },
      { name: 'Phone Bill', categoryId: utilities.id, amount: 55, frequency: 'monthly', isFixed: true, isEssential: true },
      // Subscriptions
      { name: 'Netflix', categoryId: subscriptions.id, amount: 22, frequency: 'monthly', isFixed: true, isEssential: false },
      { name: 'Spotify', categoryId: subscriptions.id, amount: 11, frequency: 'monthly', isFixed: true, isEssential: false },
      { name: 'YouTube Premium', categoryId: subscriptions.id, amount: 14, frequency: 'monthly', isFixed: true, isEssential: false },
      { name: 'iCloud Storage', categoryId: subscriptions.id, amount: 3, frequency: 'monthly', isFixed: true, isEssential: false },
      { name: 'ChatGPT Plus', categoryId: subscriptions.id, amount: 20, frequency: 'monthly', isFixed: true, isEssential: false },
      { name: 'GitHub Copilot', categoryId: subscriptions.id, amount: 10, frequency: 'monthly', isFixed: true, isEssential: false },
      { name: 'Adobe Creative Cloud', categoryId: subscriptions.id, amount: 600, frequency: 'annual', isFixed: true, isEssential: false },
      // Health
      { name: 'Health Insurance Premium', categoryId: health.id, amount: 220, frequency: 'monthly', isFixed: true, isEssential: true },
      { name: 'Dental Insurance', categoryId: health.id, amount: 40, frequency: 'monthly', isFixed: true, isEssential: true },
      { name: 'Life Insurance (Term)', categoryId: health.id, amount: 480, frequency: 'annual', isFixed: true, isEssential: true },
      { name: 'Gym Membership', categoryId: health.id, amount: 55, frequency: 'monthly', isFixed: true, isEssential: false },
      // H1B Specific
      { name: 'India Family Remittance', categoryId: remittance.id, amount: 800, frequency: 'monthly', isFixed: false, isEssential: true },
      { name: 'H1B Attorney Retainer', categoryId: visaLegal.id, amount: 2500, frequency: 'annual', isFixed: false, isEssential: true },
      { name: 'India Trip (Annual)', categoryId: travel.id, amount: 3000, frequency: 'annual', isFixed: false, isEssential: false },
      // Misc
      { name: 'Shopping / Clothes', categoryId: shopping.id, amount: 200, frequency: 'monthly', isFixed: false, isEssential: false },
      { name: 'Entertainment', categoryId: entertainment.id, amount: 120, frequency: 'monthly', isFixed: false, isEssential: false },
      { name: 'Personal Care', categoryId: personalCare.id, amount: 80, frequency: 'monthly', isFixed: false, isEssential: false },
      { name: 'Miscellaneous', categoryId: misc.id, amount: 150, frequency: 'monthly', isFixed: false, isEssential: false },
    ],
  })

  // ─── Assets ──────────────────────────────────────────────────────────────
  await prisma.asset.createMany({
    data: [
      { name: 'Chase Checking', type: 'checking', balance: 8500, currency: 'USD', institution: 'Chase', isForeignAccount: false },
      { name: 'Marcus Savings (HYSA)', type: 'savings', balance: 28000, currency: 'USD', institution: 'Marcus by Goldman Sachs', isForeignAccount: false, aprInterest: 0.048 },
      { name: 'TechCorp 401(k)', type: '401k', balance: 62000, currency: 'USD', institution: 'Fidelity', isForeignAccount: false, contributionYTD: 7800, irsAnnualLimit: 23500 },
      { name: 'Roth IRA', type: 'roth_ira', balance: 18500, currency: 'USD', institution: 'Charles Schwab', isForeignAccount: false, contributionYTD: 3500, irsAnnualLimit: 7000 },
      { name: 'Taxable Brokerage (FZROX)', type: 'brokerage', balance: 22000, currency: 'USD', institution: 'Fidelity', isForeignAccount: false },
      { name: 'HDFC NRE Savings', type: 'nre_account', balance: 6800, currency: 'USD', institution: 'HDFC Bank', isForeignAccount: true, aprInterest: 0.09, notes: 'Balance in USD equivalent. Approx ₹5,67,800' },
      { name: 'SBI NRO Account', type: 'nro_account', balance: 1200, currency: 'USD', institution: 'State Bank of India', isForeignAccount: true, notes: 'Approx ₹1,00,200. Used for India expenses.' },
      { name: 'Honda Civic (2022)', type: 'vehicle', balance: 18000, currency: 'USD', institution: 'N/A', isForeignAccount: false },
    ],
  })

  // ─── Liabilities ─────────────────────────────────────────────────────────
  const [studentLoan, carLoan] = await prisma.$transaction([
    prisma.liability.create({
      data: {
        name: 'Federal Student Loan',
        type: 'student_loan',
        principalBalance: 14800,
        originalBalance: 28000,
        interestRate: 0.065,
        minimumPayment: 310,
        extraPayment: 0,
        startDate: new Date('2019-09-01'),
        lender: 'Navient',
        isActive: true,
      },
    }),
    prisma.liability.create({
      data: {
        name: 'Honda Auto Loan',
        type: 'auto_loan',
        principalBalance: 9200,
        originalBalance: 18000,
        interestRate: 0.042,
        minimumPayment: 420,
        extraPayment: 0,
        startDate: new Date('2022-03-15'),
        lender: 'Honda Financial Services',
        isActive: true,
      },
    }),
  ])

  // ─── Investments ─────────────────────────────────────────────────────────
  const [inv401k, invRoth, invBrokerage, invNre] = await prisma.$transaction([
    prisma.investment.create({
      data: {
        name: '401k — Fidelity 500 Index',
        type: 'index_fund',
        accountType: 'traditional_401k',
        currentValue: 62000,
        costBasis: 48000,
        ticker: 'FXAIX',
        allocation: 50,
        currency: 'USD',
        institution: 'Fidelity',
        isForeignAccount: false,
      },
    }),
    prisma.investment.create({
      data: {
        name: 'Roth IRA — FZROX',
        type: 'index_fund',
        accountType: 'roth_ira',
        currentValue: 18500,
        costBasis: 14000,
        ticker: 'FZROX',
        allocation: 15,
        currency: 'USD',
        institution: 'Charles Schwab',
        isForeignAccount: false,
      },
    }),
    prisma.investment.create({
      data: {
        name: 'Taxable — FZROX',
        type: 'index_fund',
        accountType: 'taxable',
        currentValue: 22000,
        costBasis: 19000,
        ticker: 'FZROX',
        allocation: 18,
        currency: 'USD',
        institution: 'Fidelity',
        isForeignAccount: false,
      },
    }),
    prisma.investment.create({
      data: {
        name: 'NRE FD — HDFC',
        type: 'nre_fd',
        accountType: 'nre',
        currentValue: 6800,
        costBasis: 6500,
        allocation: 5,
        currency: 'USD',
        institution: 'HDFC Bank',
        isForeignAccount: true,
        notes: 'Fixed deposit at 9% p.a.',
      },
    }),
  ])

  // ─── Goals ───────────────────────────────────────────────────────────────
  const [efGoal, gcGoal, homeDpGoal, retirementGoal, indiaTrip, debtFreeGoal] = await prisma.$transaction([
    prisma.goal.create({
      data: {
        name: 'Emergency Fund (12 months)',
        type: 'emergency_fund',
        targetAmount: 72000, // ~12 × $6,000 monthly expenses
        currentAmount: 28000,
        priority: 10,
        monthlyContrib: 1500,
        whyItMatters: 'On H1B, a job loss means 60 days to find new employment or leave the US. I need this buffer to feel secure.',
        status: 'active',
        color: '#10B981',
        icon: '🛡️',
      },
    }),
    prisma.goal.create({
      data: {
        name: 'Green Card Fund',
        type: 'green_card',
        targetAmount: 25000,
        currentAmount: 4500,
        targetDate: new Date('2027-12-31'),
        priority: 9,
        monthlyContrib: 350,
        whyItMatters: 'The green card removes the biggest risk in my financial life — visa dependency. Getting to I-485 stage changes everything.',
        status: 'active',
        color: '#3B82F6',
        icon: '🇺🇸',
      },
    }),
    prisma.goal.create({
      data: {
        name: 'Home Down Payment',
        type: 'home_down_payment',
        targetAmount: 180000, // 20% of $900k home in Bay Area
        currentAmount: 8000,
        targetDate: new Date('2029-06-01'),
        priority: 7,
        monthlyContrib: 1200,
        whyItMatters: 'Want to stop renting and build equity. A $900k home at 20% down = $180k. Need to also plan for green card situation first.',
        status: 'active',
        color: '#8B5CF6',
        icon: '🏠',
      },
    }),
    prisma.goal.create({
      data: {
        name: 'Retirement at 58',
        type: 'retirement',
        targetAmount: 3500000,
        currentAmount: 102500,
        targetDate: new Date('2055-01-01'),
        priority: 8,
        monthlyContrib: 2300,
        whyItMatters: 'Want to retire at 58 comfortably. No SS credit assumption (India, no totalization). Need $3.5M corpus.',
        status: 'active',
        color: '#6366F1',
        icon: '🎯',
      },
    }),
    prisma.goal.create({
      data: {
        name: 'India Trip (Annual)',
        type: 'travel',
        targetAmount: 3500,
        currentAmount: 800,
        targetDate: new Date('2026-12-01'),
        priority: 5,
        monthlyContrib: 250,
        whyItMatters: 'Annual trip home to see parents. Includes business class upgrade because long haul.',
        status: 'active',
        color: '#F97316',
        icon: '✈️',
      },
    }),
    prisma.goal.create({
      data: {
        name: 'Debt Free',
        type: 'debt_payoff',
        targetAmount: 24000,
        currentAmount: 0,
        targetDate: new Date('2028-01-01'),
        priority: 8,
        monthlyContrib: 800,
        whyItMatters: 'Clear student loan and car loan by 2028. Will free up $730/mo for investments.',
        status: 'active',
        color: '#EF4444',
        icon: '⛓️',
      },
    }),
  ])

  // ─── Goal Milestones ─────────────────────────────────────────────────────
  await prisma.goalMilestone.createMany({
    data: [
      { goalId: efGoal.id, name: '3-Month Buffer', amount: 18000, isCompleted: false },
      { goalId: efGoal.id, name: '6-Month Buffer', amount: 36000, isCompleted: false },
      { goalId: efGoal.id, name: 'Full 12-Month Buffer', amount: 72000, isCompleted: false },
      { goalId: gcGoal.id, name: 'PERM Complete + Attorney Fee', amount: 8000, isCompleted: false },
      { goalId: gcGoal.id, name: 'I-140 Filed', amount: 12000, isCompleted: false },
      { goalId: gcGoal.id, name: 'I-485 Buffer + Fees', amount: 25000, isCompleted: false },
      { goalId: homeDpGoal.id, name: 'First $50k Saved', amount: 50000, isCompleted: false },
      { goalId: homeDpGoal.id, name: 'First $100k Saved', amount: 100000, isCompleted: false },
      { goalId: retirementGoal.id, name: 'First $250k Invested', amount: 250000, isCompleted: false },
      { goalId: retirementGoal.id, name: '$500k Milestone', amount: 500000, isCompleted: false },
      { goalId: retirementGoal.id, name: '$1M Club', amount: 1000000, isCompleted: false },
    ],
  })

  // ─── Financial Snapshot (current month) ──────────────────────────────────
  await prisma.financialSnapshot.create({
    data: {
      month: '2026-04',
      totalIncomeGross: 14750,  // (165000 + 12000) / 12 + NRE interest
      totalIncomeNet: 9680,
      totalExpenses: 6820,
      freeCashFlow: 2860,
      totalAssets: 165000,
      totalLiabilities: 24000,
      netWorth: 141000,
      savingsRate: 29.5,
      investmentRate: 23.8,
      debtBurdenRatio: 7.6,
      fixedExpenseRatio: 47.2,
      liquidAssets: 36500,
      emergencyFundMonths: 5.35,
      emergencyFundTarget: 72000,
      healthScore: 68,
      futureReadinessScore: 62,
      disciplineScore: 74,
      avgGoalConfidence: 57,
      goalsOnTrack: 3,
      goalsOffTrack: 3,
      fbarThresholdStatus: 'safe',
      foreignAccountsTotal: 8000,
      totalRemittanceUSD: 800,
    },
  })

  // ─── Remittance Log ───────────────────────────────────────────────────────
  await prisma.remittanceLog.createMany({
    data: [
      { amount: 800, currency: 'USD', toCountry: 'India', method: 'Wise', exchangeRate: 83.5, notes: 'Monthly family support' },
      { amount: 800, currency: 'USD', toCountry: 'India', method: 'Wise', exchangeRate: 83.25 },
      { amount: 800, currency: 'USD', toCountry: 'India', method: 'Wise', exchangeRate: 82.9 },
      { amount: 1200, currency: 'USD', toCountry: 'India', method: 'Wise', exchangeRate: 82.9, notes: 'Extra for festival season' },
    ],
  })

  // ─── Notes ───────────────────────────────────────────────────────────────
  await prisma.note.createMany({
    data: [
      {
        title: 'Why $12 months emergency fund matters on H1B',
        body: 'Standard advice is 3-6 months but that assumes you can look for jobs freely. On H1B, job loss = 60 days to either find a new H1B sponsor or leave the country. The 60-day clock starts immediately. Having 12 months of runway gives me:\n\n1. 60 days to job hunt aggressively\n2. Money to handle COBRA ($1,200-$1,800/mo for health)\n3. Potential repatriation costs ($3k-$5k flights + moving)\n4. Mental peace that I am not desperate during offer negotiation\n\nThis is my highest priority.',
        tags: 'h1b,emergency,planning',
        isPinned: true,
      },
      {
        title: 'The real cost of my green card process',
        body: 'Estimated total cost breakdown:\n\nPERM (Labor Certification): $3,500 attorney\nI-140 Filing: $715 government + $1,000 attorney\nI-485: $1,440 govt + $8,000 attorney\nEAD/AP: $985 govt\nPremium processing (I-140): $2,500\n\nTotal: ~$18,140 out of pocket.\n\nConservative estimate with employer reimbursement = $12,000 personally.',
        tags: 'green_card,visa,planning',
        isPinned: true,
      },
    ],
  })

  // ─── Life Events ──────────────────────────────────────────────────────────
  await prisma.lifeEvent.createMany({
    data: [
      { name: 'Started at TechCorp (H1B Transfer)', type: 'job_change', eventDate: new Date('2023-08-01'), notes: 'Moved from previous employer. New H1B petition filed.' },
      { name: 'Got Promotion to Senior SWE', type: 'promotion', eventDate: new Date('2024-04-01'), amount: 20000, notes: 'Salary went from $145k to $165k. Huge boost.' },
      { name: 'PERM Filed', type: 'visa_milestone', eventDate: new Date('2026-01-15'), notes: 'Green card PERM labor certification filed by employer.' },
      { name: 'Opened Roth IRA', type: 'investment', eventDate: new Date('2024-01-15'), amount: 6500, notes: 'First contribution to Roth IRA for 2023 tax year.' },
    ],
  })

  // ─── Reflections ─────────────────────────────────────────────────────────
  await prisma.reflection.create({
    data: {
      title: 'March 2026 Review',
      body: 'Hit $140k net worth for the first time.\n\n✅ Wins:\n- Kept remittance consistent\n- Maxed out Roth IRA contribution for year\n\n⚠️ Challenges:\n- Overspent on eating out ($450 vs $350 budget)\n- Didn\'t do monthly review until the 20th\n\n🎯 Next month focus:\nReview visa renewal timeline — H1B expires Oct 2026. Start attorney conversation. Hit $30k emergency fund.',
      mood: '🙂 Good',
      period: '2026-03',
    },
  })

  // ─── Reminders ───────────────────────────────────────────────────────────
  await prisma.reminder.createMany({
    data: [
      {
        title: 'FBAR Filing Due (FinCEN 114)',
        body: 'Foreign Bank Account Report due June 15. Check all India account balances for 2025. Threshold: $10,000 aggregate at any point during year.',
        type: 'fbar',
        dueDate: new Date('2026-06-15'),
        isCompleted: false,
        priority: 'critical',
        isRecurring: true,
        recurringRule: 'annual',
      },
      {
        title: 'H1B Renewal Process — Start Now',
        body: 'H1B expires October 1, 2026. Should start renewal process by April to have at least 180 days lead time. Contact immigration attorney.',
        type: 'h1b_renewal',
        dueDate: new Date('2026-04-15'),
        isCompleted: false,
        priority: 'critical',
      },
      {
        title: 'Max Out Roth IRA Contribution',
        body: 'Still $3,500 remaining in Roth IRA limit for 2026 ($7,000 total). Check income phaseout at $150k-$165k for single filers.',
        type: 'irs_deadline',
        dueDate: new Date('2027-04-15'),
        isCompleted: false,
        priority: 'high',
        isRecurring: true,
        recurringRule: 'annual',
      },
      {
        title: 'Monthly Financial Review',
        body: 'Review income, expenses, goal progress, and update snapshot.',
        type: 'monthly_review',
        dueDate: new Date('2026-05-01'),
        isCompleted: false,
        priority: 'medium',
        isRecurring: true,
        recurringRule: 'monthly',
      },
      {
        title: 'File Federal Tax Return',
        body: 'Federal and CA state tax return due April 15, 2027. Consider FBAR, foreign income reporting.',
        type: 'irs_deadline',
        dueDate: new Date('2027-04-15'),
        isCompleted: false,
        priority: 'high',
        isRecurring: true,
        recurringRule: 'annual',
      },
    ],
  })

  // ─── Documents Vault ──────────────────────────────────────────────────────
  await prisma.document.createMany({
    data: [
      { name: 'W-2 2025 — TechCorp', type: 'tax_return', notes: 'Annual W-2 from employer', isPinned: true, tags: 'tax,2025,w2' },
      { name: 'Federal Tax Return 2025', type: 'tax_return', notes: '1040 Filed April 2026', isPinned: true, tags: 'tax,2025,irs' },
      { name: 'H1B I-797 Approval — Current', type: 'visa', notes: 'I-797 Notice of Action, H1B valid through Oct 2026', isPinned: true, expiryDate: new Date('2026-10-01'), tags: 'visa,h1b,immigration' },
      { name: 'Indian Passport', type: 'passport', notes: 'Expires 2034', isPinned: true, expiryDate: new Date('2034-08-15'), tags: 'identity,passport' },
      { name: 'TechCorp Offer Letter', type: 'employment', notes: 'Current employment offer letter', isPinned: true, tags: 'employment,offer' },
      { name: 'Navient Student Loan Statement', type: 'bank_statement', notes: 'Latest statement', tags: 'loan,student' },
    ],
  })

  console.log('✅ Seed complete.')
  console.log(`   User: ${user.name} (ID: ${user.id})`)
  console.log(`   Net Worth: $141,000`)
  console.log(`   Health Score: 68/100`)
  console.log(`   Active Goals: 6`)
  console.log('   Open http://localhost:3004 to view your Finance OS.')
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
