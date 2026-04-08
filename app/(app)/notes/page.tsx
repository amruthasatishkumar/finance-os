import { prisma } from '@/lib/db'
import { NotesClient } from '@/components/notes/NotesClient'

export default async function NotesPage() {
  const [notes, reflections] = await Promise.all([
    prisma.note.findMany({ orderBy: [{ isPinned: 'desc' }, { updatedAt: 'desc' }] }),
    prisma.reflection.findMany({ orderBy: { period: 'desc' }, take: 12 }),
  ])

  return <NotesClient notes={notes} reflections={reflections} />
}
