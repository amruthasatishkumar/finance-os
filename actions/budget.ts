'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function getBudgets() {
  return prisma.budget.findMany({ orderBy: { createdAt: 'asc' } })
}

export async function setBudget(categoryId: string, monthlyLimit: number) {
  const budget = await prisma.budget.upsert({
    where: { categoryId },
    create: { categoryId, monthlyLimit },
    update: { monthlyLimit },
  })
  revalidatePath('/expenses')
  revalidatePath('/dashboard')
  return budget
}

export async function deleteBudget(categoryId: string) {
  await prisma.budget.deleteMany({ where: { categoryId } })
  revalidatePath('/expenses')
  revalidatePath('/dashboard')
}
