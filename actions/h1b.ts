'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const VisaInfoSchema = z.object({
  visaType: z.string().default('H1B'),
  expiryDate: z.string().optional(),
  sponsorEmployer: z.string().optional(),
  gcPetitionStage: z.string().default('none'),
  priorityDate: z.string().optional(),
  estimatedGcCost: z.coerce.number().default(25000),
  gcCostSaved: z.coerce.number().default(0),
  lastH1bRenewalDate: z.string().optional(),
  nextH1bRenewalDue: z.string().optional(),
  passportExpiry: z.string().optional(),
  notes: z.string().optional(),
})

export async function updateVisaInfo(data: z.infer<typeof VisaInfoSchema>) {
  const parsed = VisaInfoSchema.parse(data)
  const visa = await prisma.visaInfo.findFirst()
  if (!visa) {
    const profile = await prisma.userProfile.findFirst()
    if (!profile) throw new Error('No profile found')
    await prisma.visaInfo.create({
      data: {
        userId: profile.id,
        ...parsed,
        expiryDate: parsed.expiryDate ? new Date(parsed.expiryDate) : undefined,
        priorityDate: parsed.priorityDate ? new Date(parsed.priorityDate) : undefined,
        lastH1bRenewalDate: parsed.lastH1bRenewalDate ? new Date(parsed.lastH1bRenewalDate) : undefined,
        nextH1bRenewalDue: parsed.nextH1bRenewalDue ? new Date(parsed.nextH1bRenewalDue) : undefined,
        passportExpiry: parsed.passportExpiry ? new Date(parsed.passportExpiry) : undefined,
      },
    })
  } else {
    await prisma.visaInfo.update({
      where: { id: visa.id },
      data: {
        ...parsed,
        expiryDate: parsed.expiryDate ? new Date(parsed.expiryDate) : undefined,
        priorityDate: parsed.priorityDate ? new Date(parsed.priorityDate) : undefined,
        lastH1bRenewalDate: parsed.lastH1bRenewalDate ? new Date(parsed.lastH1bRenewalDate) : undefined,
        nextH1bRenewalDue: parsed.nextH1bRenewalDue ? new Date(parsed.nextH1bRenewalDue) : undefined,
        passportExpiry: parsed.passportExpiry ? new Date(parsed.passportExpiry) : undefined,
      },
    })
  }
  revalidatePath('/h1b')
  revalidatePath('/dashboard')
}

export async function addRemittanceLog(data: {
  amount: number
  currency: string
  toCountry: string
  method: string
  exchangeRate?: number
  notes?: string
}) {
  const log = await prisma.remittanceLog.create({ data })
  revalidatePath('/h1b')
  return log
}

export async function getRemittanceLogs() {
  return prisma.remittanceLog.findMany({ orderBy: { createdAt: 'desc' }, take: 50 })
}

export async function deleteRemittanceLog(id: string) {
  await prisma.remittanceLog.delete({ where: { id } })
  revalidatePath('/h1b')
}
