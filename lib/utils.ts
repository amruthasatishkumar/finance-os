import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(
  amount: number,
  currency = 'USD',
  compact = false,
): string {
  if (compact && Math.abs(amount) >= 1000) {
    if (Math.abs(amount) >= 1_000_000) {
      return `${currency === 'USD' ? '$' : ''}${(amount / 1_000_000).toFixed(1)}M`
    }
    if (Math.abs(amount) >= 1_000) {
      return `${currency === 'USD' ? '$' : ''}${(amount / 1_000).toFixed(1)}k`
    }
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}

export function formatNumber(value: number, compact = false): string {
  if (compact) {
    if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
    if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}k`
  }
  return new Intl.NumberFormat('en-US').format(value)
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function getMonthKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function monthsUntil(targetDate: Date): number {
  const now = new Date()
  return (
    (targetDate.getFullYear() - now.getFullYear()) * 12 +
    (targetDate.getMonth() - now.getMonth())
  )
}

export function daysUntil(targetDate: Date): number {
  const now = new Date()
  const diff = targetDate.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export function addMonths(date: Date, months: number): Date {
  const result = new Date(date)
  result.setMonth(result.getMonth() + months)
  return result
}

export function inflationAdjust(
  amount: number,
  years: number,
  inflationRate = 0.035,
): number {
  return amount * Math.pow(1 + inflationRate, years)
}

export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-400'
  if (score >= 60) return 'text-amber-400'
  if (score >= 40) return 'text-orange-400'
  return 'text-red-400'
}

export function getScoreLabel(score: number): string {
  if (score >= 90) return 'Excellent'
  if (score >= 80) return 'Great'
  if (score >= 70) return 'Good'
  if (score >= 60) return 'Fair'
  if (score >= 50) return 'Needs Work'
  return 'Critical'
}

export function getProgressColor(progress: number): string {
  if (progress >= 75) return 'bg-emerald-500'
  if (progress >= 50) return 'bg-indigo-500'
  if (progress >= 25) return 'bg-amber-500'
  return 'bg-red-500'
}

export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str
  return str.slice(0, maxLen - 3) + '...'
}

export function range(start: number, end: number): number[] {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
}

export function normalizeToMonthly(amount: number, frequency: string): number {
  switch (frequency) {
    case 'weekly': return amount * 52 / 12
    case 'biweekly': return amount * 26 / 12
    case 'monthly': return amount
    case 'quarterly': return amount / 3
    case 'annual': return amount / 12
    case 'one_time': return 0
    default: return amount
  }
}
