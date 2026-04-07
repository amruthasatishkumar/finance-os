import { prisma } from '@/lib/db'
import { VaultClient } from '@/components/vault/VaultClient'

export default async function VaultPage() {
  const documents = await prisma.document.findMany({ orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }] })
  return <VaultClient documents={documents} />
}
