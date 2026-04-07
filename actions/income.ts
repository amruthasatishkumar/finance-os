'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const IncomeSourceSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['salary', 'bonus', 'rsu', 'freelance', 'rental', 'interest', 'dividend', 'remittance_credit', 'other']),
  amount: z.coerce.number().min(0),
  frequency: z.enum(['monthly', 'annual', 'quarterly', 'biweekly', 'one_time']).default('monthly'),
  taxable: z.boolean().default(true),
  growthRate: z.coerce.number().min(0).default(0.05),
  notes: z.string().optional(),
  rsuVestingDate: z.string().optional(),
  rsuShareCount: z.coerce.number().optional(),
  rsuFMVAtVest: z.coerce.number().optional(),
})

export async function getIncomeSources() {
  return prisma.incomeSource.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'asc' },
  })
}

export async function createIncomeSource(data: z.infer<typeof IncomeSourceSchema>) {
  const parsed = IncomeSourceSchema.parse(data)
  const income = await prisma.incomeSource.create({
    data: {
      ...parsed,
      rsuVestingDate: parsed.rsuVestingDate ? new Date(parsed.rsuVestingDate) : undefined,
      scenario: 'base',
    },
  })
  revalidatePath('/income')
  revalidatePath('/dashboard')
  return income
}

export async function updateIncomeSource(id: string, data: Partial<z.infer<typeof IncomeSourceSchema>>) {
  const income = await prisma.incomeSource.update({
    where: { id },
    data: {
      ...data,
      rsuVestingDate: data.rsuVestingDate ? new Date(data.rsuVestingDate) : undefined,
    },
  })
  revalidatePath('/income')
  revalidatePath('/dashboard')
  return income
}

export async function deleteIncomeSource(id: string) {
  await prisma.incomeSource.update({ where: { id }, data: { isActive: false } })
  revalidatePath('/income')
  revalidatePath('/dashboard')
}
