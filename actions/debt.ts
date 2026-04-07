'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const LiabilitySchema = z.object({
  name: z.string().min(1),
  type: z.enum(['student_loan', 'auto_loan', 'credit_card', 'mortgage', 'personal_loan', 'h1b_legal_fee', 'other']),
  principalBalance: z.coerce.number().min(0),
  originalBalance: z.coerce.number().min(0),
  interestRate: z.coerce.number().min(0).max(1),
  minimumPayment: z.coerce.number().min(0),
  extraPayment: z.coerce.number().min(0).default(0),
  lender: z.string().optional(),
  notes: z.string().optional(),
  startDate: z.string().optional(),
  payoffDate: z.string().optional(),
})

export async function createLiability(data: z.infer<typeof LiabilitySchema>) {
  const parsed = LiabilitySchema.parse(data)
  const liability = await prisma.liability.create({
    data: {
      ...parsed,
      startDate: parsed.startDate ? new Date(parsed.startDate) : undefined,
      payoffDate: parsed.payoffDate ? new Date(parsed.payoffDate) : undefined,
    },
  })
  revalidatePath('/debt')
  revalidatePath('/dashboard')
  return liability
}

export async function updateLiability(id: string, data: Partial<z.infer<typeof LiabilitySchema>>) {
  const liability = await prisma.liability.update({
    where: { id },
    data: {
      ...data,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      payoffDate: data.payoffDate ? new Date(data.payoffDate) : undefined,
    },
  })
  revalidatePath('/debt')
  revalidatePath('/dashboard')
  return liability
}

export async function deleteLiability(id: string) {
  await prisma.liability.update({ where: { id }, data: { isActive: false } })
  revalidatePath('/debt')
  revalidatePath('/dashboard')
}

export async function recordDebtPayment(data: {
  liabilityId: string
  amount: number
  principal: number
  interest: number
  notes?: string
}) {
  const [payment, _] = await Promise.all([
    prisma.debtPayment.create({ data }),
    prisma.liability.update({
      where: { id: data.liabilityId },
      data: { principalBalance: { decrement: data.principal } },
    }),
  ])
  revalidatePath('/debt')
  revalidatePath('/dashboard')
  return payment
}
