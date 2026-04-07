// ─────────────────────────────────────────
// 2025 US TAX CONSTANTS
// ─────────────────────────────────────────

export const FEDERAL_TAX_BRACKETS_2025_SINGLE = [
  { min: 0, max: 11925, rate: 0.10 },
  { min: 11925, max: 48475, rate: 0.12 },
  { min: 48475, max: 103350, rate: 0.22 },
  { min: 103350, max: 197300, rate: 0.24 },
  { min: 197300, max: 250525, rate: 0.32 },
  { min: 250525, max: 626350, rate: 0.35 },
  { min: 626350, max: Infinity, rate: 0.37 },
]

export const FEDERAL_TAX_BRACKETS_2025_MFJ = [
  { min: 0, max: 23850, rate: 0.10 },
  { min: 23850, max: 96950, rate: 0.12 },
  { min: 96950, max: 206700, rate: 0.22 },
  { min: 206700, max: 394600, rate: 0.24 },
  { min: 394600, max: 501050, rate: 0.32 },
  { min: 501050, max: 751600, rate: 0.35 },
  { min: 751600, max: Infinity, rate: 0.37 },
]

export const STANDARD_DEDUCTION_2025 = {
  single: 15000,
  married_jointly: 30000,
  married_separately: 15000,
  head_of_household: 22500,
}

export const FICA_2025 = {
  socialSecurityRate: 0.062,       // 6.2% employee
  socialSecurityCap: 176100,       // 2025 wage base
  medicareRate: 0.0145,            // 1.45%
  additionalMedicareRate: 0.009,   // 0.9% on wages > $200k single
  additionalMedicareThreshold: 200000,
}

export const IRS_CONTRIBUTION_LIMITS_2025 = {
  k401Traditional: 23500,
  k401CatchUp: 31000,       // 50+ years old
  rothIra: 7000,
  rothIraCatchUp: 8000,     // 50+ years old
  rothIraPhaseoutSingle: { start: 150000, end: 165000 },
  rothIraPhaseoutMFJ: { start: 236000, end: 246000 },
  hsaIndividual: 4300,
  hsaFamily: 8550,
  hsaCatchUp: 1000,          // 55+ years old
  fsa: 3300,
  dependentCareFsa: 5000,
}

// ─────────────────────────────────────────
// H1B / VISA CONSTANTS
// ─────────────────────────────────────────

export const H1B_CONSTANTS = {
  gracePeriodDays: 60,
  renewalLeadTimeDays: 180,  // Start renewal process 6 months before expiry
  renewalEstimatedCost: 4500, // $2k-$7k range, mid estimate
  premiumProcessingFee: 2500,
  greenCardEstimatedCost: 25000, // $15k-$40k range, mid estimate

  // FBAR thresholds
  fbarThreshold: 10000,
  fbarFilingDeadline: 'June 15', // Extended to October 15 with extension
  fbarWarningThreshold: 8000, // Show warning at 80% of threshold

  // FATCA thresholds (single)
  fatcaThresholdSingleYearEnd: 600000,
  fatcaThresholdSinglePeak: 1200000,
  // FATCA thresholds (MFJ)
  fatcaThresholdMFJYearEnd: 1200000,
  fatcaThresholdMFJPeak: 2400000,

  // Emergency fund multiplier for visa holders
  emergencyFundMultiplier: 12, // months (vs 6 for citizens)

  // Social Security
  socialSecurityNote: 'India does not have a Social Security totalization agreement with the US. H1B holders may not receive benefits if they return to India before accumulating 40 quarters (10 years).',
  socialSecurityQuartersRequired: 40,
}

export const GC_STAGES = [
  { key: 'none', label: 'Not Started', description: 'Green card process not yet initiated' },
  { key: 'perm_in_progress', label: 'PERM in Progress', description: 'Labor certification being processed (~12-18 months)' },
  { key: 'i140_filed', label: 'I-140 Filed', description: 'Immigrant petition filed with USCIS' },
  { key: 'i140_approved', label: 'I-140 Approved', description: 'Petition approved, waiting for priority date' },
  { key: 'waiting_priority', label: 'Waiting for Priority Date', description: 'Priority date in queue (EB-2 India: 15-20+ years)' },
  { key: 'i485_filed', label: 'I-485 Filed', description: 'Adjustment of status filed, EAD/AP available' },
  { key: 'approved', label: 'Green Card Approved', description: 'Permanent resident status granted' },
]

// ─────────────────────────────────────────
// FINANCIAL HEALTH SCORING
// ─────────────────────────────────────────

export const HEALTH_SCORE_WEIGHTS = {
  savings: 25,        // savings rate >= 20% = full score
  debt: 20,           // DTI < 36% = full score
  emergency: 20,      // 12 months coverage = full score (H1B)
  goals: 20,          // avg goal confidence
  investment: 15,     // investment rate >= 15% = full score
}

export const HEALTH_SCORE_TARGETS = {
  savingsRateTarget: 0.20,       // 20%
  debtBurdenTarget: 0.36,        // 36% max DTI
  investmentRateTarget: 0.15,    // 15%
}

// ─────────────────────────────────────────
// APP CONSTANTS
// ─────────────────────────────────────────

export const GOAL_TYPES = [
  { key: 'emergency_fund', label: 'Emergency Fund', icon: '🛡️', color: '#10B981', description: '12-month runway (H1B-adjusted)' },
  { key: 'h1b_renewal', label: 'H1B Renewal Fund', icon: '📋', color: '#6366F1', description: 'Cover attorney fees and filing costs' },
  { key: 'green_card', label: 'Green Card Fund', icon: '🇺🇸', color: '#3B82F6', description: 'PERM + I-140 + I-485 costs & attorney' },
  { key: 'debt_payoff', label: 'Debt Payoff', icon: '⛓️', color: '#EF4444', description: 'Eliminate debt faster' },
  { key: 'home_down_payment', label: 'Home Down Payment', icon: '🏠', color: '#8B5CF6', description: '20% down + closing costs' },
  { key: 'vehicle', label: 'Vehicle Purchase', icon: '🚗', color: '#06B6D4', description: 'Car purchase or upgrade' },
  { key: 'wedding', label: 'Wedding', icon: '💍', color: '#EC4899', description: 'Wedding planning fund' },
  { key: 'travel', label: 'Travel Fund', icon: '✈️', color: '#F59E0B', description: 'Vacations and India trips' },
  { key: 'family_support', label: 'Family Support', icon: '👨‍👩‍👧', color: '#84CC16', description: 'Monthly or lump-sum support for family' },
  { key: 'education', label: 'Education', icon: '🎓', color: '#A855F7', description: 'Courses, certifications, degrees' },
  { key: 'career_transition', label: 'Career Transition Fund', icon: '🔄', color: '#14B8A6', description: 'Runway to switch roles or industries' },
  { key: 'sabbatical', label: 'Sabbatical Fund', icon: '🌴', color: '#F97316', description: 'Extended break from work' },
  { key: 'child_planning', label: 'Child Planning', icon: '👶', color: '#FDE68A', description: 'Childbirth and early years fund' },
  { key: 'retirement', label: 'Retirement Corpus', icon: '🎯', color: '#6366F1', description: '25x annual expenses (4% SWR rule)' },
  { key: 'fire', label: 'FIRE Goal', icon: '🔥', color: '#EF4444', description: 'Financial independence corpus' },
  { key: 'custom', label: 'Custom Goal', icon: '⭐', color: '#94A3B8', description: 'Your own goal' },
]

export const INCOME_TYPES = [
  { key: 'salary', label: 'Salary' },
  { key: 'bonus', label: 'Annual Bonus' },
  { key: 'rsu', label: 'RSU / Stock Compensation' },
  { key: 'freelance', label: 'Freelance / Consulting' },
  { key: 'rental', label: 'Rental Income' },
  { key: 'interest', label: 'Interest / Dividends' },
  { key: 'other', label: 'Other Income' },
]

export const ASSET_TYPES = [
  { key: 'checking', label: 'Checking Account', isForeign: false },
  { key: 'savings', label: 'Savings Account (US)', isForeign: false },
  { key: '401k', label: '401(k)', isForeign: false, limit: 23500 },
  { key: 'roth_ira', label: 'Roth IRA', isForeign: false, limit: 7000 },
  { key: 'hsa', label: 'HSA (Health Savings)', isForeign: false, limit: 4300 },
  { key: 'brokerage', label: 'Taxable Brokerage', isForeign: false },
  { key: 'nre_account', label: 'NRE Account (India)', isForeign: true },
  { key: 'nro_account', label: 'NRO Account (India)', isForeign: true },
  { key: 'fcnr', label: 'FCNR Deposit (India)', isForeign: true },
  { key: 'crypto', label: 'Crypto', isForeign: false },
  { key: 'vehicle', label: 'Vehicle (estimated value)', isForeign: false },
  { key: 'real_estate', label: 'Real Estate (India/US)', isForeign: false },
  { key: 'other', label: 'Other Asset', isForeign: false },
]

export const DEBT_TYPES = [
  { key: 'student_loan', label: 'Student Loan' },
  { key: 'auto_loan', label: 'Auto Loan' },
  { key: 'credit_card', label: 'Credit Card' },
  { key: 'mortgage', label: 'Mortgage' },
  { key: 'personal_loan', label: 'Personal Loan' },
  { key: 'h1b_legal_fee', label: 'H1B / Legal Fees' },
  { key: 'other', label: 'Other Debt' },
]

export const US_STATES_TAX_RATES: Record<string, number> = {
  'California': 0.093,
  'New York': 0.0685,
  'New Jersey': 0.0637,
  'Massachusetts': 0.05,
  'Illinois': 0.0495,
  'Virginia': 0.0575,
  'Georgia': 0.055,
  'North Carolina': 0.0525,
  'Washington': 0,
  'Texas': 0,
  'Florida': 0,
  'Nevada': 0,
  'Wyoming': 0,
  'South Dakota': 0,
  'Tennessee': 0,
  'Other': 0.05,
}

export const SCENARIO_PRESETS = [
  { key: 'salary_increase_20', label: 'Salary +20%', icon: '📈', description: 'Get a 20% raise', category: 'income' },
  { key: 'salary_drop', label: 'Salary drops to $80k', icon: '📉', description: 'Income reduction', category: 'income' },
  { key: 'job_loss', label: 'Job Loss (H1B 60-day)', icon: '⚠️', description: '60-day grace period scenario', category: 'risk' },
  { key: 'relocate_tx', label: 'Relocate CA → TX', icon: '🚚', description: 'No state income tax savings', category: 'lifestyle' },
  { key: 'buy_home', label: 'Buy $700k Home', icon: '🏠', description: '20% down + mortgage', category: 'purchase' },
  { key: 'buy_car', label: 'Buy $40k Car', icon: '🚗', description: 'New car purchase', category: 'purchase' },
  { key: 'prepay_loan', label: 'Prepay Loans +$500/mo', icon: '⛓️', description: 'Aggressive debt payoff', category: 'debt' },
  { key: 'increase_remittance', label: '+$500/mo Remittance', icon: '💸', description: 'More family support', category: 'lifestyle' },
  { key: 'pause_401k', label: 'Pause 401k 1 Year', icon: '⏸️', description: 'Stop retirement contributions', category: 'investment' },
  { key: 'sabbatical', label: '6-Month Sabbatical', icon: '🌴', description: 'Career break, no income', category: 'income' },
  { key: 'have_child', label: 'Have a Child', icon: '👶', description: '+$1,500/mo, income drop year 1', category: 'lifestyle' },
  { key: 'market_crash', label: 'Market Crash -30%', icon: '📉', description: 'Portfolio drops 30%', category: 'risk' },
]
