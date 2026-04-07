'use client'

import { motion } from 'framer-motion'
import { cn, formatCurrency, getScoreColor } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { InfoTooltip } from './InfoTooltip'

interface MetricCardProps {
  title: string
  tooltip?: string
  value: number | string
  subtitle?: string
  trend?: number        // percentage change, positive = good
  trendLabel?: string
  isCurrency?: boolean
  isPercent?: boolean
  prefix?: string
  suffix?: string
  className?: string
  delay?: number
  compact?: boolean
  accent?: 'primary' | 'success' | 'warning' | 'danger' | 'gold'
  icon?: React.ReactNode
  color?: 'indigo' | 'emerald' | 'amber' | 'red' | 'violet' | 'cyan' | 'pink' | string
}

const colorMap: Record<string, { bar: string; text: string; bg: string }> = {
  indigo:  { bar: 'bg-indigo-500',  text: 'text-indigo-400',  bg: 'border-t-indigo-500/40' },
  emerald: { bar: 'bg-emerald-500', text: 'text-emerald-400', bg: 'border-t-emerald-500/40' },
  amber:   { bar: 'bg-amber-500',   text: 'text-amber-400',   bg: 'border-t-amber-500/40' },
  red:     { bar: 'bg-red-500',     text: 'text-red-400',     bg: 'border-t-red-500/40' },
  violet:  { bar: 'bg-violet-500',  text: 'text-violet-400',  bg: 'border-t-violet-500/40' },
  cyan:    { bar: 'bg-cyan-500',    text: 'text-cyan-400',    bg: 'border-t-cyan-500/40' },
  pink:    { bar: 'bg-pink-500',    text: 'text-pink-400',    bg: 'border-t-pink-500/40' },
}

const accentToColor: Record<string, string> = {
  primary: 'indigo', success: 'emerald', warning: 'amber', danger: 'red', gold: 'amber',
}

export function MetricCard({
  title,
  tooltip,
  value,
  subtitle,
  trend,
  trendLabel,
  isCurrency = false,
  isPercent = false,
  prefix,
  suffix,
  className,
  delay = 0,
  compact = false,
  accent,
  icon,
  color,
}: MetricCardProps) {
  const formattedValue = isCurrency
    ? formatCurrency(Number(value))
    : isPercent
      ? `${Number(value).toFixed(1)}%`
      : String(value)

  const trendIcon = trend === undefined ? null : trend > 0
    ? <TrendingUp className="w-3 h-3" />
    : trend < 0
      ? <TrendingDown className="w-3 h-3" />
      : <Minus className="w-3 h-3" />

  const trendColor = trend === undefined ? '' : trend > 0
    ? 'text-emerald-400'
    : trend < 0
      ? 'text-red-400'
      : 'text-[#64748B]'

  // Resolve color key from either `color` prop or `accent` prop
  const colorKey = color ?? (accent ? accentToColor[accent] : undefined)
  const colorStyle = colorKey ? colorMap[colorKey] : undefined

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className={cn(
        'card p-4 hover:border-[#475569] transition-all duration-200 relative overflow-hidden',
        className,
      )}
    >
      {/* Color accent top bar */}
      {colorStyle && (
        <div className={cn('absolute top-0 left-0 right-0 h-0.5', colorStyle.bar)} />
      )}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <p className="text-xs text-[#64748B] font-medium uppercase tracking-wider">{title}</p>
          {tooltip && <InfoTooltip text={tooltip} />}
        </div>
        {icon && colorStyle && (
          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', colorStyle.bg.replace('border-t-', 'bg-').replace('/40', '/15'))}>
            <span className={colorStyle.text}>{icon}</span>
          </div>
        )}
      </div>
      <p className={cn(
        'tabular-nums font-bold text-[#F8FAFC] leading-none',
        compact ? 'text-xl' : 'text-2xl',
        colorStyle?.text,
      )}>
        {prefix && <span className="text-[#94A3B8] font-normal mr-0.5">{prefix}</span>}
        {formattedValue}
        {suffix && <span className="text-[#94A3B8] font-normal ml-0.5 text-base">{suffix}</span>}
      </p>
      {(subtitle || trend !== undefined) && (
        <div className="flex items-center gap-2 mt-2">
          {trend !== undefined && (
            <span className={cn('flex items-center gap-0.5 text-xs font-medium', trendColor)}>
              {trendIcon}
              {Math.abs(trend).toFixed(1)}%
            </span>
          )}
          {subtitle && (
            <span className="text-xs text-[#64748B]">{subtitle}</span>
          )}
          {trendLabel && (
            <span className="text-xs text-[#64748B]">{trendLabel}</span>
          )}
        </div>
      )}
    </motion.div>
  )
}
