import { prisma } from '@/lib/db'
import { SettingsClient } from '@/components/settings/SettingsClient'

export default async function SettingsPage() {
  const [profile, assumptions] = await Promise.all([
    prisma.userProfile.findFirst(),
    prisma.financialAssumptions.findFirst(),
  ])

  return <SettingsClient profile={profile} assumptions={assumptions} />
}
