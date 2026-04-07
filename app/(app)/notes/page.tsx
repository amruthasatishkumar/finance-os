import { getNotes, getReflections } from '@/actions/notes'
import { NotesClient } from '@/components/notes/NotesClient'

export default async function NotesPage() {
  const [notes, reflections] = await Promise.all([getNotes(), getReflections()])
  return <NotesClient notes={notes} reflections={reflections} />
}
