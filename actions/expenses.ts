'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const ExpenseSchema = z.object({
  name: z.string().min(1),
  categoryId: z.string().min(1),
  amount: z.coerce.number().min(0),
  frequency: z.enum(['monthly', 'annual', 'quarterly', 'weekly', 'one_time']).default('monthly'),
  isFixed: z.boolean().default(false),
  isEssential: z.boolean().default(true),
  notes: z.string().optional(),
})

export async function createExpense(data: z.infer<typeof ExpenseSchema>) {
  const parsed = ExpenseSchema.parse(data)
  const expense = await prisma.expense.create({ data: parsed })
  revalidatePath('/expenses')
  revalidatePath('/dashboard')
  return expense
}

export async function updateExpense(id: string, data: Partial<z.infer<typeof ExpenseSchema>>) {
  const expense = await prisma.expense.update({ where: { id }, data })
  revalidatePath('/expenses')
  revalidatePath('/dashboard')
  return expense
}

export async function deleteExpense(id: string) {
  await prisma.expense.update({ where: { id }, data: { isActive: false } })
  revalidatePath('/expenses')
  revalidatePath('/dashboard')
}

export async function createCategory(data: { name: string; icon?: string; color?: string; isH1b?: boolean; isFixed?: boolean }) {
  const category = await prisma.expenseCategory.create({ data })
  revalidatePath('/expenses')
  return category
}

export async function getOrCreateExpenseCategory(name: string): Promise<string> {
  let cat = await prisma.expenseCategory.findFirst({ where: { name } })
  if (!cat) cat = await prisma.expenseCategory.create({ data: { name, sortOrder: 99 } })
  return cat.id
}
