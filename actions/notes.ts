'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function createNote(data: { title: string; body: string; tags?: string; isPinned?: boolean }) {
  const note = await prisma.note.create({ data })
  revalidatePath('/notes')
  return note
}

export async function updateNote(id: string, data: { title?: string; body?: string; tags?: string; isPinned?: boolean }) {
  const note = await prisma.note.update({ where: { id }, data })
  revalidatePath('/notes')
  return note
}

export async function deleteNote(id: string) {
  await prisma.note.delete({ where: { id } })
  revalidatePath('/notes')
}

export async function createReflection(data: { title: string; body: string; mood?: string; period?: string }) {
  const reflection = await prisma.reflection.create({ data })
  revalidatePath('/notes')
  return reflection
}

export async function updateReflection(id: string, data: { title?: string; body?: string; mood?: string }) {
  const reflection = await prisma.reflection.update({ where: { id }, data })
  revalidatePath('/notes')
  return reflection
}

export async function deleteReflection(id: string) {
  await prisma.reflection.delete({ where: { id } })
  revalidatePath('/notes')
}

export async function getNotes() {
  return prisma.note.findMany({ orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }] })
}

export async function getReflections() {
  return prisma.reflection.findMany({ orderBy: { createdAt: 'desc' } })
}
