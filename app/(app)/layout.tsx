import { AppShell } from '@/components/layout/AppShell'
import { prisma } from '@/lib/db'

async function getPendingReminders() {
  try {
    const count = await prisma.reminder.count({
      where: { isCompleted: false, dueDate: { lte: new Date() } },
    })
    return count
  } catch {
    return 0
  }
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const pendingReminders = await getPendingReminders()

  return (
    <AppShell pendingReminders={pendingReminders}>
      {children}
    </AppShell>
  )
}
