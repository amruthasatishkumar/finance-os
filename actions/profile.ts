'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const ProfileSchema = z.object({
  name: z.string().min(1),
  age: z.coerce.number().min(18).max(100),
  state: z.string().min(1),
  city: z.string().optional(),
  taxFilingStatus: z.string().default('single'),
  dependents: z.coerce.number().min(0).default(0),
  visaStatus: z.string().default('h1b'),
  homeCountry: z.string().default('India'),
  riskAppetite: z.enum(['conservative', 'moderate', 'aggressive']).default('moderate'),
  planningStyle: z.enum(['aggressive_saver', 'balanced', 'lifestyle_optimizer']).default('balanced'),
  avatarColor: z.string().default('#6366F1'),
})

const AssumptionsSchema = z.object({
  inflationRate: z.coerce.number().min(0).max(0.2).default(0.035),
  salaryGrowthRate: z.coerce.number().min(0).max(0.5).default(0.05),
  investmentReturnRate: z.coerce.number().min(0).max(0.5).default(0.08),
  stateTaxRate: z.coerce.number().min(0).max(0.2).default(0.093),
  filingStatus: z.string().default('single'),
  emergencyFundMonths: z.coerce.number().min(1).max(36).default(12),
  retirementAge: z.coerce.number().min(45).max(80).default(60),
  lifeExpectancy: z.coerce.number().min(60).max(120).default(85),
  includeSocialSecurity: z.boolean().default(false),
  safeWithdrawalRate: z.coerce.number().min(0.02).max(0.08).default(0.04),
  usdToInrRate: z.coerce.number().min(50).max(200).default(83.5),
  preTaxDeductions: z.coerce.number().min(0).max(100000).default(0),
})

export async function updateProfile(data: z.infer<typeof ProfileSchema>) {
  const parsed = ProfileSchema.parse(data)
  const existing = await prisma.userProfile.findFirst()
  let updated
  if (existing) {
    updated = await prisma.userProfile.update({ where: { id: existing.id }, data: parsed })
  } else {
    updated = await prisma.userProfile.create({ data: parsed })
    // Also create linked FinancialAssumptions for the new profile
    await prisma.financialAssumptions.create({ data: { userId: updated.id } })
  }
  revalidatePath('/settings')
  revalidatePath('/dashboard')
  return updated
}

export async function updateAssumptions(data: z.infer<typeof AssumptionsSchema>) {
  const parsed = AssumptionsSchema.parse(data)
  const assumptions = await prisma.financialAssumptions.findFirst()
  if (!assumptions) {
    // If no profile exists yet, nothing to link to — silently skip
    return
  }
  const updated = await prisma.financialAssumptions.update({ where: { id: assumptions.id }, data: parsed })
  revalidatePath('/settings')
  revalidatePath('/dashboard')
  return updated
}

export async function updateEmergencyFundMonths(months: number) {
  const parsed = z.coerce.number().min(1).max(36).parse(months)
  const assumptions = await prisma.financialAssumptions.findFirst()
  if (!assumptions) return
  await prisma.financialAssumptions.update({ where: { id: assumptions.id }, data: { emergencyFundMonths: parsed } })
  revalidatePath('/dashboard')
  revalidatePath('/settings')
}

export async function completeOnboarding() {
  const profile = await prisma.userProfile.findFirst()
  if (!profile) return
  await prisma.userProfile.update({ where: { id: profile.id }, data: { onboardingComplete: true } })
  revalidatePath('/')
}

export async function resetOnboarding() {
  const profile = await prisma.userProfile.findFirst()
  if (!profile) return
  await prisma.userProfile.update({ where: { id: profile.id }, data: { onboardingComplete: false } })
  revalidatePath('/')
}
