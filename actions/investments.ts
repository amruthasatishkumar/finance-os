'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const AssetSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  balance: z.coerce.number().min(0),
  currency: z.string().default('USD'),
  institution: z.string().optional(),
  accountLast4: z.string().optional(),
  isForeignAccount: z.boolean().default(false),
  aprInterest: z.coerce.number().optional(),
  notes: z.string().optional(),
  contributionYTD: z.coerce.number().min(0).default(0),
  irsAnnualLimit: z.coerce.number().optional(),
})

const InvestmentSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  accountType: z.string().min(1),
  currentValue: z.coerce.number().min(0),
  costBasis: z.coerce.number().min(0).default(0),
  ticker: z.string().optional(),
  currency: z.string().default('USD'),
  institution: z.string().optional(),
  isForeignAccount: z.boolean().default(false),
  notes: z.string().optional(),
})

export async function createAsset(data: z.infer<typeof AssetSchema>) {
  const parsed = AssetSchema.parse(data)
  const asset = await prisma.asset.create({ data: parsed })
  revalidatePath('/investments')
  revalidatePath('/dashboard')
  return asset
}

export async function updateAsset(id: string, data: Partial<z.infer<typeof AssetSchema>>) {
  const asset = await prisma.asset.update({ where: { id }, data })
  revalidatePath('/investments')
  revalidatePath('/dashboard')
  return asset
}

export async function deleteAsset(id: string) {
  await prisma.asset.update({ where: { id }, data: { isActive: false } })
  revalidatePath('/investments')
  revalidatePath('/dashboard')
}

export async function createInvestment(data: z.infer<typeof InvestmentSchema>) {
  const parsed = InvestmentSchema.parse(data)
  const investment = await prisma.investment.create({ data: parsed })
  revalidatePath('/investments')
  revalidatePath('/dashboard')
  return investment
}

export async function updateInvestment(id: string, data: Partial<z.infer<typeof InvestmentSchema>>) {
  const investment = await prisma.investment.update({ where: { id }, data })
  revalidatePath('/investments')
  revalidatePath('/dashboard')
  return investment
}

export async function deleteInvestment(id: string) {
  await prisma.investment.update({ where: { id }, data: { isActive: false } })
  revalidatePath('/investments')
  revalidatePath('/dashboard')
}

export async function recordContribution(data: {
  investmentId: string
  amount: number
  type: string
  notes?: string
}) {
  const [contribution] = await Promise.all([
    prisma.investmentContribution.create({ data }),
    prisma.investment.update({
      where: { id: data.investmentId },
      data: { currentValue: { increment: data.type === 'withdrawal' ? -data.amount : data.amount } },
    }),
  ])
  revalidatePath('/investments')
  revalidatePath('/dashboard')
  return contribution
}
