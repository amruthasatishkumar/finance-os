'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const GoalSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  targetAmount: z.coerce.number().min(1),
  currentAmount: z.coerce.number().min(0).default(0),
  targetDate: z.string().optional(),
  priority: z.coerce.number().min(1).max(10).default(5),
  monthlyContrib: z.coerce.number().min(0).default(0),
  whyItMatters: z.string().optional(),
  isInflationAdjusted: z.boolean().default(true),
  icon: z.string().optional(),
  color: z.string().optional(),
  notes: z.string().optional(),
})

export async function createGoal(data: z.infer<typeof GoalSchema>) {
  const parsed = GoalSchema.parse(data)
  const goal = await prisma.goal.create({
    data: {
      ...parsed,
      targetDate: parsed.targetDate ? new Date(parsed.targetDate) : undefined,
    },
  })
  revalidatePath('/goals')
  revalidatePath('/dashboard')
  return goal
}

export async function updateGoal(id: string, data: Partial<z.infer<typeof GoalSchema>> & { status?: string }) {
  const goal = await prisma.goal.update({
    where: { id },
    data: {
      ...data,
      targetDate: data.targetDate ? new Date(data.targetDate) : undefined,
    },
  })
  revalidatePath('/goals')
  revalidatePath('/dashboard')
  return goal
}

export async function deleteGoal(id: string) {
  await prisma.goal.update({ where: { id }, data: { status: 'cancelled' } })
  revalidatePath('/goals')
  revalidatePath('/dashboard')
}

export async function addGoalContribution(goalId: string, amount: number, notes?: string, date?: string) {
  const goal = await prisma.goal.findUnique({ where: { id: goalId } })
  if (!goal) throw new Error('Goal not found')
  const updated = await prisma.goal.update({
    where: { id: goalId },
    data: { currentAmount: goal.currentAmount + amount },
  })
  if (updated.currentAmount >= updated.targetAmount) {
    await prisma.goal.update({ where: { id: goalId }, data: { status: 'completed' } })
  }
  await prisma.goalContribution.create({
    data: {
      goalId,
      amount,
      notes: notes || null,
      date: date ? new Date(date) : new Date(),
    },
  })
  revalidatePath('/goals')
  revalidatePath('/dashboard')
  return updated
}

export async function getGoalContributions(goalId: string) {
  return prisma.goalContribution.findMany({
    where: { goalId },
    orderBy: { date: 'desc' },
  })
}

export async function createMilestone(data: {
  goalId: string
  name: string
  amount: number
  targetDate?: string
}) {
  const milestone = await prisma.goalMilestone.create({
    data: {
      ...data,
      targetDate: data.targetDate ? new Date(data.targetDate) : undefined,
    },
  })
  revalidatePath('/goals')
  return milestone
}

export async function completeMilestone(id: string) {
  const milestone = await prisma.goalMilestone.update({
    where: { id },
    data: { isCompleted: true, completedAt: new Date() },
  })
  revalidatePath('/goals')
  return milestone
}
