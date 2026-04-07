'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Bell, ChevronRight, RefreshCw, X, Trash2, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { resetOnboarding } from '@/actions/profile'
import { clearFinancialData } from '@/actions/data'

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': { title: 'Dashboard', subtitle: 'Your financial command center' },
  '/income': { title: 'Income', subtitle: 'Manage all your income sources' },
  '/expenses': { title: 'Expenses', subtitle: 'Track and analyze your spending' },
  '/debt': { title: 'Debt Planner', subtitle: 'Path to debt freedom' },
  '/investments': { title: 'Investments', subtitle: 'Portfolio & projections' },
  '/goals': { title: 'Goals', subtitle: 'Plan your financial milestones' },
  '/roadmap': { title: 'Long-term Roadmap', subtitle: 'Your 30-year financial timeline' },
  '/simulator': { title: 'Scenario Simulator', subtitle: 'Model your financial future' },
  '/h1b': { title: 'H1B Command Center', subtitle: 'Visa, green card & cross-border planning' },
  '/assistant': { title: 'AI Assistant', subtitle: 'Your personal CFO' },
  '/reports': { title: 'Reports & Insights', subtitle: 'Monthly and annual analysis' },
  '/notes': { title: 'Notes & Reflections', subtitle: 'Your money journal' },
  '/vault': { title: 'Document Vault', subtitle: 'Important documents index' },
  '/settings': { title: 'Settings', subtitle: 'Preferences and assumptions' },
}

interface HeaderProps {
  pendingReminders: number
}

export function Header({ pendingReminders }: HeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const page = pageTitles[pathname] ?? { title: 'Finance OS', subtitle: 'Personal Finance Command Center' }
  const [showWizard, setShowWizard] = useState(false)
  const [showReset, setShowReset] = useState(false)
  const [launching, setLaunching] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [resetDone, setResetDone] = useState(false)

  async function handleLaunchWizard() {
    setLaunching(true)
    await resetOnboarding()
    router.push('/onboarding')
  }

  async function handleReset() {
    setResetting(true)
    await clearFinancialData()
    setResetting(false)
    setResetDone(true)
    setTimeout(() => {
      setShowReset(false)
      setResetDone(false)
      router.push('/dashboard')
      router.refresh()
    }, 1200)
  }

  return (
    <>
    <header className="flex items-center justify-between px-6 py-4 border-b border-[#1E293B] bg-[#0B1120]/80 backdrop-blur-sm">
      <div>
        <div className="flex items-center gap-2 text-[#64748B] text-xs mb-1">
          <span>Finance OS</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-[#94A3B8]">{page.title}</span>
        </div>
        <h1 className="text-lg font-semibold text-[#F8FAFC] leading-none">{page.title}</h1>
        <p className="text-xs text-[#64748B] mt-0.5">{page.subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Reset Data button */}
        <button
          onClick={() => setShowReset(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/10 border border-red-500/20 text-red-400 hover:bg-red-600/20 text-xs font-medium transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="hidden sm:block">Reset Data</span>
        </button>

        {/* Setup Wizard button */}
        <button
          onClick={() => setShowWizard(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-600/30 text-xs font-medium transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="hidden sm:block">Setup</span>
        </button>

        {/* Notifications */}
        <Link href="/settings" className="relative p-2 rounded-lg hover:bg-[#1E293B] transition-colors">
          <Bell className="w-4 h-4 text-[#64748B] hover:text-[#94A3B8]" />
          {pendingReminders > 0 && (
            <span className={cn(
              'absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center px-1',
            )}>
              {pendingReminders > 9 ? '9+' : pendingReminders}
            </span>
          )}
        </Link>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
          <span className="text-xs font-semibold text-indigo-400">AS</span>
        </div>
      </div>
    </header>

      {/* Setup Wizard Modal — outside <header> to avoid backdrop-filter stacking context */}
      {showWizard && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setShowWizard(false)}>
          <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 flex items-center justify-center">
                  <RefreshCw className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-white font-semibold">Setup Wizard</h2>
                  <p className="text-xs text-[#64748B]">10-step financial setup</p>
                </div>
              </div>
              <button onClick={() => setShowWizard(false)} className="p-2 hover:bg-[#1E293B] rounded-xl transition-colors">
                <X className="w-4 h-4 text-[#64748B]" />
              </button>
            </div>
            <p className="text-sm text-[#94A3B8] mb-4">
              Walk through the full setup to update your profile, income sources, expenses, goals, and more. Your existing data will not be deleted.
            </p>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 text-xs text-amber-300 mb-5">
              💡 Tip: Use the individual pages (Income, Expenses, Goals, etc.) to make targeted edits without running the full wizard.
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowWizard(false)}
                className="flex-1 px-4 py-2.5 bg-[#1E293B] hover:bg-[#334155] text-[#94A3B8] rounded-xl text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLaunchWizard}
                disabled={launching}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white rounded-xl text-sm font-medium transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${launching ? 'animate-spin' : ''}`} />
                {launching ? 'Redirecting...' : 'Launch Wizard'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Reset Confirmation Modal */}
      {showReset && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => !resetting && setShowReset(false)}>
          <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h2 className="text-white font-semibold">Reset All Data</h2>
                  <p className="text-xs text-[#64748B]">This cannot be undone</p>
                </div>
              </div>
              <button onClick={() => setShowReset(false)} disabled={resetting} className="p-2 hover:bg-[#1E293B] rounded-xl transition-colors">
                <X className="w-4 h-4 text-[#64748B]" />
              </button>
            </div>
            <p className="text-sm text-[#94A3B8] mb-4">
              This will permanently delete all your income sources, expenses, debts, assets, investments, and goals. Your profile and settings will be kept.
            </p>
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-xs text-red-300 mb-5">
              ⚠️ All financial data will be wiped. Run Setup again to re-enter your data.
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowReset(false)}
                disabled={resetting}
                className="flex-1 px-4 py-2.5 bg-[#1E293B] hover:bg-[#334155] text-[#94A3B8] rounded-xl text-sm transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                disabled={resetting || resetDone}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white rounded-xl text-sm font-medium transition-colors"
              >
                <Trash2 className={`w-4 h-4 ${resetting ? 'animate-pulse' : ''}`} />
                {resetDone ? 'Cleared!' : resetting ? 'Clearing...' : 'Reset All Data'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
