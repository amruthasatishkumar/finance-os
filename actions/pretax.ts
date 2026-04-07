'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const DeductionSchema = z.object({
  name: z.string().min(1, 'Name required'),
  type: z.string().min(1),
  monthlyAmount: z.coerce.number().min(0, 'Amount must be non-negative'),
  notes: z.string().optional(),
})

type DeductionData = z.infer<typeof DeductionSchema>

/** After any mutation, sync the total annual pre-tax deductions back to FinancialAssumptions */
async function syncPreTaxTotal() {
  const deductions = await prisma.preTaxDeduction.findMany({ where: { isActive: true } })
  const annualTotal = deductions.reduce((sum, d) => sum + d.monthlyAmount * 12, 0)
  const assumptions = await prisma.financialAssumptions.findFirst()
  if (assumptions) {
    await prisma.financialAssumptions.update({
      where: { id: assumptions.id },
      data: { preTaxDeductions: annualTotal },
    })
  }
}

export async function getPreTaxDeductions() {
  return prisma.preTaxDeduction.findMany({ where: { isActive: true }, orderBy: { createdAt: 'asc' } })
}

export async function createPreTaxDeduction(data: DeductionData) {
  const parsed = DeductionSchema.parse(data)
  const created = await prisma.preTaxDeduction.create({ data: parsed })
  await syncPreTaxTotal()
  revalidatePath('/income')
  revalidatePath('/dashboard')
  return created
}

export async function updatePreTaxDeduction(id: string, data: DeductionData) {
  const parsed = DeductionSchema.parse(data)
  const updated = await prisma.preTaxDeduction.update({ where: { id }, data: parsed })
  await syncPreTaxTotal()
  revalidatePath('/income')
  revalidatePath('/dashboard')
  return updated
}

export async function deletePreTaxDeduction(id: string) {
  await prisma.preTaxDeduction.delete({ where: { id } })
  await syncPreTaxTotal()
  revalidatePath('/income')
  revalidatePath('/dashboard')
}
