import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const doc = await prisma.document.create({
    data: {
      name: body.name,
      type: body.type,
      notes: body.notes || null,
      isPinned: body.isPinned ?? false,
      expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
    },
  })
  return NextResponse.json(doc)
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return new NextResponse('Missing id', { status: 400 })
  await prisma.document.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
}
