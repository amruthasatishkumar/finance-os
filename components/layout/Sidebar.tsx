'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  TrendingUp,
  CreditCard,
  Target,
  Landmark,
  BarChart3,
  GitBranch,
  Zap,
  Map,
  Bot,
  BookOpen,
  Settings,
  ChevronLeft,
  DollarSign,
  ShieldCheck,
} from 'lucide-react'

const navItems = [
  {
    group: 'Overview',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/reports', label: 'Reports', icon: BarChart3 },
    ],
  },
  {
    group: 'Money',
    items: [
      { href: '/income', label: 'Income', icon: DollarSign },
      { href: '/expenses', label: 'Expenses', icon: CreditCard },
      { href: '/debt', label: 'Debt', icon: Landmark },
      { href: '/investments', label: 'Investments', icon: TrendingUp },
    ],
  },
  {
    group: 'Planning',
    items: [
      { href: '/goals', label: 'Goals', icon: Target },
      { href: '/roadmap', label: 'Long-term Roadmap', icon: Map },
      { href: '/simulator', label: 'Scenario Simulator', icon: Zap },
    ],
  },
  {
    group: 'H1B & Visa',
    items: [
      { href: '/h1b', label: 'H1B Command Center', icon: ShieldCheck,
        badge: '⚠️' },
    ],
  },
  {
    group: 'Intelligence',
    items: [
      { href: '/assistant', label: 'AI Assistant', icon: Bot },
    ],
  },
  {
    group: 'Personal',
    items: [
      { href: '/notes', label: 'Notes & Reflections', icon: BookOpen },
    ],
  },
  {
    group: 'System',
    items: [
      { href: '/settings', label: 'Settings', icon: Settings },
    ],
  },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        'flex flex-col h-full bg-[#0B1120] border-r border-[#1E293B] transition-all duration-300 relative',
        collapsed ? 'w-16' : 'w-64',
      )}
    >
      {/* Logo */}
      <div className={cn(
        'flex items-center gap-3 px-4 py-5 border-b border-[#1E293B]',
        collapsed && 'justify-center px-0'
      )}>
        <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
          <GitBranch className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <div>
            <p className="text-sm font-bold text-white leading-none">Finance OS</p>
            <p className="text-[10px] text-[#64748B] mt-0.5">Personal Command Center</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 space-y-0.5 px-2">
        {navItems.map((group) => (
          <div key={group.group} className="mb-2">
            {!collapsed && (
              <p className="text-[10px] font-semibold text-[#475569] uppercase tracking-wider px-2 py-1.5 mb-0.5">
                {group.group}
              </p>
            )}
            {group.items.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    'flex items-center gap-3 px-2 py-2 rounded-lg text-sm transition-all duration-150 group relative',
                    collapsed ? 'justify-center' : '',
                    isActive
                      ? 'bg-indigo-500/15 text-indigo-400 font-medium'
                      : 'text-[#94A3B8] hover:bg-[#1E293B] hover:text-[#F8FAFC]',
                  )}
                >
                  <Icon className={cn('w-4 h-4 flex-shrink-0', isActive ? 'text-indigo-400' : 'text-[#64748B] group-hover:text-[#94A3B8]')} />
                  {!collapsed && (
                    <>
                      <span className="flex-1">{item.label}</span>
                      {'badge' in item && item.badge && (
                        <span className="text-xs">{item.badge}</span>
                      )}
                    </>
                  )}
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-indigo-500 rounded-r-full" />
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="flex items-center justify-center w-full py-3 border-t border-[#1E293B] text-[#64748B] hover:text-[#94A3B8] transition-colors"
      >
        <ChevronLeft className={cn('w-4 h-4 transition-transform duration-300', collapsed && 'rotate-180')} />
        {!collapsed && <span className="text-xs ml-1.5">Collapse</span>}
      </button>
    </aside>
  )
}
