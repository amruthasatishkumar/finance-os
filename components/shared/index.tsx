import { cn, formatCurrency } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'
export { InfoTooltip } from './InfoTooltip'
import { InfoTooltip } from './InfoTooltip'

interface SectionHeaderProps {
  title: string
  subtitle?: string
  tooltip?: string
  action?: React.ReactNode
  children?: React.ReactNode
  className?: string
}

export function SectionHeader({ title, subtitle, tooltip, action, children, className }: SectionHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between', className)}>
      <div>
        <h2 className="text-lg font-semibold text-[#F8FAFC] flex items-center gap-2">{title}{tooltip && <InfoTooltip text={tooltip} />}</h2>
        {subtitle && <p className="text-sm text-[#64748B] mt-0.5">{subtitle}</p>}
      </div>
      {(action || children) && (
        <div className="flex items-center gap-2 ml-4 flex-shrink-0">
          {action}
          {children}
        </div>
      )}
    </div>
  )
}

// ─── CurrencyDisplay ──────────────────────────────────────────────────────────

interface CurrencyDisplayProps {
  amount: number
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
  color?: string
  compact?: boolean
  showSign?: boolean
  className?: string
}

const sizeMap = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
  '3xl': 'text-3xl',
}

export function CurrencyDisplay({
  amount,
  size = 'md',
  color,
  compact = false,
  showSign = false,
  className,
}: CurrencyDisplayProps) {
  const formatted = formatCurrency(Math.abs(amount), 'USD', compact)
  const sign = showSign ? (amount >= 0 ? '+' : '-') : amount < 0 ? '-' : ''

  return (
    <span
      className={cn(
        'tabular-nums font-semibold',
        sizeMap[size],
        color ?? (amount >= 0 ? 'text-[#F8FAFC]' : 'text-red-400'),
        className,
      )}
    >
      {sign}{formatted}
    </span>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon?: LucideIcon | string
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}>
      {Icon && (
        <div className="w-12 h-12 rounded-xl bg-[#1E293B] flex items-center justify-center mb-4">
          {typeof Icon === 'string' ? (
            <span className="text-2xl">{Icon}</span>
          ) : (
            <Icon className="w-6 h-6 text-[#475569]" />
          )}
        </div>
      )}
      <h3 className="text-[#94A3B8] font-medium mb-1">{title}</h3>
      {description && <p className="text-sm text-[#64748B] max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────

interface SkeletonProps {
  className?: string
  count?: number
  height?: number
}

export function Skeleton({ className, count = 1, height = 16 }: SkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn('skeleton rounded-md', className)}
          style={{ height }}
        />
      ))}
    </>
  )
}

// ─── Badge ────────────────────────────────────────────────────────────────────

interface BadgeProps {
  label: string
  color?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple'
  size?: 'sm' | 'md'
  className?: string
}

const badgeColors = {
  default: 'bg-[#334155] text-[#94A3B8]',
  success: 'bg-emerald-500/15 text-emerald-400',
  warning: 'bg-amber-500/15 text-amber-400',
  danger: 'bg-red-500/15 text-red-400',
  info: 'bg-cyan-500/15 text-cyan-400',
  purple: 'bg-violet-500/15 text-violet-400',
}

export function Badge({ label, color = 'default', size = 'sm', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
        badgeColors[color],
        className,
      )}
    >
      {label}
    </span>
  )
}

// ─── Alert Banner ─────────────────────────────────────────────────────────────

interface AlertBannerProps {
  type?: 'info' | 'warning' | 'danger' | 'success'
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

const alertStyles = {
  info: { border: 'border-indigo-500/30', bg: 'bg-indigo-500/10', title: 'text-indigo-300', desc: 'text-indigo-400/80', bar: 'bg-indigo-500' },
  warning: { border: 'border-amber-500/30', bg: 'bg-amber-500/10', title: 'text-amber-300', desc: 'text-amber-400/80', bar: 'bg-amber-500' },
  danger: { border: 'border-red-500/30', bg: 'bg-red-500/10', title: 'text-red-300', desc: 'text-red-400/80', bar: 'bg-red-500' },
  success: { border: 'border-emerald-500/30', bg: 'bg-emerald-500/10', title: 'text-emerald-300', desc: 'text-emerald-400/80', bar: 'bg-emerald-500' },
}

export function AlertBanner({ type = 'info', title, description, action, className }: AlertBannerProps) {
  const s = alertStyles[type]
  return (
    <div className={cn('flex items-start gap-3 p-4 rounded-xl border relative overflow-hidden', s.border, s.bg, className)}>
      <div className={cn('absolute left-0 top-0 bottom-0 w-0.5', s.bar)} />
      <div className="ml-2 flex-1">
        <p className={cn('text-sm font-semibold', s.title)}>{title}</p>
        {description && <p className={cn('text-xs mt-0.5', s.desc)}>{description}</p>}
        {action && <div className="mt-2">{action}</div>}
      </div>
    </div>
  )
}
