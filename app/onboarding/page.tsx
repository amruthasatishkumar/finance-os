import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard'

export default async function OnboardingPage() {
  const profile = await prisma.userProfile.findFirst()
  if (profile?.onboardingComplete) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-6">
      <OnboardingWizard />
    </div>
  )
}
